import { create } from "zustand";
import { persist } from "zustand/middleware";
import { yayin } from "@/lib/realtime";
import { storeKaydet } from "@/lib/db";
import { throttle } from "@/lib/bildirimler/throttle";
import { getKullaniciId } from "@/lib/auth";
import type { Silinebilir } from "@/lib/silinebilir";

/** Verilen "HH:MM–HH:MM" aralığının şu anı kapsayıp kapsamadığını döner. Gece yarısını aşan aralıkları da destekler. */
function sessizSaatIcinde(baslangic: string, bitis: string): boolean {
  const simdi   = new Date();
  const simdMin = simdi.getHours() * 60 + simdi.getMinutes();
  const [bh, bm] = baslangic.split(":").map(Number);
  const [eh, em] = bitis.split(":").map(Number);
  const basMin   = bh * 60 + bm;
  const bitMin   = eh * 60 + em;
  if (basMin <= bitMin) return simdMin >= basMin && simdMin < bitMin;
  return simdMin >= basMin || simdMin < bitMin;
}

export type ModulKey =
  | "stok" | "nakit-akisi" | "kar-zarar"
  | "gorevler" | "prosedurler" | "acil-fon";

export type BildirimTip   = "kritik" | "uyari" | "bilgi" | "basari";
export type BildirimModul = ModulKey | "sistem" | "ekip";

export interface Bildirim extends Silinebilir {
  id:           string;
  tip:          BildirimTip;
  modul:        BildirimModul;
  baslik:       string;
  mesaj:        string;
  tarih:        string;
  okundu:       boolean;
  ilgiliLink?:  string;
  /** Kime gönderileceği — yoksa "herkes" kabul edilir */
  hedef?:       "pilot" | "copilot" | "herkes" | "sahip";
  /** Bildirimin kaynağı — yoksa "tarama" kabul edilir */
  kaynak?:      "olay" | "tarama" | "sistem" | "planli";
  /** Atomik iş olayı bağlantısı — iade gibi durumlarda temizlik için */
  olayId?:      string;
  sesCal?:      boolean;
  pushGonder?:  boolean;
  /** Bu tarihten sonra eski sayılır ve eskileriniSil() temizler */
  sonGecerlik?: string;
}

interface BildirimStore {
  bildirimler:       Bildirim[];
  sessizModu:        boolean;
  sessizBitis:       string | null;

  // Mevcut metodlar
  ekle:              (b: Omit<Bildirim, "tarih" | "okundu">) => Promise<void>;
  okunduYap:         (id: string) => void;
  okunduToggle:      (id: string) => void;
  tumunuOkunduYap:   () => void;
  sil:               (id: string) => void;
  geriAl:            (id: string) => void;
  kaliciSil:         (id: string) => void;
  silinenler:        () => Bildirim[];
  tumunuSil:         () => void;
  syncFromRemote:    (bildirimler: Bildirim[]) => void;
  sessizeAl:         (dakika: number | null) => void;
  sessizModuAc:      () => void;
  sessizKontrol:     () => void;

  // ADIM 1 — yeni metodlar
  okuOlarakIsaretle: (id: string) => void;
  tumunuOkuYap:      () => void;
  olayBildirimiSil:  (olayId: string) => void;
  eskileriniSil:     () => void;
  /**
   * Hedef + kullanıcı tercih filtresi uygulayarak bildirim ekler.
   * Tam filtreleme mantığı ADIM 5'te tamamlanır; bu versiyonda
   * sadece hedef/rol kontrolü yapılır.
   */
  hedefliEkle:       (b: Omit<Bildirim, "tarih" | "okundu">, mevcutRol: "pilot" | "copilot") => Promise<void>;
}

async function kaydet(bildirimler: Bildirim[]) {
  await storeKaydet("bildirimler", bildirimler);
}

export const useBildirimler = create<BildirimStore>()(
  persist(
    (set, get) => ({
      bildirimler: [],
      sessizModu:  false,
      sessizBitis: null,

      ekle: async (b) => {
        const existing = get().bildirimler.find((m) => m.id === b.id);
        if (existing) {
          if (existing.baslik !== b.baslik || existing.mesaj !== b.mesaj || existing.tip !== b.tip) {
            set((s) => ({
              bildirimler: s.bildirimler.map((m) =>
                m.id === b.id ? { ...m, baslik: b.baslik, mesaj: b.mesaj, tip: b.tip } : m
              ),
            }));
            kaydet(get().bildirimler);
          }
          return;
        }
        const yeni: Bildirim = { ...b, tarih: new Date().toISOString(), okundu: false };
        set((s) => ({ bildirimler: [yeni, ...s.bildirimler] }));
        yayin({ tip: "bildirimler", veri: get().bildirimler });
        await kaydet(get().bildirimler);
      },

      okunduYap: (id) => {
        set((s) => ({ bildirimler: s.bildirimler.map((b) => b.id === id ? { ...b, okundu: true } : b) }));
        yayin({ tip: "bildirimler", veri: get().bildirimler });
        kaydet(get().bildirimler);
      },

      okunduToggle: (id) => {
        set((s) => ({ bildirimler: s.bildirimler.map((b) => b.id === id ? { ...b, okundu: !b.okundu } : b) }));
        yayin({ tip: "bildirimler", veri: get().bildirimler });
        kaydet(get().bildirimler);
      },

      tumunuOkunduYap: () => {
        set((s) => ({ bildirimler: s.bildirimler.map((b) => ({ ...b, okundu: true })) }));
        yayin({ tip: "bildirimler", veri: get().bildirimler });
        kaydet(get().bildirimler);
      },

      sil: (id) => {
        const simdi = new Date().toISOString();
        set((s) => ({ bildirimler: s.bildirimler.map((b) => b.id === id ? { ...b, silindi: true, silinmeTarihi: simdi } : b) }));
        yayin({ tip: "bildirimler", veri: get().bildirimler });
        kaydet(get().bildirimler);
      },

      geriAl: (id) => {
        set((s) => ({ bildirimler: s.bildirimler.map((b) => b.id === id ? { ...b, silindi: false, silinmeTarihi: undefined } : b) }));
        yayin({ tip: "bildirimler", veri: get().bildirimler });
        kaydet(get().bildirimler);
      },

      kaliciSil: (id) => {
        set((s) => ({ bildirimler: s.bildirimler.filter((b) => b.id !== id) }));
        yayin({ tip: "bildirimler", veri: get().bildirimler });
        kaydet(get().bildirimler);
      },

      silinenler: () => get().bildirimler.filter((b) => b.silindi === true),

      tumunuSil: () => {
        const simdi = new Date().toISOString();
        set((s) => ({ bildirimler: s.bildirimler.map((b) => ({ ...b, silindi: true, silinmeTarihi: simdi })) }));
        yayin({ tip: "bildirimler", veri: get().bildirimler });
        kaydet(get().bildirimler);
      },

      syncFromRemote: (remote) => {
        if (remote.length === 0 && get().bildirimler.length > 0) return;
        set({ bildirimler: remote });
      },

      sessizeAl: (dakika) => {
        const bitis = dakika === null
          ? null
          : new Date(Date.now() + dakika * 60_000).toISOString();
        set({ sessizModu: true, sessizBitis: bitis });
      },

      sessizModuAc: () => set({ sessizModu: false, sessizBitis: null }),

      sessizKontrol: () => {
        const { sessizModu, sessizBitis } = get();
        if (!sessizModu) return;
        if (sessizBitis && new Date(sessizBitis) <= new Date()) {
          set({ sessizModu: false, sessizBitis: null });
        }
      },

      // ── ADIM 1 — yeni metodlar ─────────────────────────────────────────

      okuOlarakIsaretle: (id) => get().okunduYap(id),

      tumunuOkuYap: () => get().tumunuOkunduYap(),

      olayBildirimiSil: (olayId) => {
        set((s) => ({ bildirimler: s.bildirimler.filter((b) => b.olayId !== olayId) }));
        yayin({ tip: "bildirimler", veri: get().bildirimler });
        kaydet(get().bildirimler);
      },

      eskileriniSil: () => {
        const simdi       = new Date();
        const otuzGunOnce = new Date(simdi.getTime() - 30 * 86_400_000);
        set((s) => ({
          bildirimler: s.bildirimler.filter((b) => {
            if (b.sonGecerlik && new Date(b.sonGecerlik) <= simdi) return false;
            if (b.okundu && new Date(b.tarih) <= otuzGunOnce)      return false;
            return true;
          }),
        }));
        kaydet(get().bildirimler);
      },

      hedefliEkle: async (b, mevcutRol) => {
        // 1. Hedef / rol filtresi
        const hedef = b.hedef ?? "herkes";
        if (hedef === "pilot"   && mevcutRol !== "pilot")   return;
        if (hedef === "copilot" && mevcutRol !== "copilot") return;

        // 2. Kullanıcı tercih filtresi (kritik her zaman geçer)
        const { useBildirimAyarlari } = await import("@/store/bildirimAyarlari");
        const ayarlar = useBildirimAyarlari.getState();
        if (b.tip !== "kritik") {
          if (ayarlar.modul[b.modul] === false) return;
          if (ayarlar.tip[b.tip]   === false) return;
        }

        // 3. Throttle (kritik istisna)
        if (b.tip !== "kritik") {
          if (!throttle(`${b.tip}-${b.modul}-${b.baslik}`)) return;
        }

        // 4. Sessiz saat — ses ve push'u kapat, bildirim yine de eklenir
        const { sessizSaat } = ayarlar;
        const sessiz = sessizSaat.aktif && sessizSaatIcinde(sessizSaat.baslangic, sessizSaat.bitis);
        const yayinB = sessiz ? { ...b, sesCal: false, pushGonder: false } : b;

        // 5. Store'a ekle
        await get().ekle(yayinB);
        const stored = get().bildirimler.find((bd) => bd.id === b.id);

        // 6. Ses ve push
        if (stored) {
          if (yayinB.sesCal && ayarlar.ses) {
            void import("@/lib/bildirimler/ses")
              .then(({ sesCal }) => sesCal(stored.tip))
              .catch(() => null);
          }
          if (
            yayinB.pushGonder && ayarlar.push &&
            typeof Notification !== "undefined" &&
            Notification.permission === "granted"
          ) {
            void import("@/lib/bildirimler/push")
              .then(({ pushGonder }) => pushGonder(stored))
              .catch(() => null);
          }

          // 5.2 Realtime — tek bildirim yayını (cross-device delivery)
          yayin({ tip: "bildirim", veri: { bildirim: stored, hedef: b.hedef } });
        }
      },
    }),
    {
      name: "pilot-bildirimler-v1",
      partialize: (s) => ({
        bildirimler: s.bildirimler,
        sessizModu:  s.sessizModu,
        sessizBitis: s.sessizBitis,
      }),
    }
  )
);
