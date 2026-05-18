export type DestekKategori = "kullanim" | "hata" | "oneri" | "faturalama" | "genel";
export type DestekOncelik  = "dusuk" | "orta" | "yuksek" | "acil";
export type DestekDurum    = "acik" | "inceleme" | "cevap-bekliyor" | "cozuldu" | "kapali";

export interface DestekEk {
  ad:    string;
  url:   string;
  boyut: number;
  tip:   string;
}

export interface DestekTalep {
  id:               string;
  kullaniciId:      string;
  kullaniciEmail:   string;
  kullaniciAd:      string | null;
  sirketId:         string | null;
  konu:             string;
  kategori:         DestekKategori;
  oncelik:          DestekOncelik;
  durum:            DestekDurum;
  sonMesajTarihi:   string;
  adminOkundu:      boolean;
  kullaniciOkundu:  boolean;
  memnuniyetPuan:   number | null;
  memnuniyetYorum:  string | null;
  olusturma:        string;
  guncellenme:      string;
}

export interface DestekMesaj {
  id:          string;
  talepId:     string;
  gonderenTip: "kullanici" | "admin" | "sistem";
  gonderenId:  string | null;
  gonderenAd:  string | null;
  mesaj:       string;
  ekler:       DestekEk[];
  icNot:       boolean;
  okundu:      boolean;
  olusturma:   string;
}

export const KATEGORI_ETIKETLERI: Record<DestekKategori, string> = {
  kullanim:   "Kullanım Sorusu",
  hata:       "Hata Bildirimi",
  oneri:      "Öneri",
  faturalama: "Faturalama",
  genel:      "Genel",
};

export const DURUM_ETIKETLERI: Record<DestekDurum, string> = {
  acik:             "Açık",
  inceleme:         "İncelemede",
  "cevap-bekliyor": "Cevap Bekleniyor",
  cozuldu:          "Çözüldü",
  kapali:           "Kapatıldı",
};

export const DURUM_RENKLERI: Record<DestekDurum, string> = {
  acik:             "#fbc024",
  inceleme:         "#3b82f6",
  "cevap-bekliyor": "#a855f7",
  cozuldu:          "#22c55e",
  kapali:           "#64748b",
};

export const ONCELIK_RENKLERI: Record<DestekOncelik, string> = {
  dusuk:   "#64748b",
  orta:    "#94a3b8",
  yuksek:  "#f97316",
  acil:    "#ef4444",
};

export const ONCELIK_ETIKETLERI: Record<DestekOncelik, string> = {
  dusuk:  "Düşük",
  orta:   "Orta",
  yuksek: "Yüksek",
  acil:   "Acil",
};

export function taleptenRow(row: Record<string, unknown>): DestekTalep {
  return {
    id:              row.id as string,
    kullaniciId:     row.kullanici_id as string,
    kullaniciEmail:  row.kullanici_email as string,
    kullaniciAd:     (row.kullanici_ad as string | null) ?? null,
    sirketId:        (row.sirket_id as string | null) ?? null,
    konu:            row.konu as string,
    kategori:        row.kategori as DestekKategori,
    oncelik:         row.oncelik as DestekOncelik,
    durum:           row.durum as DestekDurum,
    sonMesajTarihi:  row.son_mesaj_tarihi as string,
    adminOkundu:     row.admin_okundu as boolean,
    kullaniciOkundu: row.kullanici_okundu as boolean,
    memnuniyetPuan:  (row.memnuniyet_puan as number | null) ?? null,
    memnuniyetYorum: (row.memnuniyet_yorum as string | null) ?? null,
    olusturma:       row.olusturma as string,
    guncellenme:     row.guncellenme as string,
  };
}

export function mesajdanRow(row: Record<string, unknown>): DestekMesaj {
  return {
    id:          row.id as string,
    talepId:     row.talep_id as string,
    gonderenTip: row.gonderen_tip as "kullanici" | "admin" | "sistem",
    gonderenId:  (row.gonderen_id as string | null) ?? null,
    gonderenAd:  (row.gonderen_ad as string | null) ?? null,
    mesaj:       row.mesaj as string,
    ekler:       (row.ekler as DestekEk[]) ?? [],
    icNot:       row.ic_not as boolean,
    okundu:      row.okundu as boolean,
    olusturma:   row.olusturma as string,
  };
}
