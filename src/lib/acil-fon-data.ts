import type { Kurus } from "@/lib/para";
import type { Silinebilir } from "@/lib/silinebilir";
export { formatTL } from "@/lib/para";

export type IslemTipi = "yatirma" | "cekme";

export interface FonHedef extends Silinebilir {
  id:             string;
  ad:             string;
  /** Kuruş cinsinden toplam hedef */
  toplamHedefKurus:    Kurus;
  /** Kuruş cinsinden aylık ödeme planı */
  aylikOdemeKurus:     Kurus;
  odemeGunu:      number;   // 1-31
  aciklama?:      string;
  olusturmaTarih: string;
}

export interface FonIslem extends Silinebilir {
  id:       string;
  hedefId?: string;
  tip:      IslemTipi;
  /** Kuruş cinsinden tutar */
  tutarKurus:    Kurus;
  aciklama: string;
  tarih:    string;
}

/** Mevcut birikimi hesapla (kuruş cinsinden). */
export function mevcutBirikim(islemler: FonIslem[], hedefId?: string): Kurus {
  const list = hedefId ? islemler.filter(i => i.hedefId === hedefId) : islemler;
  return list.reduce(
    (s, i) => (i.tip === "yatirma" ? s + i.tutarKurus : s - i.tutarKurus),
    0,
  );
}

/** Bu ay yapılan yatırmalar (kuruş). */
export function buAyYatirma(islemler: FonIslem[], hedefId?: string): Kurus {
  const bugun = new Date();
  const list  = hedefId ? islemler.filter(i => i.hedefId === hedefId) : islemler;
  return list
    .filter(i => {
      const t = new Date(i.tarih);
      return i.tip === "yatirma" && t.getMonth() === bugun.getMonth() && t.getFullYear() === bugun.getFullYear();
    })
    .reduce((s, i) => (s + i.tutarKurus), 0);
}

/** Aylık grafik verisi — değerler kuruş cinsinden. */
export function aylikGrafikAralik(
  islemler:  FonIslem[],
  baslangic: Date,
  aySayisi:  number,
  hedefId?:  string,
): { ay: string; yatirma: Kurus; cekme: Kurus; bakiye: Kurus }[] {
  const list       = hedefId ? islemler.filter(i => i.hedefId === hedefId) : islemler;
  const rangeStart = new Date(baslangic.getFullYear(), baslangic.getMonth(), 1);

  let birikimli = list
    .filter(i => new Date(i.tarih) < rangeStart)
    .reduce((s, i) => (i.tip === "yatirma" ? s + i.tutarKurus : s - i.tutarKurus), 0);

  const aylar: { ay: string; yatirma: Kurus; cekme: Kurus; bakiye: Kurus }[] = [];

  for (let a = 0; a < aySayisi; a++) {
    const d    = new Date(baslangic.getFullYear(), baslangic.getMonth() + a, 1);
    const yil  = d.getFullYear();
    const ayNo = d.getMonth();
    const ayAd = d.toLocaleDateString("tr-TR", { month: "long", year: "numeric" });

    const ayIslemler = list.filter(i => {
      const t = new Date(i.tarih);
      return t.getMonth() === ayNo && t.getFullYear() === yil;
    });

    const yatirma = ayIslemler
      .filter(i => i.tip === "yatirma")
      .reduce((s, i) => (s + i.tutarKurus), 0);
    const cekme = ayIslemler
      .filter(i => i.tip === "cekme")
      .reduce((s, i) => (s + i.tutarKurus), 0);

    birikimli = (birikimli + yatirma - cekme);
    aylar.push({ ay: ayAd, yatirma, cekme, bakiye: (Math.max(birikimli, 0)) });
  }
  return aylar;
}
