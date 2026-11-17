import type { Kurus }         from "@/lib/para";
import type { Silinebilir }   from "@/lib/silinebilir";
import type {
  IsletmeGiderKategori,
  GiderSablon,
} from "@/lib/isletme-giderleri-data";

/** Aylık sabit işletme gideri kalemi (overhead — satıştan bağımsız) */
export interface IsletmeGideri extends Silinebilir {
  kategori:          string;               // serbest metin (görünen ad)
  tutarKurus:        Kurus;
  // Yeni alanlar (geriye dönük uyum için opsiyonel)
  kategoriTip?:      IsletmeGiderKategori; // tip sınıflandırması
  kdvDahilHaric?:    "dahil" | "haric";
  kdvOrani?:         number;               // 0–100
  kdvIndirilebilir?: boolean;
}

export type { IsletmeGiderKategori, GiderSablon };
export { formatTL } from "@/lib/para";
