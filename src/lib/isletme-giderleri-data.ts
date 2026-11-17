import type { KdvDurum } from "@/lib/urun-marj-data";

export type IsletmeGiderKategori =
  | "kira"
  | "personel"
  | "sgk"
  | "pazarlama"
  | "yazilim"
  | "faturalar"
  | "muhasebe"
  | "vergi"
  | "diger";

export const KATEGORI_ETIKETLERI: Record<IsletmeGiderKategori, string> = {
  kira:      "Kira",
  personel:  "Personel",
  sgk:       "SGK Primleri",
  pazarlama: "Pazarlama (Meta, Google)",
  yazilim:   "Yazılım & Abonelikler",
  faturalar: "Faturalar (Elektrik, İnternet)",
  muhasebe:  "Muhasebe & Müşavirlik",
  vergi:     "Vergi & SGK",
  diger:     "Diğer",
};

/** Shopify satıcısı için önerilen aylık sabit gider şablonları. */
export interface GiderSablon {
  ad:              string;
  kategori:        IsletmeGiderKategori;
  kdvDahilHaric:   KdvDurum;
  kdvOrani:        number;
  kdvIndirilebilir: boolean;
}

export const ONERILEN_GIDER_SABLONLARI: GiderSablon[] = [
  { ad: "İşyeri kirası",     kategori: "kira",      kdvDahilHaric: "dahil", kdvOrani: 0,  kdvIndirilebilir: false },
  { ad: "Personel maaşı",    kategori: "personel",  kdvDahilHaric: "dahil", kdvOrani: 0,  kdvIndirilebilir: false },
  { ad: "SGK primi",         kategori: "sgk",       kdvDahilHaric: "dahil", kdvOrani: 0,  kdvIndirilebilir: false },
  { ad: "Meta reklamları",   kategori: "pazarlama", kdvDahilHaric: "dahil", kdvOrani: 0,  kdvIndirilebilir: false },
  { ad: "Google Ads",        kategori: "pazarlama", kdvDahilHaric: "dahil", kdvOrani: 0,  kdvIndirilebilir: false },
  { ad: "Shopify aboneliği", kategori: "yazilim",   kdvDahilHaric: "dahil", kdvOrani: 0,  kdvIndirilebilir: false },
  { ad: "Elektrik faturası", kategori: "faturalar", kdvDahilHaric: "dahil", kdvOrani: 20, kdvIndirilebilir: true  },
  { ad: "İnternet faturası", kategori: "faturalar", kdvDahilHaric: "dahil", kdvOrani: 20, kdvIndirilebilir: true  },
  { ad: "Muhasebeci ücreti", kategori: "muhasebe",  kdvDahilHaric: "dahil", kdvOrani: 20, kdvIndirilebilir: true  },
];
