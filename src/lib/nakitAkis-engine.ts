import type { Islem } from "./nakit-data";
import type { PlanlananKalem, TekrarlayanKayit } from "@/store/nakitAkis";

export interface GunlukProj {
  tarih:     string;   // YYYY-MM-DD
  etiket:    string;   // "14 May"
  bakiye:    number;
  bakiyePos: number;   // Math.max(0, bakiye) — yeşil alan için
  bakiyeNeg: number;   // Math.min(0, bakiye) — kırmızı alan için
  giren:     number;
  cikan:     number;
}

/* ─── Mevcut kasa bakiyesi ─── */
export function kasaBakiyesi(islemler: Islem[]): number {
  return islemler.reduce((t, i) => i.tip === "gelir" ? t + i.tutarKurus : t - i.tutarKurus, 0);
}

/* ─── Son 30 günün günlük ortalama gideri (nakit işlemlerinden) ─── */
export function gunlukOrtalamaGider(islemler: Islem[]): number {
  const esik = Date.now() - 30 * 86400000;
  const toplam = islemler
    .filter((i) => i.tip === "gider" && new Date(i.tarih).getTime() >= esik)
    .reduce((t, i) => t + i.tutarKurus, 0);
  return toplam / 30;
}

/**
 * Gerçekçi günlük burn rate.
 * Kar-Zarar sayfasındaki sabit giderlerin aylık toplamını taban olarak alır;
 * son 30 günlük nakit giderler daha yüksekse onları kullanır.
 */
export function gunlukBurnRate(
  islemler:         Islem[],
  aylikSabitGider:  number,   // useIsletmeGiderleri toplamı
): number {
  const nakitTabanli = gunlukOrtalamaGider(islemler);
  const sabitTabanli = aylikSabitGider / 30;
  return Math.max(nakitTabanli, sabitTabanli);
}

/* ─── Runway: kaç gün dayanır (basit, kasa-only) ─── */
export function runway(kasa: number, gunlukGider: number): number {
  if (gunlukGider <= 0) return Infinity;
  if (kasa <= 0) return 0;
  return Math.floor(kasa / gunlukGider);
}

/* ─── Önümüzdeki 7 güne ait ödenmemiş gider kalemleri toplamı ─── */
export function kritikBorc7Gun(kalemler: PlanlananKalem[]): number {
  const bugun = new Date();
  bugun.setHours(0, 0, 0, 0);
  const limit = new Date(bugun);
  limit.setDate(limit.getDate() + 7);

  return kalemler
    .filter((k) => {
      if (k.tamamlandi || k.tip !== "gider") return false;
      const vade = new Date(k.vadeTarihi);
      return vade >= bugun && vade <= limit;
    })
    .reduce((t, k) => t + k.tutarKurus, 0);
}

/* ─── Gerçekçi Runway: (kasa + acil fon − 7 günlük kritik borç) / günlük burn ─── */
export function genisMimariRunway(
  kasa:         number,
  acilFon:      number,
  kritikBorc:   number,
  gunlukGider:  number,
): number {
  if (gunlukGider <= 0) return Infinity;
  const netKaynak = kasa + acilFon - kritikBorc;
  if (netKaynak <= 0) return 0;
  return Math.floor(netKaynak / gunlukGider);
}

export type RunwayDurum = "kritik" | "dikkat" | "iyi";

/* ─── Trafik lambası: <30 kritik, 30-60 dikkat, >60 iyi ─── */
export function runwayDurum(gun: number): RunwayDurum {
  if (gun < 30) return "kritik";
  if (gun <= 60) return "dikkat";
  return "iyi";
}

/* ─── Tekrarlayan kayıtlardan gelecek 30 günlük kalemler üret ─── */
function tekrarlayanKalemler(
  tekrarlayanlar: TekrarlayanKayit[],
): PlanlananKalem[] {
  const kalemler: PlanlananKalem[] = [];
  const simdi = new Date();
  simdi.setHours(0, 0, 0, 0);

  for (const t of tekrarlayanlar) {
    if (!t.aktif) continue;
    const periyot = t.tekrarPeriyot ?? "aylik";

    if (periyot === "gunluk") {
      // Sonraki 30 gün, her gün
      for (let i = 0; i < 30; i++) {
        const d = new Date(simdi); d.setDate(simdi.getDate() + i);
        const tarih = d.toISOString().split("T")[0];
        kalemler.push({ id: `tekrar_${t.id}_${tarih}`, tip: t.tip, kategori: t.kategori, tutarKurus: t.tutarKurus, vadeTarihi: tarih, tamamlandi: false, aciklama: t.ad, kaynak: "maas_otomatik" });
      }
    } else if (periyot === "haftalik") {
      // Sonraki 30 gün, haftada bir (odemeGunu = 0-6, haftanın günü)
      for (let i = 0; i < 30; i++) {
        const d = new Date(simdi); d.setDate(simdi.getDate() + i);
        if (d.getDay() === (t.odemeGunu % 7)) {
          const tarih = d.toISOString().split("T")[0];
          kalemler.push({ id: `tekrar_${t.id}_${tarih}`, tip: t.tip, kategori: t.kategori, tutarKurus: t.tutarKurus, vadeTarihi: tarih, tamamlandi: false, aciklama: t.ad, kaynak: "maas_otomatik" });
        }
      }
    } else if (periyot === "2ayda1" || periyot === "3ayda1") {
      const adim = periyot === "2ayda1" ? 2 : 3;
      for (let ay = 0; ay <= Math.ceil(30 / 28 / adim) + 1; ay++) {
        const tarihObj = new Date(simdi.getFullYear(), simdi.getMonth() + ay * adim, t.odemeGunu);
        if (tarihObj < simdi) continue;
        const sonuc = new Date(simdi); sonuc.setDate(sonuc.getDate() + 30);
        if (tarihObj > sonuc) break;
        const tarih = tarihObj.toISOString().split("T")[0];
        kalemler.push({ id: `tekrar_${t.id}_${tarih}`, tip: t.tip, kategori: t.kategori, tutarKurus: t.tutarKurus, vadeTarihi: tarih, tamamlandi: false, aciklama: t.ad, kaynak: "maas_otomatik" });
      }
    } else {
      // "aylik" — varsayılan: bu ay ve gelecek ay
      for (let ay = 0; ay <= 1; ay++) {
        const tarihObj = new Date(simdi.getFullYear(), simdi.getMonth() + ay, t.odemeGunu);
        if (tarihObj < simdi) continue;
        const tarih = tarihObj.toISOString().split("T")[0];
        kalemler.push({ id: `tekrar_${t.id}_${tarih}`, tip: t.tip, kategori: t.kategori, tutarKurus: t.tutarKurus, vadeTarihi: tarih, tamamlandi: false, aciklama: t.ad, kaynak: "maas_otomatik" });
      }
    }
  }
  return kalemler;
}

/* ─── 30 günlük projeksiyon ─── */
export function projeksiyon30Gun(
  kasaMevcut:      number,
  planlananlar:    PlanlananKalem[],
  tekrarlayanlar:  TekrarlayanKayit[],
  aylikSabitGider: number = 0,
): GunlukProj[] {
  const tekrarKalemler  = tekrarlayanKalemler(tekrarlayanlar);
  const tumKalemler     = [...planlananlar.filter((k) => !k.tamamlandi), ...tekrarKalemler];
  const gunlukSabitGider = aylikSabitGider / 30;

  const sonuc: GunlukProj[] = [];
  let bakiye = kasaMevcut;

  for (let i = 0; i < 30; i++) {
    const tarihObj = new Date();
    tarihObj.setDate(tarihObj.getDate() + i);
    tarihObj.setHours(0, 0, 0, 0);
    const tarih = tarihObj.toISOString().split("T")[0];

    const gunKalemleri = tumKalemler.filter((k) => k.vadeTarihi === tarih);
    let giren = 0;
    let cikan = gunlukSabitGider;
    bakiye -= gunlukSabitGider;

    for (const k of gunKalemleri) {
      if (k.tip === "gelir") { giren += k.tutarKurus; bakiye += k.tutarKurus; }
      else                   { cikan += k.tutarKurus; bakiye -= k.tutarKurus; }
    }

    sonuc.push({
      tarih,
      etiket:    tarihObj.toLocaleDateString("tr-TR", { day: "numeric", month: "short" }),
      bakiye:    Math.round(bakiye),
      bakiyePos: Math.max(0, Math.round(bakiye)),
      bakiyeNeg: Math.min(0, Math.round(bakiye)),
      giren:     Math.round(giren),
      cikan:     Math.round(cikan),
    });
  }

  return sonuc;
}

/* ─── Kritik gün var mı? ─── */
export function kritikGunVarMi(proj: GunlukProj[]): boolean {
  return proj.some((g) => g.bakiye < 0);
}

/* ─── İlk kritik gün ─── */
export function ilkKritikGun(proj: GunlukProj[]): GunlukProj | null {
  return proj.find((g) => g.bakiye < 0) ?? null;
}
