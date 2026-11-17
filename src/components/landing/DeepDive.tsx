"use client";

import {
  CalendarRange, BellRing, RefreshCw,
  TrendingDown, BarChart3, FileText,
  AlertTriangle, Package, Calculator,
  type LucideIcon,
} from "lucide-react";

/* ─── Shared ─── */
interface Feature { Icon: LucideIcon; title: string; desc: string; }

function FeatureGrid({ features }: { features: Feature[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mt-6">
      {features.map(({ Icon, title, desc }) => (
        <div key={title} className="flex gap-3">
          <Icon style={{ width: 18, height: 18, color: "#1F5C44", flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 500, color: "#0a0a0a", marginBottom: 2 }}>{title}</p>
            <p style={{ fontSize: 12, color: "#525252", lineHeight: 1.5 }}>{desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Nakit Akışı görsel ─── */
const NAKIT_BARS = [
  { h: "55%",  color: "#D3D1C7" }, { h: "70%",  color: "#D3D1C7" },
  { h: "60%",  color: "#D3D1C7" }, { h: "80%",  color: "#B4B2A9" },
  { h: "75%",  color: "#B4B2A9" }, { h: "90%",  color: "#1F5C44" },
  { h: "100%", color: "#1F5C44" }, { h: "65%",  color: "#B4B2A9", opacity: 0.5 },
  { h: "50%",  color: "#B4B2A9", opacity: 0.5 }, { h: "40%", color: "#B4B2A9", opacity: 0.4 },
  { h: "30%",  color: "#EF9F27", opacity: 0.6 }, { h: "25%", color: "#EF9F27", opacity: 0.7 },
];
const NAKIT_CARDS = [
  { label: "KASA",        value: "160.798 ₺", bg: "#ffffff" },
  { label: "AYLIK GİDER", value: "53.000 ₺",  bg: "#ffffff" },
  { label: "KRİTİK GÜN",  value: "22 Tem",    bg: "#FAEEDA", color: "#BA7517" },
];
const NAKIT_FEATURES: Feature[] = [
  { Icon: CalendarRange, title: "Can suyu projeksiyonu", desc: "Kasanın ne zaman boşalacağını gün gün hesaplar." },
  { Icon: BellRing,      title: "Erken uyarı sistemi",   desc: "Kritik gün yaklaşınca anında bildirim alırsın." },
  { Icon: RefreshCw,     title: "Otomatik takip",        desc: "Her gelir/gider hareketinde projeksiyon güncellenir." },
];

function NakitGorsel() {
  return (
    <div style={{ background: "#FAFAFA", borderRadius: 14, border: "0.5px solid rgba(0,0,0,0.10)", padding: 24, marginBottom: 0 }}>
      <div className="flex items-end justify-between" style={{ marginBottom: 14 }}>
        <div>
          <p style={{ fontSize: 11, color: "#737373", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>Bu Ay Net</p>
          <p style={{ fontSize: 28, fontWeight: 500, color: "#1F5C44", lineHeight: 1 }}>+160.798,60 ₺</p>
        </div>
        <span style={{ fontSize: 11, padding: "4px 10px", background: "#FAEEDA", color: "#BA7517", borderRadius: 999, fontWeight: 500 }}>⚠ Can suyu 59 gün</span>
      </div>
      <div className="flex items-end gap-1" style={{ height: 80, paddingBottom: 12, borderBottom: "0.5px solid #E5E5E5", marginBottom: 12 }}>
        {NAKIT_BARS.map((b, i) => (
          <div key={i} className="flex-1 rounded-sm" style={{ height: b.h, background: b.color, opacity: b.opacity ?? 1 }} />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {NAKIT_CARDS.map(({ label, value, bg, color }) => (
          <div key={label} className="rounded-md" style={{ padding: "8px 10px", background: bg, border: "0.5px solid rgba(0,0,0,0.06)", color: color ?? "#0a0a0a" }}>
            <p style={{ fontSize: 9, opacity: 0.7, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>{label}</p>
            <p style={{ fontSize: 13, fontWeight: 500 }}>{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Kar-Zarar görsel ─── */
const KZ_FEATURES: Feature[] = [
  { Icon: TrendingDown, title: "Marj erimesi tespiti", desc: "Brüt ve net marj trendini sürekli karşılaştırır." },
  { Icon: BarChart3,    title: "Dönem karşılaştırma",  desc: "Bu ay vs geçen ay, çeyrek karşılaştırması." },
  { Icon: FileText,     title: "Otomatik P&L tablosu", desc: "Gelir tablosu, gider tablosu otomatik." },
];
function KzGorsel() {
  return (
    <div style={{ background: "#FAFAFA", borderRadius: 14, border: "0.5px solid rgba(0,0,0,0.10)", padding: 24 }}>
      <div className="flex items-end justify-between" style={{ marginBottom: 16 }}>
        <div>
          <p style={{ fontSize: 11, color: "#737373", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>Aylık Net Kâr</p>
          <p style={{ fontSize: 28, fontWeight: 500, color: "#1F5C44", lineHeight: 1 }}>27.516 ₺</p>
        </div>
        <span style={{ fontSize: 12, color: "#1F5C44" }}>Net marj %16.3</span>
      </div>
      <div className="flex flex-col gap-3" style={{ marginBottom: 14 }}>
        {[
          { label: "Satış Hasılatı",    pct: "100%", color: "#1F5C44", value: "168.666 ₺" },
          { label: "Direkt Maliyetler", pct: "52%",  color: "#C97676", value: "88.150 ₺"  },
        ].map(({ label, pct, color, value }) => (
          <div key={label}>
            <p style={{ fontSize: 11, color: "#737373", marginBottom: 4 }}>{label}</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 rounded-md overflow-hidden" style={{ height: 24, background: "#F1EFE8" }}>
                <div style={{ width: pct, height: "100%", background: color, borderRadius: 6 }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 500, color: "#0a0a0a", whiteSpace: "nowrap" }}>{value}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "SATIŞ HASILATI", value: "168.666 ₺", color: "#0a0a0a" },
          { label: "BRÜT KÂR",       value: "80.516 ₺",  color: "#1F5C44" },
          { label: "NET MARJ",        value: "%16.3",      color: "#1F5C44" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-md" style={{ padding: "8px 10px", background: "#ffffff", border: "0.5px solid rgba(0,0,0,0.06)" }}>
            <p style={{ fontSize: 9, color: "#737373", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>{label}</p>
            <p style={{ fontSize: 13, fontWeight: 500, color }}>{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Stok görsel ─── */
const STOK_URUNLER = [
  { ad: "Bardak",        sku: "B001", pct: 100, color: "#1F5C44", adet: "500 adet", gun: "50 gün" },
  { ad: "Kart Oyunları", sku: "K001", pct: 85,  color: "#1F5C44", adet: "300 adet", gun: "30 gün" },
  { ad: "Kanvas",        sku: "K002", pct: 70,  color: "#1F5C44", adet: "200 adet", gun: "40 gün" },
  { ad: "Silgi",         sku: "S001", pct: 30,  color: "#EF9F27", adet: "120 adet", gun: "12 gün" },
] as const;
const STOK_FEATURES: Feature[] = [
  { Icon: AlertTriangle, title: "Kritik seviye uyarısı",      desc: "Stok azaldığında önceden bildirim alırsın." },
  { Icon: Package,       title: "Ölü stok tespiti",           desc: "90 günden uzun hareket etmeyen ürünleri tespit eder." },
  { Icon: Calculator,    title: "Ağırlıklı ortalama maliyet", desc: "Otomatik FIFO ve ağırlıklı ortalama hesaplama." },
];
function StokGorsel() {
  return (
    <div style={{ background: "#FAFAFA", borderRadius: 14, border: "0.5px solid rgba(0,0,0,0.10)", padding: 24 }}>
      <div className="flex items-end justify-between" style={{ marginBottom: 16 }}>
        <div>
          <p style={{ fontSize: 11, color: "#737373", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>Toplam Envanter Değeri</p>
          <p style={{ fontSize: 28, fontWeight: 500, color: "#1F5C44", lineHeight: 1 }}>₺149.501</p>
        </div>
        <span style={{ fontSize: 12, color: "#737373" }}>4 ürün · 3 kategori</span>
      </div>
      <div className="flex flex-col gap-2">
        {STOK_URUNLER.map(({ ad, sku, pct, color, adet, gun }) => (
          <div key={sku + ad} className="flex items-center gap-3 rounded-lg" style={{ padding: 10, background: "#ffffff", border: "0.5px solid rgba(0,0,0,0.06)" }}>
            <div style={{ minWidth: 90 }}>
              <p style={{ fontSize: 13, fontWeight: 500, color: "#1a1a1a" }}>{ad}</p>
              <p style={{ fontSize: 10, color: "#737373" }}>{sku}</p>
            </div>
            <div className="flex-1 rounded-full overflow-hidden" style={{ height: 6, background: "#F1EFE8" }}>
              <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 999 }} />
            </div>
            <div style={{ textAlign: "right", whiteSpace: "nowrap" }}>
              <p style={{ fontSize: 12, fontWeight: 500, color: "#0a0a0a" }}>{adet}</p>
              <p style={{ fontSize: 10, color: "#737373" }}>/ {gun}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Carousel data ─── */
const MODULLER = [
  {
    etiket:   "MODÜL 01 — NAKİT AKIŞI",
    h3:       "Can suyun kaç gün? Önceden bil.",
    subtitle: "Kasa bakiyeni, gelir ritmini ve aylık giderleri analiz eder. Parasız kalmadan çok önce uyarı verir.",
    Gorsel:   NakitGorsel,
    features: NAKIT_FEATURES,
  },
  {
    etiket:   "MODÜL 02 — KAR-ZARAR",
    h3:       "Marjın eriyor mu? Anında tespit.",
    subtitle: "Brüt kâr, SMM oranı ve net marj trendini sürekli analiz eder. Marj düşmeye başlarsa uyarı verir.",
    Gorsel:   KzGorsel,
    features: KZ_FEATURES,
  },
  {
    etiket:   "MODÜL 03 — STOK YÖNETİMİ",
    h3:       "Stok ne zaman biter? Önceden bil.",
    subtitle: "Her ürünün satış hızını ve mevcut seviyesini izler. Kritiğe düşmeden uyarı verir.",
    Gorsel:   StokGorsel,
    features: STOK_FEATURES,
  },
] as const;

export default function DeepDive() {
  return (
    <section style={{ background: "#FAFAFA" }} className="py-20 px-6">
      <div className="max-w-6xl mx-auto">

        {/* Centered header */}
        <div className="text-center mb-12">
          <h2 style={{ fontSize: 36, fontWeight: 600, color: "#1a1a1a", letterSpacing: "-0.025em", lineHeight: 1.15, margin: 0 }}>
            Her modül, bir risk dedektörü.
          </h2>
        </div>

        {/* Carousel */}
        <div
          className="deepdive-carousel"
          style={{
            display: "flex",
            overflowX: "auto",
            scrollSnapType: "x mandatory",
            gap: 20,
            paddingBottom: 20,
            scrollbarWidth: "thin",
            scrollPaddingInline: 0,
          }}
        >
          {MODULLER.map(({ etiket, h3, subtitle, Gorsel, features }) => (
            <div
              key={etiket}
              style={{
                flexShrink: 0,
                width: "100%",
                minWidth: "100%",
                scrollSnapAlign: "center",
                background: "#ffffff",
                border: "0.5px solid #e5e5e5",
                borderRadius: 14,
                padding: 32,
                boxSizing: "border-box",
              }}
            >
              <p style={{ color: "#1F5C44", textTransform: "uppercase", fontSize: 11, fontWeight: 500, letterSpacing: "0.1em", marginBottom: 8 }}>
                {etiket}
              </p>
              <h3 style={{ fontSize: 22, fontWeight: 600, color: "#0a0a0a", letterSpacing: "-0.02em", lineHeight: 1.15, marginBottom: 8, margin: 0 }}>
                {h3}
              </h3>
              <p style={{ fontSize: 13, color: "#525252", lineHeight: 1.6, maxWidth: 540, marginBottom: 20, marginTop: 8 }}>
                {subtitle}
              </p>
              <Gorsel />
              <FeatureGrid features={features as unknown as Feature[]} />
            </div>
          ))}
        </div>

        {/* Scroll dots */}
        <div className="flex justify-center gap-2 mt-4">
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#1F5C44" }} />
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#D3D1C7" }} />
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#D3D1C7" }} />
        </div>
      </div>
    </section>
  );
}
