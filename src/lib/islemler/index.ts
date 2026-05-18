/**
 * İşlemler katmanı — tüm atomik iş olayları.
 *
 * Kullanım:
 *   import { satisYap, alimYap, giderEkle, stokDuzelt, satisIade } from "@/lib/islemler";
 */

export { satisYap, satisIade } from "./satis";
export { alimYap }             from "./alim";
export { giderEkle }           from "./gider";
export { stokDuzelt }          from "./duzeltme";
export type {
  SatisGirdi,
  AlimGirdi,
  GiderGirdi,
  DuzeltmeGirdi,
  IslemSonuc,
  OdemeYontemi,
} from "./types";
