import type { Islem }        from "@/lib/nakit-data";
import type { Urun }          from "@/lib/stok-data";
import type { Gorev }         from "@/lib/gorev-data";
import type { FonHedef, FonIslem } from "@/lib/acil-fon-data";
import type { ChecklistItem } from "@/lib/prosedur-data";

export interface Uyari {
  id:                string;       // Deterministik: aynı koşul → aynı id, duplicate olmaz
  tip:               "kritik" | "uyari" | "bilgi";
  modul:             "stok" | "nakit-akisi" | "kar-zarar" | "gorevler" | "prosedurler" | "acil-fon" | "sistem";
  baslik:            string;
  mesaj:             string;
  ilgiliLink?:       string;
  oncelik:           number;       // Sıralama: büyük = daha öncelikli
  ilkGorulme?:       string;       // ISO — ilk üretildiği an
  metric?:           number;       // Koşulun sayısal değeri (daha az = daha kötü)
  modulAksiyonKey?:  string;       // Aksiyon takibi için modül anahtarı
}

export interface UyariBaglami {
  nakitIslemleri:   Islem[];
  stokUrunleri:     Urun[];
  gorevler:         Gorev[];
  acilFonHedefler:  FonHedef[];
  acilFonIslemler:  FonIslem[];
  checklist:        ChecklistItem[];
  kasaMinEsikKurus: number;
}

export type UyariKurali = (baglam: UyariBaglami) => Uyari | null;
