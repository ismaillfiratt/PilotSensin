// ProsedurKategori artık string — kullanıcılar özel kategori ekleyebilir
export type ProsedurKategori = string;

// uc_aylik kaldırıldı, ozel eklendi (kullanıcı tanımlı gün sayısı)
export type ChecklistSikligi = "gunluk" | "haftalik" | "aylik" | "ozel";

export type OtomatikKontrol = "nakit_negatif" | "kritik_stok" | "gecik_gorev";

export type Kritiklik = "dusuk" | "orta" | "yuksek" | "kritik";

export interface ProsedurAdim { sira: number; aciklama: string; }

export interface Prosedur {
  id: string;
  baslik: string;
  kategori: string;
  aciklama: string;
  adimlar: ProsedurAdim[];
  sorumlu: string;
  sonGuncelleme: string;
}

export interface ChecklistItem {
  id: string;
  baslik: string;
  kategori: string;
  sikligi: ChecklistSikligi;
  ozelGunSayisi?: number;       // sikligi="ozel" için kaç günde bir
  sorumlu: string;
  tamamlandi: boolean;
  sonTamamlanma?: string;
  tamamlanmaGecmisi?: string[];
  otomatikKontrol?: OtomatikKontrol;
  kritiklik?: Kritiklik;
}

// ── Varsayılan listeler ──────────────────────────────────────────────────
export const VARSAYILAN_KATEGORILER: string[] = [
  "Açılış & Kapanış", "Temizlik & Hijyen", "Müşteri Hizmetleri",
  "Stok & Tedarik", "Kasa & Ödeme", "Personel & Güvenlik",
  "Finansal Sağlık", "Nakit Akışı Yönetimi", "Müşteri Yönetimi",
  "İnsan Kaynakları", "Kriz Yönetimi", "Diğer",
];

// Geriye dönük uyumluluk
export const KATEGORILER = VARSAYILAN_KATEGORILER;

export const VARSAYILAN_SORUMLULAR: string[] = [
  "Açılış sorumlusu", "Kapanış sorumlusu", "Kasiyer",
  "Stok sorumlusu", "Yönetici", "Muhasebe", "Tüm personel",
];

export const SORUMLULAR = VARSAYILAN_SORUMLULAR;

export const VARSAYILAN_KATEGORI_RENK: Record<string, { color: string; bg: string }> = {
  "Açılış & Kapanış":      { color: "#fbc024", bg: "rgba(251,192,36,0.12)"  },
  "Temizlik & Hijyen":     { color: "#22c55e", bg: "rgba(34,197,94,0.12)"   },
  "Müşteri Hizmetleri":    { color: "#60a5fa", bg: "rgba(96,165,250,0.12)"  },
  "Stok & Tedarik":        { color: "#a78bfa", bg: "rgba(167,139,250,0.12)" },
  "Kasa & Ödeme":          { color: "#f97316", bg: "rgba(249,115,22,0.12)"  },
  "Personel & Güvenlik":   { color: "#94a3b8", bg: "rgba(148,163,184,0.12)" },
  "Finansal Sağlık":       { color: "#f97316", bg: "rgba(249,115,22,0.12)"  },
  "Nakit Akışı Yönetimi":  { color: "#22c55e", bg: "rgba(34,197,94,0.12)"   },
  "Müşteri Yönetimi":      { color: "#60a5fa", bg: "rgba(96,165,250,0.12)"  },
  "İnsan Kaynakları":      { color: "#a78bfa", bg: "rgba(167,139,250,0.12)" },
  "Kriz Yönetimi":         { color: "#ef4444", bg: "rgba(239,68,68,0.12)"   },
  "Diğer":                 { color: "#64748b", bg: "rgba(100,116,139,0.12)" },
};

// Geriye dönük uyumluluk
export const KATEGORI_RENK = VARSAYILAN_KATEGORI_RENK;

/** Bilinmeyen kategoriler için fallback renk döndürür */
export function getKategoriRenk(k: string): { color: string; bg: string } {
  return VARSAYILAN_KATEGORI_RENK[k] ?? { color: "#94a3b8", bg: "rgba(148,163,184,0.12)" };
}

export const SIKLIGI_LABEL: Record<ChecklistSikligi, string> = {
  gunluk:   "Günlük",
  haftalik: "Haftalık",
  aylik:    "Aylık",
  ozel:     "Özel",
};

export const KRITIKLIK_RENK: Record<Kritiklik, { color: string; bg: string }> = {
  dusuk:   { color: "#94a3b8", bg: "rgba(148,163,184,0.12)" },
  orta:    { color: "#fbc024", bg: "rgba(251,192,36,0.12)"  },
  yuksek:  { color: "#f97316", bg: "rgba(249,115,22,0.12)"  },
  kritik:  { color: "#ef4444", bg: "rgba(239,68,68,0.12)"   },
};

// ── Helper fonksiyonlar ──────────────────────────────────────────────────

function getGunSayisi(item: ChecklistItem): number {
  switch (item.sikligi) {
    case "gunluk":   return 1;
    case "haftalik": return 7;
    case "aylik":    return 30;
    case "ozel":     return item.ozelGunSayisi ?? 90;
    // legacy support
    default:         return (item as any).sikligi === "uc_aylik" ? 90 : 1;
  }
}

/** Bu madde yapılması gereken dönem geldi mi? */
export function isDue(item: ChecklistItem): boolean {
  if (!item.sonTamamlanma) return true;
  const sonMs  = new Date(item.sonTamamlanma).getTime();
  const gunMs  = getGunSayisi(item) * 86400000;

  if (item.sikligi === "gunluk") {
    return new Date(item.sonTamamlanma).toDateString() !== new Date().toDateString();
  }
  return Date.now() - sonMs > gunMs;
}

/** Checklist uyum skoru (0-100) — gerçek tamamlama geçmişine dayanır */
export function uyumSkoru(checklist: ChecklistItem[]): number {
  const manuelList = checklist.filter(c => !c.otomatikKontrol);
  if (manuelList.length === 0) return 100;
  const now = Date.now();
  let toplam = 0;

  for (const item of manuelList) {
    const gecmis  = item.tamamlanmaGecmisi ?? [];
    const gunSayisi = getGunSayisi(item);
    const expected  = Math.max(1, Math.round(90 / gunSayisi));
    const sinirMs   = expected * gunSayisi * 86400000;
    const tamamlanan = gecmis.filter(d => now - new Date(d).getTime() < sinirMs).length;
    toplam += Math.min(tamamlanan / expected, 1);
  }
  return Math.round((toplam / manuelList.length) * 100);
}

export function prosedurDurumu(sonGuncelleme: string) {
  const gun = Math.floor((Date.now() - new Date(sonGuncelleme).getTime()) / 86400000);
  if (gun >= 30) return { etiket: "Güncelleme Gerekli", renk: "#ef4444", gun };
  if (gun >= 14) return { etiket: "İncelenmeli",        renk: "#fbc024", gun };
  return           { etiket: "Güncel",                  renk: "#22c55e", gun };
}

// ── Şablon tipleri ───────────────────────────────────────────────────────
export interface ChecklistSablon {
  baslik: string;
  kategori: string;
  sikligi: ChecklistSikligi;
  ozelGunSayisi?: number;
  sorumlu: string;
  kritiklik: Kritiklik;
  otomatikKontrol?: OtomatikKontrol;
}

export interface SabloGrubu {
  id: string;
  baslik: string;
  aciklama: string;
  icon: string;
  kategori: string;
  riskSeviyesi: "yuksek" | "kritik";
  maddeler: ChecklistSablon[];
}

export const SOP_SABLON_GRUPLARI: SabloGrubu[] = [
  {
    id: "finansal",
    baslik: "Finansal Sağlık",
    aciklama: "İşletme finansını sağlıklı tutmak için kritik kontroller",
    icon: "TrendingUp",
    kategori: "Finansal Sağlık",
    riskSeviyesi: "kritik",
    maddeler: [
      { baslik: "Nakit akışı negatif mi kontrol et",              kategori: "Finansal Sağlık",      sikligi: "gunluk",   sorumlu: "Yönetici", kritiklik: "kritik", otomatikKontrol: "nakit_negatif" },
      { baslik: "Günlük kasa bakiyesini kaydet ve doğrula",       kategori: "Finansal Sağlık",      sikligi: "gunluk",   sorumlu: "Muhasebe", kritiklik: "kritik" },
      { baslik: "30+ günlük alacakları incele ve takip et",       kategori: "Finansal Sağlık",      sikligi: "haftalik", sorumlu: "Muhasebe", kritiklik: "yuksek" },
      { baslik: "Kredi limiti kullanım oranını kontrol et",       kategori: "Finansal Sağlık",      sikligi: "haftalik", sorumlu: "Yönetici", kritiklik: "yuksek" },
      { baslik: "Kâr marjı hesapla ve önceki ayla karşılaştır",  kategori: "Finansal Sağlık",      sikligi: "aylik",    sorumlu: "Muhasebe", kritiklik: "kritik" },
      { baslik: "3 aylık nakit tahminini güncelle",               kategori: "Finansal Sağlık",      sikligi: "aylik",    sorumlu: "Yönetici", kritiklik: "yuksek" },
      { baslik: "Borç/varlık oranını hesapla",                    kategori: "Finansal Sağlık",      sikligi: "ozel",     ozelGunSayisi: 90, sorumlu: "Muhasebe", kritiklik: "yuksek" },
    ],
  },
  {
    id: "nakit",
    baslik: "Nakit Akışı Yönetimi",
    aciklama: "Nakit sıkışmasını önlemek için düzenli prosedürler",
    icon: "DollarSign",
    kategori: "Nakit Akışı Yönetimi",
    riskSeviyesi: "kritik",
    maddeler: [
      { baslik: "Tahsilat takibi yap (çıkacak faturalar)",        kategori: "Nakit Akışı Yönetimi", sikligi: "gunluk",   sorumlu: "Muhasebe", kritiklik: "kritik" },
      { baslik: "Ödenecek faturalar listesini güncelle",          kategori: "Nakit Akışı Yönetimi", sikligi: "haftalik", sorumlu: "Muhasebe", kritiklik: "yuksek" },
      { baslik: "2 haftalık nakit rezervini doğrula",             kategori: "Nakit Akışı Yönetimi", sikligi: "haftalik", sorumlu: "Yönetici", kritiklik: "kritik" },
      { baslik: "İşletme giderleri bütçe gerçekleşmesi",         kategori: "Nakit Akışı Yönetimi", sikligi: "aylik",    sorumlu: "Muhasebe", kritiklik: "yuksek" },
      { baslik: "Gecikmeli ödeme yapan müşterilere hatırlat",    kategori: "Nakit Akışı Yönetimi", sikligi: "haftalik", sorumlu: "Yönetici", kritiklik: "orta"   },
      { baslik: "Aylık gelir-gider karşılaştırmalı rapor",       kategori: "Nakit Akışı Yönetimi", sikligi: "aylik",    sorumlu: "Muhasebe", kritiklik: "yuksek" },
    ],
  },
  {
    id: "stok",
    baslik: "Stok & Tedarik",
    aciklama: "Stok kayıplarını ve tedarik kesintilerini önle",
    icon: "Package",
    kategori: "Stok & Tedarik",
    riskSeviyesi: "yuksek",
    maddeler: [
      { baslik: "Kritik stokta ürün var mı kontrol et",          kategori: "Stok & Tedarik", sikligi: "gunluk",   sorumlu: "Stok sorumlusu", kritiklik: "kritik", otomatikKontrol: "kritik_stok" },
      { baslik: "30+ gün hareket görmeyen ürünleri listele",     kategori: "Stok & Tedarik", sikligi: "haftalik", sorumlu: "Stok sorumlusu", kritiklik: "orta"   },
      { baslik: "Stok devir hızını hesapla",                     kategori: "Stok & Tedarik", sikligi: "aylik",    sorumlu: "Yönetici",       kritiklik: "yuksek" },
      { baslik: "Tedarikçi performansını değerlendir",           kategori: "Stok & Tedarik", sikligi: "aylik",    sorumlu: "Yönetici",       kritiklik: "orta"   },
      { baslik: "Ölü/bayat stoku tespit et ve kaydet",           kategori: "Stok & Tedarik", sikligi: "ozel",     ozelGunSayisi: 90, sorumlu: "Stok sorumlusu", kritiklik: "yuksek" },
      { baslik: "Alternatif tedarikçi listesini güncelle",       kategori: "Stok & Tedarik", sikligi: "ozel",     ozelGunSayisi: 90, sorumlu: "Yönetici",       kritiklik: "orta"   },
    ],
  },
  {
    id: "musteri",
    baslik: "Müşteri Yönetimi",
    aciklama: "Müşteri kaybını önle ve sağlıklı gelir yapısını koru",
    icon: "Users",
    kategori: "Müşteri Yönetimi",
    riskSeviyesi: "yuksek",
    maddeler: [
      { baslik: "Müşteri şikayetlerini incele ve yanıtla",       kategori: "Müşteri Yönetimi", sikligi: "haftalik", sorumlu: "Yönetici", kritiklik: "yuksek" },
      { baslik: "En büyük 5 müşterinin gelir yüzdesini hesapla", kategori: "Müşteri Yönetimi", sikligi: "aylik",    sorumlu: "Muhasebe", kritiklik: "kritik" },
      { baslik: "Tekrar eden müşteri oranını kontrol et",        kategori: "Müşteri Yönetimi", sikligi: "aylik",    sorumlu: "Yönetici", kritiklik: "yuksek" },
      { baslik: "Ödeme güvenilirliğini izle (gecikmeli)",       kategori: "Müşteri Yönetimi", sikligi: "haftalik", sorumlu: "Muhasebe", kritiklik: "yuksek" },
      { baslik: "Müşteri memnuniyeti anketi gönder",             kategori: "Müşteri Yönetimi", sikligi: "ozel",     ozelGunSayisi: 90, sorumlu: "Yönetici", kritiklik: "orta" },
      { baslik: "Yeni müşteri kazanım hedefini kontrol et",     kategori: "Müşteri Yönetimi", sikligi: "aylik",    sorumlu: "Yönetici", kritiklik: "orta"   },
    ],
  },
  {
    id: "ik",
    baslik: "İnsan Kaynakları",
    aciklama: "Personel riski ve ekip sağlığını izle",
    icon: "UserCheck",
    kategori: "İnsan Kaynakları",
    riskSeviyesi: "yuksek",
    maddeler: [
      { baslik: "Personel devamlılık takibi",                    kategori: "İnsan Kaynakları", sikligi: "gunluk",   sorumlu: "Yönetici", kritiklik: "orta"   },
      { baslik: "Gecikmiş görev var mı kontrol et",              kategori: "İnsan Kaynakları", sikligi: "gunluk",   sorumlu: "Yönetici", kritiklik: "yuksek", otomatikKontrol: "gecik_gorev" },
      { baslik: "Bordro uyum kontrolü",                          kategori: "İnsan Kaynakları", sikligi: "aylik",    sorumlu: "Muhasebe", kritiklik: "kritik" },
      { baslik: "Kritik personel için çapraz eğitim planı",     kategori: "İnsan Kaynakları", sikligi: "aylik",    sorumlu: "Yönetici", kritiklik: "yuksek" },
      { baslik: "Çalışan memnuniyeti değerlendirmesi",           kategori: "İnsan Kaynakları", sikligi: "ozel",     ozelGunSayisi: 90, sorumlu: "Yönetici", kritiklik: "orta" },
      { baslik: "Ayrılan personel röportajı analizi",            kategori: "İnsan Kaynakları", sikligi: "ozel",     ozelGunSayisi: 90, sorumlu: "Yönetici", kritiklik: "orta" },
    ],
  },
  {
    id: "kriz",
    baslik: "Kriz Yönetimi",
    aciklama: "İşletmenin batmasına yol açan durumları önceden tespit et",
    icon: "Shield",
    kategori: "Kriz Yönetimi",
    riskSeviyesi: "kritik",
    maddeler: [
      { baslik: "En büyük müşteri riski değerlendirmesi",        kategori: "Kriz Yönetimi", sikligi: "aylik",  sorumlu: "Yönetici", kritiklik: "kritik" },
      { baslik: "Senaryo: En büyük müşteriyi kaybetsek ne olur?",kategori: "Kriz Yönetimi", sikligi: "ozel",   ozelGunSayisi: 90, sorumlu: "Yönetici", kritiklik: "kritik" },
      { baslik: "Acil durum iletişim listesini güncelle",        kategori: "Kriz Yönetimi", sikligi: "ozel",   ozelGunSayisi: 90, sorumlu: "Yönetici", kritiklik: "yuksek" },
      { baslik: "Sigorta kapsamını ve poliçeleri gözden geçir", kategori: "Kriz Yönetimi", sikligi: "ozel",   ozelGunSayisi: 90, sorumlu: "Yönetici", kritiklik: "yuksek" },
      { baslik: "%25 maliyet azaltma senaryosu hazırla",         kategori: "Kriz Yönetimi", sikligi: "ozel",   ozelGunSayisi: 90, sorumlu: "Yönetici", kritiklik: "kritik" },
      { baslik: "Yasal uyumluluk ve vergi durumunu kontrol et", kategori: "Kriz Yönetimi", sikligi: "ozel",   ozelGunSayisi: 90, sorumlu: "Muhasebe", kritiklik: "kritik" },
    ],
  },
];

// Geriye dönük uyumluluk
export const MOCK_PROSEDURLER: Prosedur[] = [];

// ── SOP Belge Şablon tipleri ────────────────────────────────────────────
export interface SopBelgeSablon {
  baslik: string;
  aciklama: string;
  kategori: string;
  sorumlu: string;
  adimlar: ProsedurAdim[];
}

export interface SopBelgeSablonGrubu {
  id: string;
  baslik: string;
  aciklama: string;
  icon: string;
  riskSeviyesi: "yuksek" | "kritik";
  sablonlar: SopBelgeSablon[];
}

export const SOP_BELGE_SABLON_GRUPLARI: SopBelgeSablonGrubu[] = [
  {
    id: "acilis-kapanis",
    baslik: "Açılış & Kapanış",
    aciklama: "Günlük operasyonun hatasız başlatılması ve bitirilmesi",
    icon: "TrendingUp",
    riskSeviyesi: "yuksek",
    sablonlar: [
      {
        baslik: "Günlük Mağaza Açılış Prosedürü",
        aciklama: "Güne hazır ve güvenli bir işletme ortamı oluşturmak için standart açılış adımları",
        kategori: "Açılış & Kapanış",
        sorumlu: "Açılış sorumlusu",
        adimlar: [
          { sira: 1, aciklama: "Güvenlik sistemini devre dışı bırak ve kilitleri aç" },
          { sira: 2, aciklama: "Tüm ekipman ve aydınlatmaları kontrol et, arızaları kayıt altına al" },
          { sira: 3, aciklama: "Kasa ve POS cihazını hazırla, açılış bakiyesini doğrula" },
          { sira: 4, aciklama: "Ürün düzenini ve stok eksikliklerini gözden geçir" },
          { sira: 5, aciklama: "Ekibi görevlere yönlendir ve günlük hedefleri paylaş" },
        ],
      },
      {
        baslik: "Günlük Mağaza Kapanış Prosedürü",
        aciklama: "Güvenli ve kayıpsız bir kapanış için standart adımlar",
        kategori: "Açılış & Kapanış",
        sorumlu: "Kapanış sorumlusu",
        adimlar: [
          { sira: 1, aciklama: "Tüm müşterilerin mağazadan çıkışını sağla" },
          { sira: 2, aciklama: "Günlük kasa sayımını yap, tutarı raporla ve kasayı kapat" },
          { sira: 3, aciklama: "Tüm ekipmanları ve aydınlatmayı kapat" },
          { sira: 4, aciklama: "Hızlı temizlik ve düzen kontrolü yap" },
          { sira: 5, aciklama: "Güvenlik sistemini devreye al ve tüm girişleri kilitle" },
        ],
      },
      {
        baslik: "Haftalık Genel Temizlik",
        aciklama: "Hijyen ve sunum standartlarını korumak için haftalık temizlik planı",
        kategori: "Temizlik & Hijyen",
        sorumlu: "Tüm personel",
        adimlar: [
          { sira: 1, aciklama: "Temizlik listesini ve malzemelerini hazırla" },
          { sira: 2, aciklama: "Rafları, depo alanlarını ve ekipmanları temizle" },
          { sira: 3, aciklama: "Cam, zemin ve ortak alanları temizle" },
          { sira: 4, aciklama: "Temizlik malzeme stoğunu kontrol et ve eksikleri sipariş ver" },
        ],
      },
    ],
  },
  {
    id: "musteri-hizmetleri",
    baslik: "Müşteri Hizmetleri",
    aciklama: "Müşteri memnuniyetini artırma ve şikayet yönetimi",
    icon: "Users",
    riskSeviyesi: "yuksek",
    sablonlar: [
      {
        baslik: "Müşteri Şikayet Yönetimi",
        aciklama: "Şikayetleri hızlı ve etkili şekilde çözerek müşteri güvenini kazanma",
        kategori: "Müşteri Hizmetleri",
        sorumlu: "Yönetici",
        adimlar: [
          { sira: 1, aciklama: "Şikayeti empatiyle dinle, not al ve müşteriye saygı göster" },
          { sira: 2, aciklama: "Şikayeti sisteme kayıt altına al (tarih, müşteri, konu)" },
          { sira: 3, aciklama: "Çözüm seçeneklerini değerlendir ve müşteriyle paylaş" },
          { sira: 4, aciklama: "Mutabık kalınan çözümü hemen uygula" },
          { sira: 5, aciklama: "48 saat içinde müşteriyi arayarak memnuniyetini teyit et" },
        ],
      },
      {
        baslik: "Ürün İade ve Değişim",
        aciklama: "İade sürecini şeffaf ve hızlı yürütmek için standart adımlar",
        kategori: "Müşteri Hizmetleri",
        sorumlu: "Kasiyer",
        adimlar: [
          { sira: 1, aciklama: "Müşteri talebini ve iade nedenini kaydet" },
          { sira: 2, aciklama: "Ürünü fiziksel olarak incele, hasar ve kullanım durumunu değerlendir" },
          { sira: 3, aciklama: "İade politikasına uygunluğu kontrol et" },
          { sira: 4, aciklama: "Onaylıysa iade/değişim işlemini sisteme gir ve müşteriye uygula" },
          { sira: 5, aciklama: "Müşteriye onay belgesi ver ve teşekkür et" },
        ],
      },
      {
        baslik: "Müşteri Memnuniyeti Ölçümü",
        aciklama: "Müşteri geri bildirimlerini sistematik olarak toplama ve analiz etme",
        kategori: "Müşteri Yönetimi",
        sorumlu: "Yönetici",
        adimlar: [
          { sira: 1, aciklama: "Anket formunu hazırla veya son versiyonu güncelle" },
          { sira: 2, aciklama: "Anketi belirlenen kanallardan (e-posta, yüz yüze) gönder" },
          { sira: 3, aciklama: "Gelen yanıtları topla ve kategorilere göre analiz et" },
          { sira: 4, aciklama: "İyileştirme öncelikleri belirle ve yöneticiye raporla" },
        ],
      },
    ],
  },
  {
    id: "stok-tedarik",
    baslik: "Stok & Tedarik",
    aciklama: "Stok açıklarını önleme ve tedarik sürecini yönetme",
    icon: "Package",
    riskSeviyesi: "yuksek",
    sablonlar: [
      {
        baslik: "Haftalık Stok Sayımı",
        aciklama: "Envanter doğruluğunu korumak için düzenli fiziksel sayım",
        kategori: "Stok & Tedarik",
        sorumlu: "Stok sorumlusu",
        adimlar: [
          { sira: 1, aciklama: "Sayım listesini sistemden hazırla ve yazdır" },
          { sira: 2, aciklama: "Fiziksel sayımı yap ve sayım formuna kayıt et" },
          { sira: 3, aciklama: "Sistem kayıtlarıyla karşılaştır, farkları belirle" },
          { sira: 4, aciklama: "Farklılıkların nedenini belgele ve raporu hazırla" },
          { sira: 5, aciklama: "Minimum stok altındaki ürünler için acil sipariş ver" },
        ],
      },
      {
        baslik: "Tedarikçi Sipariş Süreci",
        aciklama: "Doğru ürünü doğru zamanda sipariş etmek için standart süreç",
        kategori: "Stok & Tedarik",
        sorumlu: "Stok sorumlusu",
        adimlar: [
          { sira: 1, aciklama: "Minimum stok seviyesinin altındaki ürünleri listele" },
          { sira: 2, aciklama: "Tedarikçi fiyat ve teslimat koşullarını kontrol et" },
          { sira: 3, aciklama: "Siparişi tedarikçiye ilet ve yazılı teyit al" },
          { sira: 4, aciklama: "Beklenen teslimat tarihini sisteme kaydet" },
          { sira: 5, aciklama: "Teslimat geldiğinde ürünleri kontrol ederek sisteme gir" },
        ],
      },
      {
        baslik: "Yeni Ürün Girişi",
        aciklama: "Yeni ürünlerin sisteme doğru ve eksiksiz kaydedilmesi",
        kategori: "Stok & Tedarik",
        sorumlu: "Stok sorumlusu",
        adimlar: [
          { sira: 1, aciklama: "Ürün barkod, açıklama ve kategorisini sisteme gir" },
          { sira: 2, aciklama: "Maliyet fiyatını gir, satış fiyatını ve kâr marjını hesapla" },
          { sira: 3, aciklama: "Minimum ve maksimum stok seviyelerini belirle" },
          { sira: 4, aciklama: "Ürünü rafa yerleştir ve konumunu sisteme kaydet" },
        ],
      },
    ],
  },
  {
    id: "finansal-yonetim",
    baslik: "Finansal Yönetim",
    aciklama: "Nakit akışını kontrol altında tutma ve aylık kapanış",
    icon: "DollarSign",
    riskSeviyesi: "kritik",
    sablonlar: [
      {
        baslik: "Aylık Finansal Kapanış",
        aciklama: "Ayın tüm finansal işlemlerini kayıt altına alarak net sonuca ulaşma",
        kategori: "Finansal Sağlık",
        sorumlu: "Muhasebe",
        adimlar: [
          { sira: 1, aciklama: "Tüm satış, gider ve tahsilat işlemlerini sisteme kayıt et" },
          { sira: 2, aciklama: "Banka hesap mutabakatını yap, farkları belgele" },
          { sira: 3, aciklama: "Alacak ve borç listesini güncel tut" },
          { sira: 4, aciklama: "Aylık kâr/zarar tablosunu hazırla" },
          { sira: 5, aciklama: "Sonuçları yöneticiye sun ve bir sonraki ay bütçesini güncelle" },
        ],
      },
      {
        baslik: "Nakit Akışı Haftalık Takip",
        aciklama: "Nakit sıkışmasını önlemek için haftalık nakit pozisyonu değerlendirmesi",
        kategori: "Nakit Akışı Yönetimi",
        sorumlu: "Yönetici",
        adimlar: [
          { sira: 1, aciklama: "Mevcut nakit pozisyonunu belirle" },
          { sira: 2, aciklama: "Gelecek 2 haftanın ödeme ve tahsilat planını hazırla" },
          { sira: 3, aciklama: "Tahsilat takibini güncelle, gecikmeli hesapları işaretle" },
          { sira: 4, aciklama: "Nakit rezervini değerlendir; gerekirse kredi limitini kontrol et" },
        ],
      },
      {
        baslik: "Gecikmeli Tahsilat Takibi",
        aciklama: "Vadesi geçmiş alacakları takip ederek nakit akışını koruma",
        kategori: "Nakit Akışı Yönetimi",
        sorumlu: "Muhasebe",
        adimlar: [
          { sira: 1, aciklama: "30 gün üzeri vadesi geçmiş alacakları listele" },
          { sira: 2, aciklama: "Müşterilerle telefon/e-posta yoluyla iletişim kur" },
          { sira: 3, aciklama: "Ödeme planı teklif et ve yazılı mutabakat al" },
          { sira: 4, aciklama: "Yasal takip gerekiyorsa hukuk danışmanıyla görüş" },
        ],
      },
    ],
  },
  {
    id: "insan-kaynaklari",
    baslik: "İnsan Kaynakları",
    aciklama: "İşe alım, performans ve personel yönetimi süreçleri",
    icon: "UserCheck",
    riskSeviyesi: "yuksek",
    sablonlar: [
      {
        baslik: "Yeni Çalışan İşe Alım",
        aciklama: "Doğru adayı bulmak ve işe adaptasyonunu sağlamak için standart süreç",
        kategori: "İnsan Kaynakları",
        sorumlu: "Yönetici",
        adimlar: [
          { sira: 1, aciklama: "İş tanımını ve gereksinimleri netleştir" },
          { sira: 2, aciklama: "İlanı yayınla ve başvuruları topla" },
          { sira: 3, aciklama: "CV ön değerlendirmesi yap, uygun adayları belirle" },
          { sira: 4, aciklama: "Mülakat gerçekleştir ve değerlendirme notlarını kayıt et" },
          { sira: 5, aciklama: "Referans kontrolü yap" },
          { sira: 6, aciklama: "İş teklifini hazırla, gönder ve evrak sürecini başlat" },
        ],
      },
      {
        baslik: "Aylık Performans Değerlendirme",
        aciklama: "Çalışan gelişimini desteklemek için düzenli değerlendirme süreci",
        kategori: "İnsan Kaynakları",
        sorumlu: "Yönetici",
        adimlar: [
          { sira: 1, aciklama: "Değerlendirme formunu ve önceki dönem hedeflerini hazırla" },
          { sira: 2, aciklama: "Performans verilerini topla (satış, devam, görev tamamlama)" },
          { sira: 3, aciklama: "Çalışanla birebir değerlendirme görüşmesi yap" },
          { sira: 4, aciklama: "Yeni dönem hedeflerini birlikte belirle" },
          { sira: 5, aciklama: "Değerlendirme sonuçlarını sisteme kaydet ve çalışana ver" },
        ],
      },
      {
        baslik: "İzin Yönetimi",
        aciklama: "İzin süreçlerini düzenli ve adil yönetmek için standart adımlar",
        kategori: "İnsan Kaynakları",
        sorumlu: "Yönetici",
        adimlar: [
          { sira: 1, aciklama: "İzin talebini al ve sisteme gir" },
          { sira: 2, aciklama: "Ekip yoğunluğunu ve çalışanın izin bakiyesini kontrol et" },
          { sira: 3, aciklama: "Onay veya red kararını ilgili kişiye yazılı olarak bildir" },
          { sira: 4, aciklama: "Onaylıysa çalışma programını ve vardiya planını güncelle" },
        ],
      },
    ],
  },
  {
    id: "guvenlik-uyum",
    baslik: "Güvenlik & Uyum",
    aciklama: "Acil durumlar, iş güvenliği ve yasal uyum prosedürleri",
    icon: "Shield",
    riskSeviyesi: "kritik",
    sablonlar: [
      {
        baslik: "Acil Durum Müdahale",
        aciklama: "Olası acil durumlarda hızlı ve etkili müdahale için standart adımlar",
        kategori: "Personel & Güvenlik",
        sorumlu: "Yönetici",
        adimlar: [
          { sira: 1, aciklama: "Acil durumu tespit et ve ilk riski değerlendir" },
          { sira: 2, aciklama: "Yönetici ve ilgili birimleri hemen bilgilendir" },
          { sira: 3, aciklama: "Tahliye planını uygula ve personeli güvenli alana yönlendir" },
          { sira: 4, aciklama: "Gerekli acil servisleri ara (itfaiye, ambulans, polis)" },
          { sira: 5, aciklama: "Olay raporunu hazırla ve tüm detayları kayıt altına al" },
        ],
      },
      {
        baslik: "İş Güvenliği Denetimi",
        aciklama: "Çalışma ortamındaki riskleri tespit edip gidermek için periyodik denetim",
        kategori: "Personel & Güvenlik",
        sorumlu: "Yönetici",
        adimlar: [
          { sira: 1, aciklama: "Denetim listesini ve kontrol kriterlerini hazırla" },
          { sira: 2, aciklama: "Fiziksel ortamı, ekipmanları ve çalışma koşullarını incele" },
          { sira: 3, aciklama: "Güvenlik risklerini ve uygunsuzlukları belgele" },
          { sira: 4, aciklama: "Düzeltici ve önleyici önlemleri belirle, sorumlu ata" },
          { sira: 5, aciklama: "Denetim raporunu hazırla ve yönetime sun" },
        ],
      },
      {
        baslik: "KVKK Uyum Kontrolü",
        aciklama: "Kişisel verilerin yasal gerekliliklere uygun işlenmesini güvence altına alma",
        kategori: "Kriz Yönetimi",
        sorumlu: "Yönetici",
        adimlar: [
          { sira: 1, aciklama: "Kişisel veri envanterini gözden geçir ve güncel tut" },
          { sira: 2, aciklama: "Veri işleme faaliyetlerinin KVKK'ya uygunluğunu kontrol et" },
          { sira: 3, aciklama: "Açık rıza metinlerini ve aydınlatma yükümlülüklerini güncelle" },
          { sira: 4, aciklama: "Veri ihlali senaryosu için acil eylem planını gözden geçir" },
        ],
      },
    ],
  },
];
