export type GorevDurumu  = "yapilacak" | "devam" | "tamamlandi";
export type Oncelik      = "acil" | "yuksek" | "normal" | "dusuk";

export interface Gorev {
  id: string;
  baslik: string;
  aciklama: string;
  sorumlu: string;
  sonTarih: string; // ISO
  oncelik: Oncelik;
  durum: GorevDurumu;
  olusturmaTarih: string; // ISO
}

function tarih(gunFark: number) {
  return new Date(Date.now() + gunFark * 86400000).toISOString();
}

export const MOCK_GOREVLER: Gorev[] = [
  // Yapılacak
  { id: "g1",  baslik: "Haftalık tedarikçi siparişi ver",      aciklama: "Süt ve süt ürünleri için sipariş ver",               sorumlu: "İsmail",  sonTarih: tarih(1),   oncelik: "acil",   durum: "yapilacak",   olusturmaTarih: tarih(-3)  },
  { id: "g2",  baslik: "Fatura ödemelerini kontrol et",         aciklama: "Elektrik ve doğalgaz faturalarını öde",              sorumlu: "İsmail",  sonTarih: tarih(3),   oncelik: "yuksek", durum: "yapilacak",   olusturmaTarih: tarih(-1)  },
  { id: "g3",  baslik: "Yeni personel eğitimi planla",          aciklama: "Kasa kullanımı ve müşteri hizmetleri eğitimi",       sorumlu: "Ayşe",    sonTarih: tarih(7),   oncelik: "normal", durum: "yapilacak",   olusturmaTarih: tarih(-2)  },
  { id: "g4",  baslik: "Market girişini yenile",                aciklama: "Tabela ve vitrin düzenlemesi",                       sorumlu: "Mehmet",  sonTarih: tarih(14),  oncelik: "dusuk",  durum: "yapilacak",   olusturmaTarih: tarih(-5)  },
  { id: "g5",  baslik: "SGK primlerini öde",                    aciklama: "Aylık SGK primi son günü",                           sorumlu: "İsmail",  sonTarih: tarih(-1),  oncelik: "acil",   durum: "yapilacak",   olusturmaTarih: tarih(-7)  },
  // Devam ediyor
  { id: "g6",  baslik: "Stok sayımı yap",                       aciklama: "Tüm ürünler için fiziksel sayım",                    sorumlu: "Ayşe",    sonTarih: tarih(2),   oncelik: "yuksek", durum: "devam",       olusturmaTarih: tarih(-4)  },
  { id: "g7",  baslik: "Sosyal medya içeriği hazırla",          aciklama: "Bu haftanın Instagram gönderileri",                  sorumlu: "Mehmet",  sonTarih: tarih(4),   oncelik: "normal", durum: "devam",       olusturmaTarih: tarih(-2)  },
  { id: "g8",  baslik: "Yaz kampanyası fiyatlandırması",        aciklama: "Sezonluk ürünler için indirim oranlarını belirle",   sorumlu: "İsmail",  sonTarih: tarih(5),   oncelik: "yuksek", durum: "devam",       olusturmaTarih: tarih(-6)  },
  // Tamamlandı
  { id: "g9",  baslik: "Kasanın bakımını yaptır",               aciklama: "Yıllık kasa bakımı",                                 sorumlu: "Mehmet",  sonTarih: tarih(-5),  oncelik: "normal", durum: "tamamlandi",  olusturmaTarih: tarih(-14) },
  { id: "g10", baslik: "Nisan ayı muhasebe kapatma",            aciklama: "Aylık hesap özeti muhasebeciye gönder",              sorumlu: "İsmail",  sonTarih: tarih(-3),  oncelik: "yuksek", durum: "tamamlandi",  olusturmaTarih: tarih(-10) },
  { id: "g11", baslik: "Temizlik şirketi ile sözleşme yenile",  aciklama: "Yıllık temizlik sözleşmesi",                         sorumlu: "Ayşe",    sonTarih: tarih(-8),  oncelik: "normal", durum: "tamamlandi",  olusturmaTarih: tarih(-20) },
];

export const SORUMLULAR = ["İsmail", "Ayşe", "Mehmet", "Ali", "Fatma"];

export const ONCELIK_CONFIG: Record<Oncelik, { label: string; color: string; bg: string }> = {
  acil:   { label: "Acil",    color: "#ef4444", bg: "rgba(239,68,68,0.12)"   },
  yuksek: { label: "Yüksek",  color: "#fbc024", bg: "rgba(251,192,36,0.12)"  },
  normal: { label: "Normal",  color: "#94a3b8", bg: "rgba(148,163,184,0.12)" },
  dusuk:  { label: "Düşük",   color: "#64748b", bg: "rgba(100,116,139,0.12)" },
};

export const DURUM_CONFIG: Record<GorevDurumu, { label: string; color: string; bg: string; border: string }> = {
  yapilacak:   { label: "Yapılacak",   color: "#94a3b8", bg: "rgba(148,163,184,0.08)", border: "rgba(148,163,184,0.2)"  },
  devam:       { label: "Devam Ediyor", color: "#fbc024", bg: "rgba(251,192,36,0.08)",  border: "rgba(251,192,36,0.25)"  },
  tamamlandi:  { label: "Tamamlandı",  color: "#22c55e", bg: "rgba(34,197,94,0.08)",   border: "rgba(34,197,94,0.25)"   },
};

export const DURUM_SIRASI: GorevDurumu[] = ["yapilacak", "devam", "tamamlandi"];

export function sonTarihDurumu(iso: string) {
  const fark = Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
  if (fark < 0)  return { renk: "#ef4444", etiket: `${Math.abs(fark)}g gecikti` };
  if (fark === 0) return { renk: "#ef4444", etiket: "Bugün" };
  if (fark <= 2)  return { renk: "#fbc024", etiket: `${fark}g kaldı` };
  return { renk: "#94a3b8", etiket: new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "short" }) };
}
