/**
 * Uygulama geneli arama altyapısı — 13 modül, Türkçe normalize, scoring.
 */

import type { Urun }          from "./stok-data";
import type { Islem }         from "./nakit-data";
import type { Gorev }         from "./gorev-data";
import type { Prosedur, ChecklistItem } from "./prosedur-data";
import type { FonHedef, FonIslem }      from "./acil-fon-data";
import type { SatisKaydi }    from "@/store/satislar";
import type { GiderItem }     from "@/lib/db";
import type { Bildirim }      from "@/store/bildirimler";
import type { KdvKaydi }      from "@/store/kdvHavuzu";

// ── Tipler ───────────────────────────────────────────────────────────────────

export type AramaSonucTip =
  | "sayfa"
  | "stok"
  | "nakit"
  | "gorev"
  | "prosedur"
  | "checklist"
  | "satis"
  | "gider"
  | "acil-hedef"
  | "acil-islem"
  | "bildirim"
  | "profil"
  | "kdv"
  | "belge"
  | "silinmis"
  | "urun";   // backward compat alias for "stok"

export interface AramaSonucu {
  id:          string;
  tip:         AramaSonucTip;
  baslik:      string;
  altYazi?:    string;
  altBilgi?:   string;   // backward compat — AramaModal bu alanı okur
  href:        string;
  skor:        number;
  eslesmePoz?: { baslangic: number; uzunluk: number };
  silindi?:    boolean;
  modulAdi:    string;
}

export const TIP_ETIKET: Record<AramaSonucTip, string> = {
  "sayfa":      "Sayfa",
  "stok":       "Stok",
  "nakit":      "Nakit",
  "gorev":      "Görev",
  "prosedur":   "Prosedür",
  "checklist":  "Kontrol",
  "satis":      "Satış",
  "gider":      "Gider",
  "acil-hedef": "Acil Fon Hedefi",
  "acil-islem": "Acil Fon İşlemi",
  "bildirim":   "Bildirim",
  "profil":     "Profil",
  "kdv":        "KDV",
  "belge":      "Belge",
  "silinmis":   "Çöp Kutusu",
  "urun":       "Stok",
};

export const TIP_RENK: Record<AramaSonucTip, string> = {
  "sayfa":      "#3B82F6",
  "stok":       "#A855F7",
  "nakit":      "#22C55E",
  "gorev":      "#F59E0B",
  "prosedur":   "#0EA5E9",
  "checklist":  "#06B6D4",
  "satis":      "#10B981",
  "gider":      "#EF4444",
  "acil-hedef": "#0F3D2E",
  "acil-islem": "#10B981",
  "bildirim":   "#F97316",
  "profil":     "#8B5CF6",
  "kdv":        "#EC4899",
  "belge":      "#6366F1",
  "silinmis":   "#94A3B8",
  "urun":       "#A855F7",
};

export interface AramaIndeks {
  sonuclar: AramaSonucu[];
}

// ── Türkçe normalize ──────────────────────────────────────────────────────────

function normalize(s: string): string {
  return s.toLowerCase()
    .replace(/ı/g, "i").replace(/İ/g, "i")
    .replace(/ğ/g, "g").replace(/Ğ/g, "g")
    .replace(/ü/g, "u").replace(/Ü/g, "u")
    .replace(/ş/g, "s").replace(/Ş/g, "s")
    .replace(/ö/g, "o").replace(/Ö/g, "o")
    .replace(/ç/g, "c").replace(/Ç/g, "c");
}

// ── Scoring ───────────────────────────────────────────────────────────────────

function skorla(
  baslik: string,
  sorgu: string
): { skor: number; eslesmePoz?: { baslangic: number; uzunluk: number } } {
  if (!sorgu) return { skor: 0 };
  const nb = normalize(baslik);
  const ns = normalize(sorgu);
  if (nb === ns)          return { skor: 100, eslesmePoz: { baslangic: 0, uzunluk: baslik.length } };
  if (nb.startsWith(ns)) return { skor: 80,  eslesmePoz: { baslangic: 0, uzunluk: sorgu.length } };
  const idx = nb.indexOf(ns);
  if (idx >= 0)           return { skor: 60,  eslesmePoz: { baslangic: idx, uzunluk: sorgu.length } };
  return { skor: 0 };
}

function skorlaIkincil(metin: string, sorgu: string): number {
  if (!sorgu || !metin) return 0;
  return normalize(metin).includes(normalize(sorgu)) ? 30 : 0;
}

// ── Statik içerik ─────────────────────────────────────────────────────────────

const SAYFALAR = [
  { baslik: "Dashboard",        altYazi: "Ana sayfa, özet",                   href: "/dashboard" },
  { baslik: "Nakit Akışı",      altYazi: "Gelir, gider, kasa",                href: "/nakit-akisi" },
  { baslik: "Kâr-Zarar",        altYazi: "P&L, marj, satış geçmişi",          href: "/kar-zarar" },
  { baslik: "Stok Yönetimi",    altYazi: "Ürünler, hareketler",               href: "/stok" },
  { baslik: "Görevler",         altYazi: "Kanban, tarihsel analiz",            href: "/gorevler" },
  { baslik: "Prosedürler",      altYazi: "SOP, kontrol listesi",               href: "/prosedurler" },
  { baslik: "Acil Durum Fonu",  altYazi: "Hedefler, birikim takibi",           href: "/acil-fon" },
  { baslik: "Ekip Yönetimi",    altYazi: "Üyeler, roller, davetler",           href: "/ekip" },
  { baslik: "Profil",           altYazi: "Kişisel bilgiler, güvenlik",         href: "/profil" },
  { baslik: "Ayarlar",          altYazi: "Bildirim, tema, KVKK",              href: "/ayarlar" },
  { baslik: "Bildirimler",      altYazi: "Tüm bildirimler merkezi",            href: "/bildirimler" },
  { baslik: "Çöp Kutusu",       altYazi: "Silinen kayıtlar",                  href: "/ayarlar?tab=cop-kutusu" },
];

const BELGELER = [
  { baslik: "KVKK Aydınlatma Metni",  href: "/ayarlar?tab=yasal&belge=kvkk" },
  { baslik: "Gizlilik Politikası",     href: "/ayarlar?tab=yasal&belge=gizlilik" },
  { baslik: "Kullanım Koşulları",      href: "/ayarlar?tab=yasal&belge=kullanim-kosullari" },
  { baslik: "Çerez Politikası",        href: "/ayarlar?tab=yasal&belge=cerez" },
  { baslik: "Mesafeli Satış",          href: "/ayarlar?tab=yasal&belge=mesafeli-satis" },
  { baslik: "İade & İptal",            href: "/ayarlar?tab=yasal&belge=iade-iptal" },
  { baslik: "Açık Rıza Metni",         href: "/ayarlar?tab=yasal&belge=acik-riza" },
  { baslik: "Hizmet Seviyesi (SLA)",   href: "/ayarlar?tab=yasal&belge=sla" },
  { baslik: "Ön Bilgilendirme",        href: "/ayarlar?tab=yasal&belge=on-bilgilendirme" },
];

const SSS = [
  { soru: "Şifremi unuttum",                           aciklama: "Şifre sıfırlama" },
  { soru: "Verilerim güvende mi?",                     aciklama: "Veri güvenliği" },
  { soru: "Hesabımı nasıl silebilirim?",               aciklama: "Hesap silme" },
  { soru: "Verilerimi nasıl indirebilirim?",           aciklama: "Veri dışa aktarma" },
  { soru: "Birden fazla kullanıcı ekleyebilir miyim?", aciklama: "Ekip yönetimi" },
  { soru: "Teknik destek nasıl alırım?",               aciklama: "Destek iletişim" },
];

// ── Parametre tipi (tüm alanlar opsiyonel — geriye dönük uyum) ──────────────

export interface IndeksKaynakStores {
  stokUrunler?:      Urun[];
  nakitIslemler?:    Islem[];
  gorevler?:         Gorev[];
  prosedurler?:      Prosedur[];
  checklist?:        ChecklistItem[];
  satisKayitlari?:   SatisKaydi[];
  isletmeGiderleri?: GiderItem[];
  acilFonHedefler?:  FonHedef[];
  acilFonIslemler?:  FonIslem[];
  bildirimler?:      Bildirim[];
  kdvKayitlar?:      KdvKaydi[];
  kullaniciEmail?:   string;
  kullaniciAd?:      string;
  sirketAdi?:        string;
}

// backward compat alias
export type AramaVeri = IndeksKaynakStores;

// ── İçeride kullanılan yardımcı ───────────────────────────────────────────────

function push(
  liste: AramaSonucu[],
  oge: Omit<AramaSonucu, "skor" | "altBilgi">
) {
  const altText = oge.altYazi ?? "";
  liste.push({ ...oge, skor: 0, altBilgi: altText });
}

// ── İndeks oluşturucu ─────────────────────────────────────────────────────────

export function aramaIndeksiOlustur(stores: IndeksKaynakStores): AramaIndeks {
  const sonuclar: AramaSonucu[] = [];

  // A. Sayfalar
  SAYFALAR.forEach((s) => push(sonuclar, {
    id: `sayfa-${s.href}`, tip: "sayfa",
    baslik: s.baslik, altYazi: s.altYazi, href: s.href, modulAdi: "Sayfalar",
  }));

  // B. Stok
  (stores.stokUrunler ?? []).forEach((u) => push(sonuclar, {
    id: `stok-${u.id}`, tip: "stok",
    baslik: u.ad,
    altYazi: `${u.kategori} · ${u.mevcutAdet} ${u.birim}${u.sku ? ` · SKU: ${u.sku}` : ""}`,
    href: `/stok?urun=${u.id}`, silindi: u.silindi, modulAdi: "Stok",
  }));

  // C. Nakit (son 100)
  (stores.nakitIslemler ?? []).slice(0, 100).forEach((i) => push(sonuclar, {
    id: `nakit-${i.id}`, tip: "nakit",
    baslik: i.aciklama || `${i.tip} · ${i.kategori}`,
    altYazi: `${i.tip === "gelir" ? "Gelir" : "Gider"} · ₺${(i.tutarKurus / 100).toLocaleString("tr-TR")} · ${new Date(i.tarih).toLocaleDateString("tr-TR")}`,
    href: "/nakit-akisi", silindi: i.silindi, modulAdi: "Nakit",
  }));

  // D. Görevler
  (stores.gorevler ?? []).forEach((g) => push(sonuclar, {
    id: `gorev-${g.id}`, tip: "gorev",
    baslik: g.baslik,
    altYazi: [g.sorumlu, g.durum, g.aciklama].filter(Boolean).join(" · "),
    href: "/gorevler", silindi: g.silindi, modulAdi: "Görevler",
  }));

  // E. Prosedürler
  (stores.prosedurler ?? []).forEach((p) => push(sonuclar, {
    id: `prosedur-${p.id}`, tip: "prosedur",
    baslik: p.baslik,
    altYazi: [p.kategori, p.sorumlu].filter(Boolean).join(" · "),
    href: "/prosedurler", silindi: p.silindi, modulAdi: "Prosedürler",
  }));

  // F. Checklist
  (stores.checklist ?? []).forEach((c) => push(sonuclar, {
    id: `checklist-${c.id}`, tip: "checklist",
    baslik: c.baslik,
    altYazi: [c.kategori, c.sikligi, c.sorumlu].filter(Boolean).join(" · "),
    href: "/prosedurler", silindi: c.silindi, modulAdi: "Kontrol Listesi",
  }));

  // G. Satışlar (son 100)
  (stores.satisKayitlari ?? []).slice(0, 100).forEach((s) => push(sonuclar, {
    id: `satis-${s.id}`, tip: "satis",
    baslik: s.urunAd,
    altYazi: `Satış · ${s.adet} adet · ₺${(s.toplamCiroKurus / 100).toLocaleString("tr-TR")} · ${new Date(s.tarih).toLocaleDateString("tr-TR")}`,
    href: "/kar-zarar", silindi: s.silindi, modulAdi: "Satışlar",
  }));

  // H. Giderler
  (stores.isletmeGiderleri ?? []).forEach((g) => push(sonuclar, {
    id: `gider-${g.id}`, tip: "gider",
    baslik: g.kategori,
    altYazi: `Gider · ₺${(g.tutarKurus / 100).toLocaleString("tr-TR")}`,
    href: "/kar-zarar", silindi: g.silindi, modulAdi: "Giderler",
  }));

  // I. Acil fon hedefleri
  (stores.acilFonHedefler ?? []).forEach((h) => push(sonuclar, {
    id: `acil-hedef-${h.id}`, tip: "acil-hedef",
    baslik: h.ad,
    altYazi: `Hedef ₺${(h.toplamHedefKurus / 100).toLocaleString("tr-TR")}${h.aciklama ? ` · ${h.aciklama}` : ""}`,
    href: "/acil-fon", silindi: h.silindi, modulAdi: "Acil Fon Hedefleri",
  }));

  // J. Acil fon işlemleri (son 50)
  (stores.acilFonIslemler ?? []).slice(0, 50).forEach((i) => push(sonuclar, {
    id: `acil-islem-${i.id}`, tip: "acil-islem",
    baslik: i.aciklama ?? `${i.tip === "yatirma" ? "Yatırma" : "Çekme"} işlemi`,
    altYazi: `${i.tip === "yatirma" ? "Yatırma" : "Çekme"} · ₺${(i.tutarKurus / 100).toLocaleString("tr-TR")}`,
    href: "/acil-fon", silindi: i.silindi, modulAdi: "Acil Fon İşlemleri",
  }));

  // K. Bildirimler (son 30 gün)
  const otuzGunOnce = Date.now() - 30 * 86_400_000;
  (stores.bildirimler ?? [])
    .filter((b) => new Date(b.tarih).getTime() > otuzGunOnce)
    .forEach((b) => push(sonuclar, {
      id: `bildirim-${b.id}`, tip: "bildirim",
      baslik: b.baslik,
      altYazi: `${b.mesaj} · ${new Date(b.tarih).toLocaleDateString("tr-TR")}`,
      href: b.ilgiliLink ?? "/bildirimler", silindi: b.silindi, modulAdi: "Bildirimler",
    }));

  // L. Profil
  if (stores.kullaniciAd) push(sonuclar, {
    id: "profil-kullanici", tip: "profil",
    baslik: stores.kullaniciAd, altYazi: stores.kullaniciEmail ?? "Profil bilgilerin",
    href: "/profil", modulAdi: "Profil",
  });
  if (stores.sirketAdi) push(sonuclar, {
    id: "profil-sirket", tip: "profil",
    baslik: stores.sirketAdi, altYazi: "İşletme bilgileri",
    href: "/profil?tab=isletme", modulAdi: "İşletme",
  });

  // M. KDV (son 100)
  (stores.kdvKayitlar ?? []).slice(0, 100).forEach((k) => push(sonuclar, {
    id: `kdv-${k.id}`, tip: "kdv",
    baslik: k.urunAd || "KDV kaydı",
    altYazi: `${k.tip === "giris" ? "Alış KDV" : "Satış KDV"} · ₺${(k.toplamKdvKurus / 100).toLocaleString("tr-TR")}`,
    href: "/stok?bolum=kdv", modulAdi: "KDV",
  }));

  // N. Yasal belgeler
  BELGELER.forEach((b) => push(sonuclar, {
    id: `belge-${b.href}`, tip: "belge",
    baslik: b.baslik, altYazi: "Yasal belge",
    href: b.href, modulAdi: "Belgeler",
  }));

  // O. SSS
  SSS.forEach((s, i) => push(sonuclar, {
    id: `sss-${i}`, tip: "belge",
    baslik: s.soru, altYazi: `SSS · ${s.aciklama}`,
    href: "/ayarlar?tab=sss", modulAdi: "Sıkça Sorulan Sorular",
  }));

  return { sonuclar };
}

// ── Ana arama fonksiyonu ──────────────────────────────────────────────────────

export function ara(
  sorgu: string,
  indeks: AramaIndeks | AramaSonucu[],
  modulLimit = 50
): AramaSonucu[] {
  if (!sorgu.trim()) return [];

  // Backward compat: eski kod AramaSonucu[] geçebilir
  const liste = Array.isArray(indeks) ? indeks : indeks.sonuclar;
  const trim  = sorgu.trim();
  const eslesler: AramaSonucu[] = [];

  for (const aday of liste) {
    const bs  = skorla(aday.baslik, trim);
    let skor  = bs.skor;
    let poz   = bs.eslesmePoz;

    if (skor === 0) {
      const ik = skorlaIkincil(aday.altYazi ?? aday.altBilgi ?? "", trim);
      if (ik > 0) skor = ik;
    }

    if (skor > 0) eslesler.push({ ...aday, skor, eslesmePoz: poz });
  }

  eslesler.sort((a, b) =>
    a.skor !== b.skor ? b.skor - a.skor : a.baslik.localeCompare(b.baslik, "tr")
  );

  const tipSay: Record<string, number> = {};
  return eslesler.filter((s) => {
    tipSay[s.tip] = (tipSay[s.tip] ?? 0) + 1;
    return tipSay[s.tip] <= modulLimit;
  });
}
