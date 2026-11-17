import { useSirket }           from "@/store/sirket";
import { useNakit }            from "@/store/nakit";
import { useStok }             from "@/store/stok";
import { useGorevler }         from "@/store/gorevler";
import { useAcilFon }          from "@/store/acilFon";
import { useProsedurler }      from "@/store/prosedurler";
import { useBildirimler }      from "@/store/bildirimler";
import { useBildirimAyarlari } from "@/store/bildirimAyarlari";
import { TUM_KURALLAR }        from "./kurallar";
import { snoozeMi }            from "./snooze";
import { durumGetir, durumKaydet, durumSil } from "./durum";
import { sonAksiyonTarihi }    from "./aksiyonTakipci";
import { manuelKapaliMi, manuelKapaliKaldir } from "./manuelKapatma";
import type { Uyari }          from "./tipler";
import { debounce }            from "@/lib/utils";

export type { Uyari };
export { snoozeAl, snoozeMi, snoozeTemizle } from "./snooze";

// ─────────────────────────────────────────────────────────────────────────────

function degerKotulesti(yeni: number | undefined, eski: number): boolean {
  if (yeni === undefined) return false;
  return yeni < eski;
}

type BildirimStore = ReturnType<typeof useBildirimler.getState>;

function yeniBildirimEkle(
  uyari: Uyari,
  store: BildirimStore,
  rol: "pilot" | "copilot"
): void {
  // Önce eski bildirimi kaldır (koşul devam etse de yeni bildirim üretiyoruz)
  store.olayBildirimiSil(uyari.id);
  void store.hedefliEkle(
    {
      id:         crypto.randomUUID(),
      tip:        uyari.tip,
      modul:      uyari.modul,
      baslik:     uyari.baslik,
      mesaj:      uyari.mesaj,
      ilgiliLink: uyari.ilgiliLink,
      kaynak:     "tarama",
      olayId:     uyari.id,
      silindi:    false,
    },
    rol
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export function senkronizeEt(mevcutRol: "pilot" | "copilot"): void {
  const { companyId } = useSirket.getState();
  if (!companyId) return;

  // 1. Bağlam snapshot'ı
  const nakitState    = useNakit.getState();
  const stokState     = useStok.getState();
  const gorevState    = useGorevler.getState();
  const acilFonState  = useAcilFon.getState();
  const prosedurState = useProsedurler.getState();
  const ayarlarState  = useBildirimAyarlari.getState();

  const baglam = {
    nakitIslemleri:   nakitState.islemler,
    stokUrunleri:     stokState.urunler,
    gorevler:         gorevState.gorevler,
    acilFonHedefler:  acilFonState.hedefler,
    acilFonIslemler:  acilFonState.islemler,
    checklist:        prosedurState.checklist,
    kasaMinEsikKurus: ayarlarState.kasaMinEsikKurus,
  };

  // 2. Tüm kuralları çalıştır → aktif uyarı listesi
  const aktifUyarilar: Uyari[] = TUM_KURALLAR
    .map((kural) => kural(baglam))
    .filter((u): u is Uyari => u !== null)
    .filter((u) => {
      if (u.tip === "kritik") return true;
      return ayarlarState.modul[u.modul] !== false;
    })
    .filter((u) => !snoozeMi(u.id))
    .filter((u) => !manuelKapaliMi(u.id));

  // 3. Bildirim store referansı
  const bildirimStore = useBildirimler.getState();
  const taramaBildirimler = bildirimStore.bildirimler.filter(
    (b) => b.kaynak === "tarama" && !b.silindi
  );

  const now       = new Date().toISOString();
  const aktifIdler = new Set(aktifUyarilar.map((u) => u.id));

  // 4. De-dup mantığı: her aktif uyarı için karar ver
  for (const uyari of aktifUyarilar) {
    const durum = durumGetir(uyari.id);

    if (!durum) {
      // KURAL 1: İlk kez tetiklendi → bildirim gönder
      yeniBildirimEkle(uyari, bildirimStore, mevcutRol);
      durumKaydet(uyari.id, {
        olayId:            uyari.id,
        ilkBildirimTarihi: now,
        sonBildirimTarihi: now,
        sonMetric:         uyari.metric ?? 0,
        bildirimSayisi:    1,
      });
      continue;
    }

    // KURAL 4: Değer daha kötüye gitti → anında yeni bildirim
    if (degerKotulesti(uyari.metric, durum.sonMetric)) {
      yeniBildirimEkle(uyari, bildirimStore, mevcutRol);
      durumKaydet(uyari.id, {
        ...durum,
        sonBildirimTarihi: now,
        sonMetric:         uyari.metric ?? durum.sonMetric,
        bildirimSayisi:    durum.bildirimSayisi + 1,
      });
      continue;
    }

    // KURAL 3: 24 saat geçti + kullanıcı ilgili modülde aksiyon aldı
    const gecenSaat      = (Date.now() - new Date(durum.sonBildirimTarihi).getTime()) / 3_600_000;
    const aksiyonTarihi  = sonAksiyonTarihi(uyari.modulAksiyonKey ?? uyari.modul);
    const aksiyonSonrasi =
      aksiyonTarihi !== null &&
      new Date(aksiyonTarihi) > new Date(durum.sonBildirimTarihi);

    if (gecenSaat >= 24 && aksiyonSonrasi) {
      yeniBildirimEkle(uyari, bildirimStore, mevcutRol);
      durumKaydet(uyari.id, {
        ...durum,
        sonBildirimTarihi: now,
        bildirimSayisi:    durum.bildirimSayisi + 1,
      });
      continue;
    }

    // KURAL 2: Koşul devam ediyor, aksiyon yok veya 24 saat geçmedi → sustur
  }

  // 5. Koşul kalkan eski tarama bildirimlerini sil + durumu temizle (KURAL 5)
  for (const bildm of taramaBildirimler) {
    if (!bildm.olayId) {
      bildirimStore.sil(bildm.id);
    } else if (!aktifIdler.has(bildm.olayId)) {
      bildirimStore.olayBildirimiSil(bildm.olayId);
      durumSil(bildm.olayId);
      manuelKapaliKaldir(bildm.olayId);
    }
  }
}

export const debouncedSenkronizeEt = debounce(senkronizeEt, 300);
