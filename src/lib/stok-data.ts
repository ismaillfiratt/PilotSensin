export type StokDurumu = "normal" | "uyari" | "kritik" | "olu";

export interface StokHareketi {
  id:       string;
  tip:      "giris" | "cikis" | "sayim";
  miktar:   number;
  onceki:   number;
  sonraki:  number;
  tarih:    string;
  aciklama: string;
  kimin:    string;
}

export interface Urun {
  id:            string;
  ad:            string;
  sku:           string;
  kategori:      string;
  mevcutAdet:    number;
  emniyetStogu:  number;
  kritikStok:    number;
  gunlukSatis:   number;
  birim:         string;
  birimMaliyet?: number;
  sonHareket:    string;
  hareketler?:   StokHareketi[];
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

export const VARSAYILAN_BIRIMLER    = ["adet", "kg", "lt", "paket", "kutu", "gram", "ton"];
export const VARSAYILAN_KATEGORILER = [
  "Süt Ürünleri", "Unlu Mamüller", "İçecek", "Yağ",
  "Bakliyat", "Temizlik", "Meyve & Sebze", "Diğer",
];

export const MOCK_URUNLER: Urun[] = [];
