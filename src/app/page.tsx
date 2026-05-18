import Link from "next/link";

/* ─── Veri ─────────────────────────────────────────────────────────────────── */

const SORUNLAR = [
  {
    no: "01",
    baslik: "Nakit Akışı Körlüğü",
    aciklama:
      "Paranın nereye gittiğini bilmeden işletiyorsunuz. Beklenmedik gider geldiğinde kasanızda ne var bilmiyorsunuz.",
  },
  {
    no: "02",
    baslik: "KDV / Kâr-Zarar Kargaşası",
    aciklama:
      "Vergi döneminde gerçek kârınız ve KDV mahsuplaşmalarınız hâlâ belirsiz. Muhasebeci bile tam cevap veremiyor.",
  },
  {
    no: "03",
    baslik: "Stok Yönetimsizliği",
    aciklama:
      "Ne tükendiğini fark etmek için müşteri şikâyeti bekliyorsunuz. Stok fazlası ve fireler sizi sessizce eritiyor.",
  },
  {
    no: "04",
    baslik: "Planlama Boşluğu",
    aciklama:
      "Görevler kafada takip ediliyor. Kimin ne yapması gerektiği belirsiz; sorumluluk kimsenin üzerinde değil.",
  },
  {
    no: "05",
    baslik: "SOP Eksikliği",
    aciklama:
      "Çalışan değişince her şey sıfırdan başlıyor. İş süreçleri yazılı değil, kurumsal hafıza bireylerle gidiyor.",
  },
  {
    no: "06",
    baslik: "Acil Durum Fonsuzluğu",
    aciklama:
      "Kriz anında ne yapacağınızı bilmiyorsunuz. Küçük bir şok bile nakit döngüsünü çökertebiliyor.",
  },
];

const COZUMLER = [
  {
    katman: "01 — Nakit & Muhasebe",
    baslik: "Finansal Görünürlük",
    maddeler: [
      "Anlık nakit akışı takibi",
      "KDV mahsuplaşma otomasyonu",
      "Kâr-zarar hiyerarşisi ve analizi",
    ],
  },
  {
    katman: "02 — Operasyon",
    baslik: "İş Süreci Kontrolü",
    maddeler: [
      "Ürün ve stok hareketi yönetimi",
      "Görev ataması ve takibi",
      "SOP / prosedür kütüphanesi",
    ],
  },
  {
    katman: "03 — Yönetim",
    baslik: "Ekip & Risk Yönetimi",
    maddeler: [
      "Acil durum fonu modülü",
      "Pilot / Co-Pilot rol kısıtlama",
      "Çalışan yetki ve izin yönetimi",
    ],
  },
];

const OZELLIKLER = [
  {
    baslik: "KDV Mahsuplaşma Hesaplama",
    aciklama:
      "Gelir ve gider KDV'lerini otomatik karşılaştırır, net ödeme ya da iade tutarınızı anlık gösterir.",
  },
  {
    baslik: "Çalışan Rol Kısıtlama",
    aciklama:
      "Pilot (işletme sahibi) tam yetkiyle çalışır; Co-Pilot yalnızca izin verilen modüllere erişir.",
  },
  {
    baslik: "Gerçek Zamanlı Uyarılar",
    aciklama:
      "Kritik duyurular ve güncellemeler anında ekrana gelir, hiçbir şeyi kaçırmazsınız.",
  },
  {
    baslik: "Tüm Veriler Senkron",
    aciklama:
      "Nakit, stok, görev ve raporlar aynı platformda. Ekibin tüm üyeleri aynı gerçeği görür.",
  },
];

function Ayrac() {
  return <hr style={{ borderColor: "rgba(255,255,255,0.06)" }} />;
}

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#0e172a", color: "#ffffff" }}>

      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <header style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-xl font-black tracking-tight" style={{ color: "#fbc024" }}>
            Pilot<span style={{ color: "#ffffff" }}>Sensin</span>
          </span>
          <nav className="flex items-center gap-2 sm:gap-3">
            <Link href="/fiyatlandirma" className="hidden sm:block text-sm px-3 py-1.5 rounded-lg"
              style={{ color: "#64748b" }}>
              Fiyatlandırma
            </Link>
            <Link href="/giris" className="text-sm px-3 sm:px-4 py-1.5 rounded-lg"
              style={{ background: "rgba(255,255,255,0.05)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.1)" }}>
              Giriş Yap
            </Link>
            <Link href="/kayit" className="text-sm px-3 sm:px-4 py-1.5 rounded-lg font-semibold whitespace-nowrap"
              style={{ background: "#fbc024", color: "#0e172a" }}>
              Ücretsiz Dene
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">

        {/* ── Hero ───────────────────────────────────────────────────────────── */}
        <section className="max-w-6xl mx-auto px-6 py-24 text-center">
          <p className="inline-block text-xs uppercase tracking-widest font-semibold mb-6 px-3 py-1 rounded-full"
            style={{ background: "rgba(251,192,36,0.1)", color: "#fbc024", border: "1px solid rgba(251,192,36,0.2)" }}>
            Üçlü Entegre Otomasyon Platformu
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-6 max-w-4xl mx-auto">
            İşletmenizin Rotasını{" "}
            <span style={{ color: "#fbc024" }}>Belirleyin</span>
          </h1>
          <p className="text-lg max-w-2xl mx-auto mb-10" style={{ color: "#64748b", lineHeight: 1.7 }}>
            Nakit akışından stoğa, görevlerden SOP&apos;a — PilotSensin tüm
            operasyonlarınızı tek platformda birleştirir. Artık sürpriz yoktur.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/kayit" className="px-7 py-3.5 rounded-xl font-bold text-base"
              style={{ background: "#fbc024", color: "#0e172a" }}>
              7 Gün Ücretsiz Başla
            </Link>
            <Link href="/giris" className="px-7 py-3.5 rounded-xl font-semibold text-base"
              style={{ background: "rgba(255,255,255,0.04)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.1)" }}>
              Giriş Yap
            </Link>
          </div>
          <p className="text-xs mt-5" style={{ color: "#334155" }}>
            Kredi kartı gerekmez · Kurulum yok · Hemen başlayın
          </p>
        </section>

        <Ayrac />

        {/* ── 6 Sorun ────────────────────────────────────────────────────────── */}
        <section className="max-w-6xl mx-auto px-6 py-20">
          <div className="mb-14">
            <p className="text-xs uppercase tracking-widest mb-3" style={{ color: "#475569" }}>
              Neden işletmeler kapanıyor?
            </p>
            <h2 className="text-3xl font-bold max-w-xl">
              İşletmelerin Batmasının{" "}
              <span style={{ color: "#fbc024" }}>6 Temel Nedeni</span>
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SORUNLAR.map((s) => (
              <div key={s.no} className="rounded-xl p-6"
                style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-3xl font-black mb-4" style={{ color: "rgba(251,192,36,0.2)" }}>{s.no}</p>
                <h3 className="font-bold text-base mb-2">{s.baslik}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#64748b" }}>{s.aciklama}</p>
              </div>
            ))}
          </div>
        </section>

        <Ayrac />

        {/* ── Çözüm ──────────────────────────────────────────────────────────── */}
        <section className="max-w-6xl mx-auto px-6 py-20">
          <div className="mb-14">
            <p className="text-xs uppercase tracking-widest mb-3" style={{ color: "#475569" }}>
              PilotSensin çözümü
            </p>
            <h2 className="text-3xl font-bold max-w-xl">
              <span style={{ color: "#fbc024" }}>Üçlü Entegre</span> Otomasyon
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed" style={{ color: "#64748b" }}>
              Birbirinden bağımsız araçlar değil; birlikte çalışan üç katman.
              Her katman diğerini besler, körlük noktası kalmaz.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {COZUMLER.map((c) => (
              <div key={c.katman} className="rounded-xl p-7"
                style={{ background: "rgba(251,192,36,0.04)", border: "1px solid rgba(251,192,36,0.15)" }}>
                <p className="text-xs font-semibold tracking-wider mb-3" style={{ color: "#fbc024" }}>{c.katman}</p>
                <h3 className="font-bold text-lg mb-5">{c.baslik}</h3>
                <ul className="space-y-2.5">
                  {c.maddeler.map((m) => (
                    <li key={m} className="flex items-start gap-2.5 text-sm" style={{ color: "#94a3b8" }}>
                      <span style={{ color: "#fbc024", marginTop: 1 }}>→</span>
                      {m}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <Ayrac />

        {/* ── Özellikler ─────────────────────────────────────────────────────── */}
        <section className="max-w-6xl mx-auto px-6 py-20">
          <div className="mb-14">
            <p className="text-xs uppercase tracking-widest mb-3" style={{ color: "#475569" }}>
              Öne çıkan özellikler
            </p>
            <h2 className="text-3xl font-bold">
              İşletmenize Özel <span style={{ color: "#fbc024" }}>Araçlar</span>
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {OZELLIKLER.map((o) => (
              <div key={o.baslik} className="rounded-xl p-6 flex gap-4"
                style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center text-base"
                  style={{ background: "rgba(251,192,36,0.1)", color: "#fbc024" }}>✓</div>
                <div>
                  <h3 className="font-semibold mb-1.5">{o.baslik}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#64748b" }}>{o.aciklama}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <Ayrac />

        {/* ── Fiyatlandırma ──────────────────────────────────────────────────── */}
        <section className="max-w-6xl mx-auto px-6 py-20">
          <div className="mb-14 text-center">
            <p className="text-xs uppercase tracking-widest mb-3" style={{ color: "#475569" }}>
              Fiyatlandırma
            </p>
            <h2 className="text-3xl font-bold">
              Tek Plan, <span style={{ color: "#fbc024" }}>Şeffaf Fiyat</span>
            </h2>
            <p className="mt-3 text-sm" style={{ color: "#64748b" }}>Gizli ücret yok. Ek modül yok. Her şey dahil.</p>
          </div>
          <div className="max-w-md mx-auto rounded-2xl overflow-hidden"
            style={{ border: "1px solid rgba(251,192,36,0.35)" }}>
            <div className="px-8 pt-8 pb-6" style={{ background: "rgba(251,192,36,0.06)" }}>
              <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "#fbc024" }}>İşletme Paketi</p>
              <div className="flex items-end gap-2 mb-4">
                <span className="text-5xl font-black" style={{ color: "#fbc024" }}>499</span>
                <span className="text-lg mb-1" style={{ color: "#64748b" }}>TL/ay</span>
              </div>
              <p className="text-sm" style={{ color: "#64748b" }}>
                İlk 3 çalışan dahil · Her ek Co-Pilot +100 TL/ay
              </p>
            </div>
            <div className="px-8 py-6 space-y-3" style={{ background: "rgba(255,255,255,0.02)" }}>
              {[
                "Tüm modüllere sınırsız erişim",
                "3 Co-Pilot hesabı dahil",
                "Gerçek zamanlı bildirimler",
                "KDV mahsuplaşma ve raporlar",
                "Pilot / Co-Pilot yetki sistemi",
                "7×24 kullanım",
              ].map((f) => (
                <div key={f} className="flex items-center gap-3 text-sm" style={{ color: "#94a3b8" }}>
                  <span style={{ color: "#fbc024", fontWeight: 700 }}>✓</span>{f}
                </div>
              ))}
            </div>
            <div className="px-8 pb-8 pt-5" style={{ background: "rgba(255,255,255,0.02)" }}>
              <Link href="/kayit" className="w-full block text-center py-3.5 rounded-xl font-bold text-base"
                style={{ background: "#fbc024", color: "#0e172a" }}>
                7 Gün Ücretsiz Başla
              </Link>
              <p className="text-center text-xs mt-3" style={{ color: "#334155" }}>
                Kredi kartı gerekmez · İstediğiniz zaman iptal
              </p>
            </div>
          </div>
        </section>

        <Ayrac />

        {/* ── Son CTA ────────────────────────────────────────────────────────── */}
        <section className="max-w-6xl mx-auto px-6 py-24 text-center">
          <h2 className="text-3xl font-bold mb-4">
            İşletmenizi Kontrol Altına <span style={{ color: "#fbc024" }}>Alın</span>
          </h2>
          <p className="text-sm mb-10 max-w-xl mx-auto" style={{ color: "#64748b", lineHeight: 1.7 }}>
            Bugün kaydolun, 7 gün içinde nakit akışınızı, stoğunuzu ve ekibinizi
            tek ekrandan yönetmeye başlayın.
          </p>
          <Link href="/kayit" className="inline-block px-10 py-4 rounded-xl font-bold text-lg"
            style={{ background: "#fbc024", color: "#0e172a" }}>
            Ücretsiz Hesap Oluştur
          </Link>
          <p className="text-xs mt-4" style={{ color: "#334155" }}>
            Kurulum yok · Eğitim gerekmez · Hemen aktif
          </p>
        </section>

      </main>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-black tracking-tight" style={{ color: "#fbc024" }}>
            Pilot<span style={{ color: "#64748b" }}>Sensin</span>
          </span>
          <div className="flex items-center gap-6 text-xs" style={{ color: "#334155" }}>
            <Link href="/fiyatlandirma" className="hover:text-slate-400">Fiyatlandırma</Link>
            <Link href="/politikalar/gizlilik" className="hover:text-slate-400">Gizlilik</Link>
            <Link href="/politikalar/kullanim-kosullari" className="hover:text-slate-400">Kullanım Koşulları</Link>
            <Link href="/politikalar/kvkk" className="hover:text-slate-400">KVKK</Link>
          </div>
          <p className="text-xs" style={{ color: "#334155" }}>© {new Date().getFullYear()} PilotSensin</p>
        </div>
      </footer>

    </div>
  );
}
