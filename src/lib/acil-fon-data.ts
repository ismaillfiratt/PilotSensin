export type IslemTipi = "yatirma" | "cekme";

export interface FonHedef {
  id:               string;
  ad:               string;   // "Makine Alımı", "İşletme Güvenliği" vb.
  toplamHedef:      number;   // ₺50.000
  aylikOdeme:       number;   // ₺2.000
  odemeGunu:        number;   // 1-31 — her ayın X'inde hatırlatma
  aciklama?:        string;
  olusturmaTarih:   string;
}

export interface FonIslem {
  id:       string;
  hedefId?: string;   // hangi hedefe bağlı
  tip:      IslemTipi;
  tutar:    number;
  aciklama: string;
  tarih:    string;   // ISO
}

/** Mevcut birikimi hesapla — opsiyonel hedefId ile filtrele */
export function mevcutBirikim(islemler: FonIslem[], hedefId?: string): number {
  const list = hedefId ? islemler.filter(i => i.hedefId === hedefId) : islemler;
  return list.reduce((s, i) => i.tip === "yatirma" ? s + i.tutar : s - i.tutar, 0);
}

/** Bu ay yapılan yatırmalar */
export function buAyYatirma(islemler: FonIslem[], hedefId?: string): number {
  const bugun = new Date();
  const list  = hedefId ? islemler.filter(i => i.hedefId === hedefId) : islemler;
  return list
    .filter(i => {
      const t = new Date(i.tarih);
      return i.tip === "yatirma" && t.getMonth() === bugun.getMonth() && t.getFullYear() === bugun.getFullYear();
    })
    .reduce((s, i) => s + i.tutar, 0);
}

/** Aylık grafik/tablo verisi — seçili dönem + opsiyonel hedef filtresi */
export function aylikGrafikAralik(
  islemler: FonIslem[],
  baslangic: Date,
  aySayisi: number,
  hedefId?: string,
): { ay: string; yatirma: number; cekme: number; bakiye: number }[] {
  const list      = hedefId ? islemler.filter(i => i.hedefId === hedefId) : islemler;
  const rangeStart = new Date(baslangic.getFullYear(), baslangic.getMonth(), 1);

  let birikimli = list
    .filter(i => new Date(i.tarih) < rangeStart)
    .reduce((s, i) => i.tip === "yatirma" ? s + i.tutar : s - i.tutar, 0);

  const aylar: { ay: string; yatirma: number; cekme: number; bakiye: number }[] = [];

  for (let a = 0; a < aySayisi; a++) {
    const d    = new Date(baslangic.getFullYear(), baslangic.getMonth() + a, 1);
    const yil  = d.getFullYear();
    const ayNo = d.getMonth();
    const ayAd = d.toLocaleDateString("tr-TR", { month: "long", year: "numeric" });

    const ayIslemler = list.filter(i => {
      const t = new Date(i.tarih);
      return t.getMonth() === ayNo && t.getFullYear() === yil;
    });

    const yatirma = ayIslemler.filter(i => i.tip === "yatirma").reduce((s, i) => s + i.tutar, 0);
    const cekme   = ayIslemler.filter(i => i.tip === "cekme").reduce((s, i) => s + i.tutar, 0);
    birikimli += yatirma - cekme;

    aylar.push({ ay: ayAd, yatirma, cekme, bakiye: Math.max(birikimli, 0) });
  }
  return aylar;
}

export function formatTL(n: number) {
  return "₺" + Math.abs(n).toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
