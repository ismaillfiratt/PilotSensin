export interface Urun {
  id: string;
  ad: string;
  kategori: string;
  satisFiyati: number;   // TL
  birimMaliyet: number;  // TL
  aylikSatis: number;    // adet/ay
  birim: string;
}

export interface IsletmeGideri {
  kategori: string;
  tutar: number;
}

// Hesaplanan metrikler
export function karHesapla(u: Urun) {
  const birimKar = u.satisFiyati - u.birimMaliyet;
  const marjYuzde = (birimKar / u.satisFiyati) * 100;
  const toplamGelir = u.satisFiyati * u.aylikSatis;
  const toplamMaliyet = u.birimMaliyet * u.aylikSatis;
  const toplamKar = birimKar * u.aylikSatis;
  return { birimKar, marjYuzde, toplamGelir, toplamMaliyet, toplamKar };
}

export const MOCK_URUNLER: Urun[] = [
  { id: "1", ad: "Süt 1L",         kategori: "Süt Ürünleri",  satisFiyati: 32,   birimMaliyet: 24,   aylikSatis: 420, birim: "adet" },
  { id: "2", ad: "Ekmek",          kategori: "Unlu Mamüller", satisFiyati: 10,   birimMaliyet: 6,    aylikSatis: 900, birim: "adet" },
  { id: "3", ad: "Su 0.5L",        kategori: "İçecek",        satisFiyati: 8,    birimMaliyet: 4,    aylikSatis: 800, birim: "adet" },
  { id: "4", ad: "Peynir (kg)",    kategori: "Süt Ürünleri",  satisFiyati: 280,  birimMaliyet: 210,  aylikSatis: 60,  birim: "kg"   },
  { id: "5", ad: "Zeytinyağı 1L",  kategori: "Yağ",           satisFiyati: 220,  birimMaliyet: 180,  aylikSatis: 30,  birim: "adet" },
  { id: "6", ad: "Deterjan",       kategori: "Temizlik",      satisFiyati: 85,   birimMaliyet: 55,   aylikSatis: 90,  birim: "adet" },
  { id: "7", ad: "Kahve 250g",     kategori: "İçecek",        satisFiyati: 120,  birimMaliyet: 85,   aylikSatis: 55,  birim: "paket"},
  { id: "8", ad: "Şeker 1kg",      kategori: "Bakliyat",      satisFiyati: 38,   birimMaliyet: 30,   aylikSatis: 95,  birim: "paket"},
  { id: "9", ad: "Yoğurt 500g",    kategori: "Süt Ürünleri",  satisFiyati: 42,   birimMaliyet: 28,   aylikSatis: 240, birim: "adet" },
  { id: "10", ad: "Makarna 500g",  kategori: "Bakliyat",      satisFiyati: 28,   birimMaliyet: 18,   aylikSatis: 150, birim: "paket"},
  { id: "11", ad: "Çay 500g",      kategori: "İçecek",        satisFiyati: 95,   birimMaliyet: 68,   aylikSatis: 70,  birim: "paket"},
  { id: "12", ad: "Pirinç 1kg",    kategori: "Bakliyat",      satisFiyati: 45,   birimMaliyet: 38,   aylikSatis: 110, birim: "paket"},
];

export const ISLETME_GIDERLERI: IsletmeGideri[] = [
  { kategori: "Kira",          tutar: 15000 },
  { kategori: "Personel",      tutar: 22000 },
  { kategori: "Faturalar",     tutar: 3200  },
  { kategori: "Pazarlama",     tutar: 1800  },
  { kategori: "Vergi & SGK",   tutar: 5500  },
  { kategori: "Bakım & Diğer", tutar: 1200  },
];

export function plOzeti(urunler: Urun[]) {
  const toplamGelir    = urunler.reduce((s, u) => s + karHesapla(u).toplamGelir,    0);
  const toplamSMM      = urunler.reduce((s, u) => s + karHesapla(u).toplamMaliyet,  0);
  const brutKar        = toplamGelir - toplamSMM;
  const brutMarj       = toplamGelir > 0 ? (brutKar / toplamGelir) * 100 : 0;
  const toplamOpGider  = ISLETME_GIDERLERI.reduce((s, g) => s + g.tutar, 0);
  const netKar         = brutKar - toplamOpGider;
  const netMarj        = toplamGelir > 0 ? (netKar / toplamGelir) * 100 : 0;
  return { toplamGelir, toplamSMM, brutKar, brutMarj, toplamOpGider, netKar, netMarj };
}

export const KATEGORILER = [
  "Süt Ürünleri", "Unlu Mamüller", "İçecek", "Yağ",
  "Bakliyat", "Temizlik", "Et & Şarküteri", "Meyve & Sebze", "Diğer",
];

export const BIRIMLER = ["adet", "kg", "lt", "paket", "kutu"];

export function formatTL(n: number) {
  return "₺" + Math.abs(n).toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
