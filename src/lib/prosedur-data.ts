export type ProsedurKategori =
  | "Açılış & Kapanış"
  | "Temizlik & Hijyen"
  | "Müşteri Hizmetleri"
  | "Stok & Tedarik"
  | "Kasa & Ödeme"
  | "Personel & Güvenlik"
  | "Diğer";

export interface ProsedurAdim {
  sira: number;
  aciklama: string;
}

export interface Prosedur {
  id: string;
  baslik: string;
  kategori: ProsedurKategori;
  aciklama: string;
  adimlar: ProsedurAdim[];
  sorumlu: string;
  sonGuncelleme: string; // ISO
}

export type ChecklistSikligi = "gunluk" | "haftalik";

export interface ChecklistItem {
  id: string;
  baslik: string;
  kategori: ProsedurKategori;
  sikligi: ChecklistSikligi;
  sorumlu: string;
  tamamlandi: boolean;
}

function tarih(gunGeri: number) {
  return new Date(Date.now() - gunGeri * 86400000).toISOString();
}

export const KATEGORILER: ProsedurKategori[] = [
  "Açılış & Kapanış", "Temizlik & Hijyen", "Müşteri Hizmetleri",
  "Stok & Tedarik", "Kasa & Ödeme", "Personel & Güvenlik", "Diğer",
];

export const KATEGORI_RENK: Record<ProsedurKategori, { color: string; bg: string }> = {
  "Açılış & Kapanış":      { color: "#fbc024", bg: "rgba(251,192,36,0.12)"  },
  "Temizlik & Hijyen":     { color: "#22c55e", bg: "rgba(34,197,94,0.12)"   },
  "Müşteri Hizmetleri":    { color: "#60a5fa", bg: "rgba(96,165,250,0.12)"  },
  "Stok & Tedarik":        { color: "#a78bfa", bg: "rgba(167,139,250,0.12)" },
  "Kasa & Ödeme":          { color: "#f97316", bg: "rgba(249,115,22,0.12)"  },
  "Personel & Güvenlik":   { color: "#94a3b8", bg: "rgba(148,163,184,0.12)" },
  "Diğer":                 { color: "#64748b", bg: "rgba(100,116,139,0.12)" },
};

export function prosedurDurumu(sonGuncelleme: string) {
  const gun = Math.floor((Date.now() - new Date(sonGuncelleme).getTime()) / 86400000);
  if (gun >= 30) return { etiket: "Güncelleme Gerekli", renk: "#ef4444", gun };
  if (gun >= 14) return { etiket: "İncelenmeli",        renk: "#fbc024", gun };
  return           { etiket: "Güncel",                  renk: "#22c55e", gun };
}

export const MOCK_PROSEDURLER: Prosedur[] = [
  {
    id: "p1",
    baslik: "Sabah Açılış Prosedürü",
    kategori: "Açılış & Kapanış",
    aciklama: "Her sabah marketin açılışında yapılacak kontroller ve hazırlıklar.",
    sorumlu: "Açılış sorumlusu",
    sonGuncelleme: tarih(5),
    adimlar: [
      { sira: 1, aciklama: "Giriş kapısını aç ve güvenlik sistemini devre dışı bırak" },
      { sira: 2, aciklama: "Tüm ışıkları ve klimayı aç" },
      { sira: 3, aciklama: "Kasa açılış bakiyesini say ve kaydet (₺500 olmalı)" },
      { sira: 4, aciklama: "Taze ürünlerin son kullanma tarihlerini kontrol et" },
      { sira: 5, aciklama: "Dondurucu ve buzdolabı sıcaklıklarını kontrol et" },
      { sira: 6, aciklama: "Rafları kontrol et, eksik ürünleri tamamla" },
      { sira: 7, aciklama: "Giriş ve kasayı temizle" },
    ],
  },
  {
    id: "p2",
    baslik: "Akşam Kapanış Prosedürü",
    kategori: "Açılış & Kapanış",
    aciklama: "Her akşam kapanışta yapılacak işlemler ve kontroller.",
    sorumlu: "Kapanış sorumlusu",
    sonGuncelleme: tarih(3),
    adimlar: [
      { sira: 1, aciklama: "Son müşteriyi uğurla, kapıyı kapat" },
      { sira: 2, aciklama: "Kasa kapanış sayımını yap ve günlük hasılatı kaydet" },
      { sira: 3, aciklama: "Gelirleri kasaya yerleştir ve kilitle" },
      { sira: 4, aciklama: "Bozulabilir ürünleri kaldır veya etiketle" },
      { sira: 5, aciklama: "Tüm yüzeyleri ve zeminleri temizle" },
      { sira: 6, aciklama: "Tüm ekipmanları kapat (ışık, klima vb.)" },
      { sira: 7, aciklama: "Güvenlik sistemini aktif et ve kapıyı kilitle" },
    ],
  },
  {
    id: "p3",
    baslik: "Günlük Temizlik Rutini",
    kategori: "Temizlik & Hijyen",
    aciklama: "Hijyen standartlarını korumak için günlük temizlik adımları.",
    sorumlu: "Tüm personel",
    sonGuncelleme: tarih(8),
    adimlar: [
      { sira: 1, aciklama: "Zemin bölümlerini süpür ve paspasla" },
      { sira: 2, aciklama: "Rafları nemli bezle sil" },
      { sira: 3, aciklama: "Kasa ve tezgahı dezenfekte et" },
      { sira: 4, aciklama: "Tuvaleti temizle ve hijyen malzemelerini kontrol et" },
      { sira: 5, aciklama: "Çöpleri boşalt ve yeni poşet tak" },
    ],
  },
  {
    id: "p4",
    baslik: "Müşteri Şikayeti Yönetimi",
    kategori: "Müşteri Hizmetleri",
    aciklama: "Müşteri şikayetlerini profesyonelce çözme adımları.",
    sorumlu: "Tüm personel",
    sonGuncelleme: tarih(45),
    adimlar: [
      { sira: 1, aciklama: "Müşteriyi dikkatle dinle, sözünü kesme" },
      { sira: 2, aciklama: "Sakin ve anlayışlı bir tutum sergile" },
      { sira: 3, aciklama: "Sorunu anladığını teyit et ve özür dile" },
      { sira: 4, aciklama: "Çözüm önerisini sun (iade, değişim, indirim)" },
      { sira: 5, aciklama: "Çözümü yöneticiye bildir ve kaydet" },
    ],
  },
  {
    id: "p5",
    baslik: "Haftalık Stok Sayımı",
    kategori: "Stok & Tedarik",
    aciklama: "Her hafta yapılacak fiziksel stok sayımı prosedürü.",
    sorumlu: "Stok sorumlusu",
    sonGuncelleme: tarih(12),
    adimlar: [
      { sira: 1, aciklama: "Sayım formunu hazırla (sistem üzerinden çıktı al)" },
      { sira: 2, aciklama: "Bölüm bölüm ilerle, sayılan ürünleri işaretle" },
      { sira: 3, aciklama: "Sistem ile fiziksel miktarları karşılaştır" },
      { sira: 4, aciklama: "Farklılıkları kaydet ve yöneticiye bildir" },
      { sira: 5, aciklama: "Kritik seviyedeki ürünler için sipariş ver" },
    ],
  },
  {
    id: "p6",
    baslik: "Kasa Açma / Kapama",
    kategori: "Kasa & Ödeme",
    aciklama: "Günlük kasa işlemleri ve nakit takip prosedürü.",
    sorumlu: "Kasiyer",
    sonGuncelleme: tarih(2),
    adimlar: [
      { sira: 1, aciklama: "Açılış: ₺500 bozuk para ile kasayı hazırla" },
      { sira: 2, aciklama: "Gün içi Z raporu periyodik olarak al" },
      { sira: 3, aciklama: "Kapanış: Z raporu çıktısını al" },
      { sira: 4, aciklama: "Fiziksel sayımı Z raporu ile karşılaştır" },
      { sira: 5, aciklama: "Farkları kaydet ve yöneticiye bildir" },
      { sira: 6, aciklama: "Fazla nakdi kasaya kilitle" },
    ],
  },
  {
    id: "p7",
    baslik: "Yeni Personel Oryantasyonu",
    kategori: "Personel & Güvenlik",
    aciklama: "İşe başlayan personelin ilk 7 günlük eğitim süreci.",
    sorumlu: "Yönetici",
    sonGuncelleme: tarih(60),
    adimlar: [
      { sira: 1, aciklama: "Market genel tanıtımı ve kural kitabını ver" },
      { sira: 2, aciklama: "Kasa kullanımı eğitimi (1. gün)" },
      { sira: 3, aciklama: "Ürün yerleşimi ve kategori eğitimi (2. gün)" },
      { sira: 4, aciklama: "Açılış/kapanış prosedürü eğitimi (3. gün)" },
      { sira: 5, aciklama: "Müşteri hizmetleri eğitimi (4. gün)" },
      { sira: 6, aciklama: "Stok ve tedarik eğitimi (5. gün)" },
      { sira: 7, aciklama: "Değerlendirme ve geri bildirim (7. gün)" },
    ],
  },
];

export const MOCK_CHECKLIST: ChecklistItem[] = [
  // Günlük
  { id: "c1",  baslik: "Kasa açılış bakiyesi kontrol",        kategori: "Kasa & Ödeme",       sikligi: "gunluk",   sorumlu: "Kasiyer",           tamamlandi: true  },
  { id: "c2",  baslik: "Buzdolabı sıcaklık kontrolü",         kategori: "Temizlik & Hijyen",   sikligi: "gunluk",   sorumlu: "Açılış sorumlusu",  tamamlandi: true  },
  { id: "c3",  baslik: "Son kullanma tarihi kontrolü",        kategori: "Stok & Tedarik",      sikligi: "gunluk",   sorumlu: "Açılış sorumlusu",  tamamlandi: false },
  { id: "c4",  baslik: "Zemin temizliği (sabah)",             kategori: "Temizlik & Hijyen",   sikligi: "gunluk",   sorumlu: "Tüm personel",      tamamlandi: true  },
  { id: "c5",  baslik: "Tuvalet temizliği",                   kategori: "Temizlik & Hijyen",   sikligi: "gunluk",   sorumlu: "Tüm personel",      tamamlandi: false },
  { id: "c6",  baslik: "Kasa Z raporu (kapanış)",             kategori: "Kasa & Ödeme",        sikligi: "gunluk",   sorumlu: "Kasiyer",           tamamlandi: false },
  { id: "c7",  baslik: "Güvenlik sistemi aktif et",           kategori: "Personel & Güvenlik", sikligi: "gunluk",   sorumlu: "Kapanış sorumlusu", tamamlandi: false },
  { id: "c8",  baslik: "Raf eksiklerini tamamla",             kategori: "Stok & Tedarik",      sikligi: "gunluk",   sorumlu: "Stok sorumlusu",    tamamlandi: true  },
  // Haftalık
  { id: "c9",  baslik: "Fiziksel stok sayımı",                kategori: "Stok & Tedarik",      sikligi: "haftalik", sorumlu: "Stok sorumlusu",    tamamlandi: false },
  { id: "c10", baslik: "Tedarikçi siparişi ver",              kategori: "Stok & Tedarik",      sikligi: "haftalik", sorumlu: "Yönetici",          tamamlandi: true  },
  { id: "c11", baslik: "Personel toplantısı",                 kategori: "Personel & Güvenlik", sikligi: "haftalik", sorumlu: "Yönetici",          tamamlandi: false },
  { id: "c12", baslik: "Ekipman bakım kontrolü",              kategori: "Temizlik & Hijyen",   sikligi: "haftalik", sorumlu: "Yönetici",          tamamlandi: true  },
  { id: "c13", baslik: "Haftalık satış raporu hazırla",       kategori: "Kasa & Ödeme",        sikligi: "haftalik", sorumlu: "Yönetici",          tamamlandi: false },
];

export const SORUMLULAR = ["Açılış sorumlusu", "Kapanış sorumlusu", "Kasiyer", "Stok sorumlusu", "Yönetici", "Tüm personel"];
