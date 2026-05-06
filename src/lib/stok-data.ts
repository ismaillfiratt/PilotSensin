export type StokDurumu = "normal" | "uyari" | "kritik" | "olu";

export interface Urun {
  id: string;
  ad: string;
  sku: string;
  kategori: string;
  mevcutAdet: number;
  emniyetStogu: number;
  kritikStok: number;
  gunlukSatis: number;
  birim: string;
  sonHareket: string; // ISO date string
}

export interface StokHareketi {
  id: string;
  urunId: string;
  tip: "giris" | "cikis" | "sayim";
  miktar: number;
  tarih: string;
  aciklama: string;
}

export function stokDurumu(urun: Urun): StokDurumu {
  const gunSonHareket = Math.floor(
    (Date.now() - new Date(urun.sonHareket).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (gunSonHareket >= 90) return "olu";
  if (urun.mevcutAdet <= urun.kritikStok) return "kritik";
  if (urun.mevcutAdet <= urun.emniyetStogu) return "uyari";
  return "normal";
}

export function gunKaldi(urun: Urun): number | null {
  if (urun.gunlukSatis === 0) return null;
  return Math.floor(urun.mevcutAdet / urun.gunlukSatis);
}

export const MOCK_URUNLER: Urun[] = [
  {
    id: "1",
    ad: "Süt 1L",
    sku: "SUT-001",
    kategori: "Süt Ürünleri",
    mevcutAdet: 8,
    emniyetStogu: 20,
    kritikStok: 10,
    gunlukSatis: 15,
    birim: "adet",
    sonHareket: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: "2",
    ad: "Ekmek",
    sku: "EKM-001",
    kategori: "Unlu Mamüller",
    mevcutAdet: 45,
    emniyetStogu: 30,
    kritikStok: 15,
    gunlukSatis: 40,
    birim: "adet",
    sonHareket: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: "3",
    ad: "Su 0.5L",
    sku: "SU-001",
    kategori: "İçecek",
    mevcutAdet: 120,
    emniyetStogu: 48,
    kritikStok: 24,
    gunlukSatis: 30,
    birim: "adet",
    sonHareket: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: "4",
    ad: "Peynir (kg)",
    sku: "PEY-001",
    kategori: "Süt Ürünleri",
    mevcutAdet: 5,
    emniyetStogu: 8,
    kritikStok: 3,
    gunlukSatis: 2,
    birim: "kg",
    sonHareket: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: "5",
    ad: "Zeytinyağı 1L",
    sku: "ZYT-001",
    kategori: "Yağ",
    mevcutAdet: 2,
    emniyetStogu: 6,
    kritikStok: 2,
    gunlukSatis: 1,
    birim: "adet",
    sonHareket: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: "6",
    ad: "Deterjan",
    sku: "DET-001",
    kategori: "Temizlik",
    mevcutAdet: 18,
    emniyetStogu: 10,
    kritikStok: 5,
    gunlukSatis: 3,
    birim: "adet",
    sonHareket: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: "7",
    ad: "Kahve 250g",
    sku: "KHV-001",
    kategori: "İçecek",
    mevcutAdet: 4,
    emniyetStogu: 10,
    kritikStok: 4,
    gunlukSatis: 2,
    birim: "paket",
    sonHareket: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: "8",
    ad: "Şeker 1kg",
    sku: "SKR-001",
    kategori: "Bakliyat",
    mevcutAdet: 35,
    emniyetStogu: 15,
    kritikStok: 8,
    gunlukSatis: 3,
    birim: "paket",
    sonHareket: new Date(Date.now() - 95 * 86400000).toISOString(),
  },
  {
    id: "9",
    ad: "Yoğurt 500g",
    sku: "YGT-001",
    kategori: "Süt Ürünleri",
    mevcutAdet: 22,
    emniyetStogu: 15,
    kritikStok: 8,
    gunlukSatis: 8,
    birim: "adet",
    sonHareket: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: "10",
    ad: "Makarna 500g",
    sku: "MKR-001",
    kategori: "Bakliyat",
    mevcutAdet: 60,
    emniyetStogu: 20,
    kritikStok: 10,
    gunlukSatis: 5,
    birim: "paket",
    sonHareket: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
];

export const MOCK_HAREKETLER: StokHareketi[] = [
  { id: "h1", urunId: "1", tip: "cikis", miktar: 30, tarih: new Date(Date.now() - 1 * 86400000).toISOString(), aciklama: "Günlük satış" },
  { id: "h2", urunId: "1", tip: "giris", miktar: 50, tarih: new Date(Date.now() - 3 * 86400000).toISOString(), aciklama: "Tedarikçi sevkiyatı" },
  { id: "h3", urunId: "2", tip: "cikis", miktar: 40, tarih: new Date(Date.now() - 1 * 86400000).toISOString(), aciklama: "Günlük satış" },
  { id: "h4", urunId: "3", tip: "giris", miktar: 240, tarih: new Date(Date.now() - 5 * 86400000).toISOString(), aciklama: "Toplu alım" },
  { id: "h5", urunId: "5", tip: "cikis", miktar: 3, tarih: new Date(Date.now() - 4 * 86400000).toISOString(), aciklama: "Satış" },
];
