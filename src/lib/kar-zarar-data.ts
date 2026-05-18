import type { Kurus } from "@/lib/para";
import type { Silinebilir } from "@/lib/silinebilir";

/** Aylık sabit işletme gideri kalemi */
export interface IsletmeGideri extends Silinebilir {
  kategori: string;
  tutarKurus:    Kurus;
}

export { formatTL } from "@/lib/para";
