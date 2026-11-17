/** Her soft-delete edilebilir store kaydının taşıdığı alanlar. */
export interface Silinebilir {
  silindi?:            boolean;
  silinmeTarihi?:      string;       // ISO
  silenKullaniciId?:   string;
  silenKullaniciAd?:   string;
  /** Kaskad silme zinciri — aynı kaskadIslemId ile silinenleri bir arada geri alır. */
  kaskadIslemId?:      string;
}

export const TUM_TIPLER = [
  "urun", "satisKaydi", "nakitIslem", "kdvKaydi", "gorev",
  "prosedur", "checklistMaddesi", "acilFonIslem", "acilFonHedef",
  "isletmeGideri", "bildirim", "stokHareketi", "ekipUye", "davet",
  "sopGrup", "checklistGrup", "borç", "ödeme",
] as const;
export type SilinebilirTip = typeof TUM_TIPLER[number];
