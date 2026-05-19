import Link from "next/link";
import PricingSection from "@/components/landing/PricingSection";
import SSSSection     from "@/components/landing/SSSSection";

/* ─── Statik veri ─── */
const SORUNLAR = [
  { no: "01", baslik: "Nakit Akışı Körlüğü",       aciklama: "Paranın nereye gittiğini bilmeden yönetiyorsun. Beklenmedik gider geldiğinde kasanda ne var, bilmiyorsun." },
  { no: "02", baslik: "KDV & Kâr-Zarar Kargaşası", aciklama: "Vergi döneminde gerçek kârın ve KDV mahsuplaşmaların hâlâ belirsiz. Muhasebeci bile tam cevap veremiyor." },
  { no: "03", baslik: "Stok Yönetimsizliği",        aciklama: "Ne tükendiğini fark etmek için müşteri şikâyeti bekliyorsun. Stok fazlası ve fireler seni sessizce eritiyor." },
  { no: "04", baslik: "Planlama Boşluğu",            aciklama: "Görevler kafada takip ediliyor. Kimin ne yapacağı belirsiz; sorumluluk kimsenin üzerinde değil." },
  { no: "05", baslik: "SOP Eksikliği",               aciklama: "Çalışan değişince her şey sıfırdan başlıyor. İş süreçleri yazılı değil, kurumsal hafıza bireylerle gidiyor." },
  { no: "06", baslik: "Acil Durum Fonsuzluğu",      aciklama: "Kriz anında ne yapacağını bilmiyorsun. Küçük bir şok bile nakit döngüsünü çökertebiliyor." },
];

const COZUMLER = [
  {
    no: "01",
    baslik: "Finansal Görünürlük",
    alt: "Nakit & Muhasebe",
    aciklama: "Gerçek zamanlı nakit akışı, otomatik KDV mahsuplaşma ve P&L hiyerarşisi — tek ekranda.",
    maddeler: ["Anlık nakit akışı takibi", "KDV mahsuplaşma otomasyonu", "Kâr-zarar hiyerarşisi ve analizi", "30 günlük nakit projeksiyonu"],
  },
  {
    no: "02",
    baslik: "İş Süreci Kontrolü",
    alt: "Operasyon",
    aciklama: "Ürün ve stok hareketi, görev ataması ve SOP kütüphanesi — operasyonel körlük biter.",
    maddeler: ["Ürün ve stok hareketi yönetimi", "Görev ataması ve takibi", "SOP / prosedür kütüphanesi", "Kritik stok erken uyarıları"],
  },
  {
    no: "03",
    baslik: "Ekip & Risk Yönetimi",
    alt: "Yönetim",
    aciklama: "Acil durum fonu, rol kısıtlama ve çalışan yetki yönetimiyle işletmeni krizlere karşı koru.",
    maddeler: ["Acil durum fonu modülü", "Pilot / Co-Pilot rol kısıtlama", "Çalışan yetki ve izin yönetimi", "Gerçek zamanlı bildirimler"],
  },
];

const OZELLIKLER = [
  {
    baslik: "Erken Uyarı Sistemi",
    aciklama: "Kritik stok seviyesi, geciken görevler, negatife dönen kasa — sorun olmadan önce görürsün. Dashboard'daki İlgi Gerekli bölümü tüm uyarıları özetler.",
    ikon: "🔔",
  },
  {
    baslik: "KDV Mahsuplaşma Otomasyonu",
    aciklama: "Gelir ve gider KDV'lerini otomatik karşılaştırır, net ödeme ya da iade tutarını anlık gösterir. Vergi döneminde sürpriz yok.",
    ikon: "📊",
  },
  {
    baslik: "Pilot / Co-Pilot Yetki Sistemi",
    aciklama: "Pilot (işletme sahibi) tam yetkiyle çalışır; Co-Pilot yalnızca izin verilen modüllere erişir. Veri güvenliği içeriden başlar.",
    ikon: "🔐",
  },
  {
    baslik: "30 Günlük Nakit Projeksiyonu",
    aciklama: "Planlanan gelir ve giderleri hesaba katarak 30 gün sonraki kasa bakiyeni tahmin eder. Runway'ini bil, panik yapma.",
    ikon: "📈",
  },
];

const TRUST = [
  { rakam: "1.250+", etiket: "Aktif işletme" },
  { rakam: "14M ₺",  etiket: "Aylık hacim" },
  { rakam: "%99,9",  etiket: "Uptime" },
  { rakam: "3 ayda 1", etiket: "İşletme kriz önledi" },
];

/* ─── Dashboard Mockup ─── */
function DashboardMockup() {
  return (
    <div className="w-full max-w-3xl mx-auto rounded-2xl overflow-hidden shadow-2xl border border-gray-200">
      {/* Browser chrome */}
      <div className="bg-gray-100 border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 bg-white rounded-md px-3 py-1 text-xs text-gray-400 border border-gray-200">
          app.pilotsensin.com/dashboard
        </div>
      </div>

      {/* App shell */}
      <div className="flex bg-white" style={{ minHeight: 320 }}>
        {/* Sidebar mini */}
        <div className="w-12 shrink-0 flex flex-col items-center py-4 gap-3" style={{ background: "var(--forest)" }}>
          <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center text-white text-xs">✈</div>
          {["▦","↗","∑","□","✓","≡","⛨","👥"].map((ic, i) => (
            <div key={i} className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs ${i === 0 ? "bg-white/15 text-white" : "text-white/40"}`}>
              {ic}
            </div>
          ))}
        </div>

        {/* Main content */}
        <div className="flex-1 p-5 space-y-4 overflow-hidden">
          {/* Hero row */}
          <div>
            <p className="label-caps text-[9px] mb-1">HOŞ GELDİN, AHMET · 19 MAYIS 2026</p>
            <p className="font-number font-semibold text-2xl leading-none" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
              186.450 ₺
            </p>
            <p className="text-[10px] mt-0.5" style={{ color: "var(--text-secondary)" }}>
              Kasa bakiyesi · <span style={{ color: "var(--color-success)" }}>+12.300 ₺ bugün</span> · 8 işlem
            </p>
          </div>

          {/* Stat strip */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { e: "Bugünkü ciro",  d: "12.300 ₺", a: "↑ %8", c: "#10B981" },
              { e: "Aylık net kâr", d: "54.200 ₺", a: "Net marj %31", c: "#10B981" },
              { e: "Kritik stok",   d: "3",          a: "İlgi gerekli", c: "#EF4444" },
              { e: "KDV (bu ay)",   d: "8.640 ₺",   a: "Ödenecek",    c: "#F59E0B" },
            ].map((s) => (
              <div key={s.e} className="stat-card p-2">
                <p className="label-caps text-[8px] mb-1">{s.e}</p>
                <p className="font-number font-semibold text-sm">{s.d}</p>
                <p className="text-[9px] font-medium mt-0.5" style={{ color: s.c }}>{s.a}</p>
              </div>
            ))}
          </div>

          {/* İlgi gerekli */}
          <div>
            <div className="flex justify-between mb-1">
              <p className="text-[10px] font-semibold">İlgi gerekli</p>
              <p className="text-[9px]" style={{ color: "var(--leaf)" }}>Tüm uyarılar →</p>
            </div>
            {[
              { r: "#EF4444", t: "3 ürün kritik seviyede",   d: "Filtre Kağıdı, Koli Bandı, Temizlik Spreyi" },
              { r: "#F59E0B", t: "2 görev gecikti",          d: "Stok sayımı, Tedarikçi görüşmesi" },
            ].map((u, i) => (
              <div key={i} className="flex items-center gap-2 py-1">
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: u.r }} />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-medium truncate">{u.t}</p>
                  <p className="text-[9px] truncate" style={{ color: "var(--text-secondary)" }}>{u.d}</p>
                </div>
                <p className="text-[9px]" style={{ color: "var(--leaf)" }}>Düzelt →</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Page ─── */
export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col text-gray-900" style={{ background: "#fff" }}>

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="text-lg font-black tracking-tight" style={{ color: "var(--forest)" }}>
            Pilot<span className="text-gray-900">Sensin</span>
          </span>
          <nav className="flex items-center gap-2">
            <a href="#fiyat"
              className="hidden sm:block text-sm px-3 py-1.5 rounded-lg text-gray-500 hover:text-gray-700 transition-colors">
              Fiyatlandırma
            </a>
            <Link href="/giris"
              className="text-sm px-3 sm:px-4 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
              Giriş yap
            </Link>
            <Link href="/kayit"
              className="text-sm px-3 sm:px-4 py-1.5 rounded-lg font-semibold text-white whitespace-nowrap transition-opacity hover:opacity-90"
              style={{ background: "var(--forest)" }}>
              Ücretsiz dene
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">

        {/* ── Hero ── */}
        <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
          {/* Kırmızı pill */}
          <div className="inline-flex items-center gap-2 mb-8 px-3 py-1.5 rounded-full border text-sm font-semibold"
            style={{ background: "rgba(239,68,68,0.06)", borderColor: "rgba(239,68,68,0.25)", color: "#DC2626" }}>
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
            Türkiye&apos;de %60 KOBİ ilk 5 yılda batıyor
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-6 max-w-3xl mx-auto">
            İşletmeni 30 günde{" "}
            <br className="hidden sm:block" />
            <span style={{ color: "var(--forest)" }}>batmaktan kurtar</span>
          </h1>

          <p className="text-lg max-w-xl mx-auto mb-10 text-gray-500" style={{ lineHeight: 1.7 }}>
            Nakit körü, stok körlüğü, planlama boşluğu — PilotSensin tüm
            operasyonunu tek platformda birleştirir ve kriz olmadan <strong className="text-gray-700">önceden uyarır.</strong>
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/kayit"
              className="px-7 py-3.5 rounded-xl font-bold text-base text-white transition-opacity hover:opacity-90 shadow-lg"
              style={{ background: "var(--forest)" }}>
              7 Gün Ücretsiz Başla
            </Link>
            <Link href="/giris"
              className="px-7 py-3.5 rounded-xl font-semibold text-base text-gray-600 bg-white border border-gray-200 hover:border-gray-300 transition-colors">
              Giriş Yap
            </Link>
          </div>
          <p className="text-xs mt-4 text-gray-400">Kredi kartı gerekmez · Kurulum yok · Hemen başla</p>
        </section>

        {/* ── Dashboard Mockup ── */}
        <section className="max-w-6xl mx-auto px-6 pb-20">
          <DashboardMockup />
        </section>

        {/* ── Trust Strip ── */}
        <section className="border-y border-gray-100 py-10" style={{ background: "#FAFAFA" }}>
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {TRUST.map((t) => (
                <div key={t.etiket}>
                  <p className="font-number font-black text-2xl mb-1" style={{ color: "var(--forest)" }}>{t.rakam}</p>
                  <p className="text-xs text-gray-500">{t.etiket}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Problem ── */}
        <section className="max-w-6xl mx-auto px-6 py-24">
          <div className="mb-14">
            <p className="label-caps mb-3">GERÇEKLERLE YÜZLEŞ</p>
            <h2 className="text-3xl sm:text-4xl font-bold max-w-xl text-gray-900">
              İşletmelerin batmasının{" "}
              <span style={{ color: "#DC2626" }}>6 temel nedeni</span>
            </h2>
            <p className="mt-3 text-sm text-gray-500 max-w-xl">
              Bunların hepsi sessizce büyür. Fark ettiğinde çok geç olmuş olabilir.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {SORUNLAR.map((s) => (
              <div key={s.no} className="rounded-xl p-6 border border-gray-100 hover:border-red-100 hover:bg-red-50/30 transition-colors">
                <p className="font-number font-black text-3xl mb-4" style={{ color: "rgba(239,68,68,0.15)" }}>{s.no}</p>
                <h3 className="font-bold text-sm mb-2 text-gray-800">{s.baslik}</h3>
                <p className="text-sm leading-relaxed text-gray-500">{s.aciklama}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Çözüm ── */}
        <section className="border-y border-gray-100 py-24" style={{ background: "#FAFAFA" }}>
          <div className="max-w-6xl mx-auto px-6">
            <div className="mb-14">
              <p className="label-caps mb-3">ERKEN UYARI ÇÖZÜMÜ</p>
              <h2 className="text-3xl sm:text-4xl font-bold max-w-xl text-gray-900">
                Üç katman,{" "}
                <span style={{ color: "var(--forest)" }}>bir platform</span>
              </h2>
              <p className="mt-3 text-sm text-gray-500 max-w-xl">
                Birbirinden bağımsız araçlar değil — birlikte çalışan üç katman.
                Her katman diğerini besler, körlük noktası kalmaz.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {COZUMLER.map((c) => (
                <div key={c.no} className="rounded-xl p-7 border" style={{ background: "var(--mint)", borderColor: "var(--forest-200, #B3E8C8)" }}>
                  <p className="font-number font-bold text-xs mb-1" style={{ color: "var(--forest)" }}>{c.no}</p>
                  <p className="text-xs font-semibold tracking-wider mb-2" style={{ color: "var(--leaf)" }}>{c.alt}</p>
                  <h3 className="font-bold text-lg mb-2 text-gray-800">{c.baslik}</h3>
                  <p className="text-sm text-gray-500 mb-5 leading-relaxed">{c.aciklama}</p>
                  <ul className="space-y-2">
                    {c.maddeler.map((m) => (
                      <li key={m} className="flex items-start gap-2 text-sm text-gray-600">
                        <span style={{ color: "var(--leaf)", marginTop: 1 }}>→</span>
                        {m}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Özellikler (split layout) ── */}
        <section className="max-w-6xl mx-auto px-6 py-24">
          <div className="text-center mb-14">
            <p className="label-caps mb-3">ÖZELLİKLER</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Daha önce görmediğin{" "}
              <span style={{ color: "var(--forest)" }}>araçlar</span>
            </h2>
          </div>
          <div className="space-y-16">
            {OZELLIKLER.map((o, i) => (
              <div
                key={o.baslik}
                className={`flex flex-col md:flex-row items-center gap-10 md:gap-16 ${i % 2 === 1 ? "md:flex-row-reverse" : ""}`}
              >
                {/* İkon / görsel tarafı */}
                <div className="shrink-0 w-full md:w-72 h-48 rounded-2xl flex items-center justify-center text-6xl border border-gray-100"
                  style={{ background: "var(--mint)" }}>
                  {o.ikon}
                </div>
                {/* Metin tarafı */}
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{o.baslik}</h3>
                  <p className="text-base text-gray-500 leading-relaxed">{o.aciklama}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Pricing (client) ── */}
        <div className="border-t border-gray-100" style={{ background: "#FAFAFA" }}>
          <PricingSection />
        </div>

        {/* ── SSS (client) ── */}
        <div className="border-t border-gray-100">
          <SSSSection />
        </div>

        {/* ── Final CTA ── */}
        <section className="px-6 py-4 pb-24">
          <div className="max-w-3xl mx-auto rounded-2xl px-10 py-16 text-center" style={{ background: "var(--forest)" }}>
            <p className="label-caps mb-4" style={{ color: "rgba(255,255,255,0.5)" }}>BAŞLAMAK İÇİN YETERLİ BİR NEDEN</p>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4 leading-tight">
              İşletmeni kontrol<br />altına al
            </h2>
            <p className="text-sm text-white/60 mb-10 max-w-md mx-auto" style={{ lineHeight: 1.7 }}>
              Bugün kaydol, 7 gün içinde nakit akışını, stoğunu ve ekibini
              tek ekrandan yönetmeye başla.
            </p>
            <Link href="/kayit"
              className="inline-block px-10 py-4 rounded-xl font-bold text-base transition-opacity hover:opacity-90 text-gray-900"
              style={{ background: "#fff" }}>
              Ücretsiz Hesap Oluştur
            </Link>
            <p className="text-xs mt-4 text-white/40">Kurulum yok · Eğitim gerekmez · Hemen aktif</p>
          </div>
        </section>

      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100" style={{ background: "#fff" }}>
        <div className="max-w-6xl mx-auto px-6 py-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            {/* Kolon 1 — Marka */}
            <div className="col-span-2 md:col-span-1">
              <span className="text-base font-black tracking-tight block mb-3" style={{ color: "var(--forest)" }}>
                Pilot<span className="text-gray-900">Sensin</span>
              </span>
              <p className="text-xs text-gray-400 leading-relaxed">
                KOBİ&apos;ler için erken uyarı ve operasyon platformu. İşletmeni krizden önce koru.
              </p>
            </div>
            {/* Kolon 2 — Platform */}
            <div>
              <p className="text-xs font-semibold text-gray-800 mb-3 uppercase tracking-wider">Platform</p>
              <ul className="space-y-2 text-xs text-gray-400">
                {[
                  { href: "/dashboard",   label: "Dashboard"     },
                  { href: "/nakit-akisi", label: "Nakit Akışı"   },
                  { href: "/kar-zarar",   label: "Kâr-Zarar"     },
                  { href: "/stok",        label: "Stok"          },
                  { href: "/gorevler",    label: "Görevler"      },
                  { href: "/prosedurler", label: "Prosedürler"   },
                  { href: "/acil-fon",    label: "Acil Fon"      },
                ].map(({ href, label }) => (
                  <li key={href}><Link href={href} className="hover:text-gray-600 transition-colors">{label}</Link></li>
                ))}
              </ul>
            </div>
            {/* Kolon 3 — Şirket */}
            <div>
              <p className="text-xs font-semibold text-gray-800 mb-3 uppercase tracking-wider">Şirket</p>
              <ul className="space-y-2 text-xs text-gray-400">
                {[
                  { href: "#fiyat",    label: "Fiyatlandırma" },
                  { href: "/iletisim", label: "İletişim"      },
                  { href: "/giris",    label: "Giriş yap"     },
                  { href: "/kayit",    label: "Ücretsiz dene" },
                ].map(({ href, label }) => (
                  <li key={href}><Link href={href} className="hover:text-gray-600 transition-colors">{label}</Link></li>
                ))}
              </ul>
            </div>
            {/* Kolon 4 — Yasal */}
            <div>
              <p className="text-xs font-semibold text-gray-800 mb-3 uppercase tracking-wider">Yasal</p>
              <ul className="space-y-2 text-xs text-gray-400">
                {[
                  { href: "/politikalar/kvkk",               label: "KVKK"               },
                  { href: "/politikalar/gizlilik",            label: "Gizlilik"           },
                  { href: "/politikalar/kullanim-kosullari",  label: "Kullanım Koşulları" },
                  { href: "/politikalar/cerez",               label: "Çerez"              },
                  { href: "/politikalar/mesafeli-satis",      label: "Mesafeli Satış"     },
                  { href: "/politikalar/on-bilgilendirme",    label: "Ön Bilgilendirme"   },
                  { href: "/politikalar/iade-iptal",          label: "İade & İptal"       },
                  { href: "/politikalar/acik-riza",           label: "Açık Rıza"          },
                  { href: "/politikalar/sla",                 label: "SLA"                },
                ].map(({ href, label }) => (
                  <li key={href}><Link href={href} className="hover:text-gray-600 transition-colors">{label}</Link></li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-gray-400">© {new Date().getFullYear()} PilotSensin</p>
            <p className="text-xs text-gray-400">destek@pilotsensin.com</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
