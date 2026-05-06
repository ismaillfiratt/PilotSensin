export type IslemTipi = "yatirma" | "cekme";

export interface FonIslem {
  id: string;
  tip: IslemTipi;
  tutar: number;
  aciklama: string;
  tarih: string; // ISO
}

export interface FonAyar {
  hedef: number;       // Hedef fon tutarı (₺)
  aylikHedef: number;  // Aylık birikim hedefi (₺)
  aylarSayisi: number; // Kaç aylık gidere eşit olsun
}

function tarih(gunGeri: number) {
  return new Date(Date.now() - gunGeri * 86400000).toISOString();
}

export const MOCK_AYAR: FonAyar = {
  hedef: 30000,
  aylikHedef: 3000,
  aylarSayisi: 3,
};

export const MOCK_ISLEMLER: FonIslem[] = [
  { id: "f1",  tip: "yatirma", tutar: 3000, aciklama: "Ocak ayı birikimi",     tarih: tarih(120) },
  { id: "f2",  tip: "yatirma", tutar: 3000, aciklama: "Şubat ayı birikimi",    tarih: tarih(90)  },
  { id: "f3",  tip: "cekme",   tutar: 1500, aciklama: "Acil ekipman tamiri",   tarih: tarih(75)  },
  { id: "f4",  tip: "yatirma", tutar: 3000, aciklama: "Mart ayı birikimi",     tarih: tarih(60)  },
  { id: "f5",  tip: "yatirma", tutar: 1500, aciklama: "Ek birikim",            tarih: tarih(45)  },
  { id: "f6",  tip: "yatirma", tutar: 3000, aciklama: "Nisan ayı birikimi",    tarih: tarih(30)  },
  { id: "f7",  tip: "cekme",   tutar: 2000, aciklama: "Beklenmedik gider",     tarih: tarih(20)  },
  { id: "f8",  tip: "yatirma", tutar: 3000, aciklama: "Mayıs ayı birikimi",    tarih: tarih(5)   },
];

export function mevcutBirikim(islemler: FonIslem[]) {
  return islemler.reduce((s, i) => i.tip === "yatirma" ? s + i.tutar : s - i.tutar, 0);
}

// Bu ay yapılan yatırma
export function buAyYatirma(islemler: FonIslem[]) {
  const ay = new Date();
  return islemler
    .filter((i) => {
      const t = new Date(i.tarih);
      return i.tip === "yatirma" && t.getMonth() === ay.getMonth() && t.getFullYear() === ay.getFullYear();
    })
    .reduce((s, i) => s + i.tutar, 0);
}

// Aylık grafik verisi (son 6 ay)
export function aylikGrafik(islemler: FonIslem[]) {
  const aylar: { ay: string; yatirma: number; cekme: number; bakiye: number }[] = [];
  let birikimli = 0;

  for (let a = 5; a >= 0; a--) {
    const d = new Date();
    d.setMonth(d.getMonth() - a);
    const yil = d.getFullYear();
    const ayNo = d.getMonth();
    const ayAd = d.toLocaleDateString("tr-TR", { month: "short" });

    const ayIslemler = islemler.filter((i) => {
      const t = new Date(i.tarih);
      return t.getMonth() === ayNo && t.getFullYear() === yil;
    });

    const yatirma = ayIslemler.filter((i) => i.tip === "yatirma").reduce((s, i) => s + i.tutar, 0);
    const cekme   = ayIslemler.filter((i) => i.tip === "cekme").reduce((s, i) => s + i.tutar, 0);
    birikimli += yatirma - cekme;

    aylar.push({ ay: ayAd, yatirma, cekme, bakiye: Math.max(birikimli, 0) });
  }

  return aylar;
}

export function formatTL(n: number) {
  return "₺" + Math.abs(n).toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
