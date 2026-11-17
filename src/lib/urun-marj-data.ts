export type GiderTipi  = "sabit" | "yuzde";
export type KdvDurum   = "dahil" | "haric";
export type YuzdeBase  = "satis" | "alis" | "ozel";

export interface UrunGideri {
  id:               string;
  ad:               string;
  tutar:            number;    // sabit → TL, yuzde → 0–100
  tip:              GiderTipi;
  kdvDahilHaric:    KdvDurum;
  kdvOrani:         number;    // 0–100
  kdvIndirilebilir: boolean;
  aktif:            boolean;
  /** "satis" (default) | "alis" | "ozel" — sadece tip=yuzde için */
  yuzdeBase?:       YuzdeBase;
  /** Sadece yuzdeBase="ozel" — özel baz tutarı (TL) */
  yuzdeBaseOzel?:   number;
  /** "stok-maliyet" → mal maliyeti; KDV stok kaydından okunur */
  kaynak?:          "stok-maliyet";
  aciklama?:        string;
}

export interface UrunMarjKayit {
  id:             string;
  urunId:         string;
  giderler:       UrunGideri[];
  hedefMarjYuzde: number | null;
  olusturma:      string;
  guncellenme:    string;
}

/**
 * Standart direct cost defaults — her satışta tekrar eden, ürüne ait.
 * Mal maliyeti ve KDV stok kaydından otomatik okunur (bu listede YOK).
 * Meta/Google reklam ✓ burada — kira, maaş vb. İşletme Giderleri'nde.
 */
export const VARSAYILAN_DIRECT_GIDERLER: Omit<UrunGideri, "id">[] = [
  // ── ₺ TİPİNDE GİDERLER ──────────────────────────────────────────────
  {
    ad:               "Kargo",
    tutar:            40,
    tip:              "sabit",
    kdvDahilHaric:    "dahil",
    kdvOrani:         20,
    kdvIndirilebilir: true,
    aktif:            true,
    aciklama:         "Yurtiçi kargo (alıcıya)",
  },
  {
    ad:               "Paketleme",
    tutar:            5,
    tip:              "sabit",
    kdvDahilHaric:    "dahil",
    kdvOrani:         20,
    kdvIndirilebilir: true,
    aktif:            true,
    aciklama:         "Kutu, bant, bubble, etiket",
  },
  {
    ad:               "Shopify ödeme sabit",
    tutar:            2,
    tip:              "sabit",
    kdvDahilHaric:    "dahil",
    kdvOrani:         0,
    kdvIndirilebilir: false,
    aktif:            true,
    aciklama:         "Sipariş başına Shopify sabit komisyon",
  },
  // ── % TİPİNDE GİDERLER ──────────────────────────────────────────────
  {
    ad:               "Shopify ödeme komisyonu",
    tutar:            2.9,
    tip:              "yuzde",
    kdvDahilHaric:    "dahil",
    kdvOrani:         0,
    kdvIndirilebilir: false,
    aktif:            true,
    yuzdeBase:        "satis",
    aciklama:         "Shopify Payments yüzde komisyonu",
  },
  {
    ad:               "Ödeme altyapısı komisyonu",
    tutar:            4,
    tip:              "yuzde",
    kdvDahilHaric:    "dahil",
    kdvOrani:         0,
    kdvIndirilebilir: false,
    aktif:            true,
    yuzdeBase:        "satis",
    aciklama:         "Iyzico/Param/sanal POS gibi ödeme altyapısı komisyonu",
  },
  {
    ad:               "Reklam (Meta/Google Ads)",
    tutar:            8,
    tip:              "yuzde",
    kdvDahilHaric:    "dahil",
    kdvOrani:         0,
    kdvIndirilebilir: false,
    aktif:            true,
    yuzdeBase:        "satis",
    aciklama:         "Ortalama reklam payı (CAC)",
  },
  {
    ad:               "İade payı",
    tutar:            6,
    tip:              "yuzde",
    kdvDahilHaric:    "dahil",
    kdvOrani:         0,
    kdvIndirilebilir: false,
    aktif:            false,
    yuzdeBase:        "satis",
    aciklama:         "Ortalama iade oranı kayıp tahmini (varsayılan kapalı)",
  },
];
