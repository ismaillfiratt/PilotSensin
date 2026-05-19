import Link from "next/link";

const SORUNLAR = [
  { no: "01", baslik: "Nakit Akışı Körlüğü",    aciklama: "Paranın nereye gittiğini bilmeden işletiyorsunuz. Beklenmedik gider geldiğinde kasanızda ne var bilmiyorsunuz." },
  { no: "02", baslik: "KDV / Kâr-Zarar Kargaşası", aciklama: "Vergi döneminde gerçek kârınız ve KDV mahsuplaşmalarınız hâlâ belirsiz. Muhasebeci bile tam cevap veremiyor." },
  { no: "03", baslik: "Stok Yönetimsizliği",     aciklama: "Ne tükendiğini fark etmek için müşteri şikâyeti bekliyorsunuz. Stok fazlası ve fireler sizi sessizce eritiyor." },
  { no: "04", baslik: "Planlama Boşluğu",         aciklama: "Görevler kafada takip ediliyor. Kimin ne yapması gerektiği belirsiz; sorumluluk kimsenin üzerinde değil." },
  { no: "05", baslik: "SOP Eksikliği",             aciklama: "Çalışan değişince her şey sıfırdan başlıyor. İş süreçleri yazılı değil, kurumsal hafıza bireylerle gidiyor." },
  { no: "06", baslik: "Acil Durum Fonsuzluğu",   aciklama: "Kriz anında ne yapacağınızı bilmiyorsunuz. Küçük bir şok bile nakit döngüsünü çökertebiliyor." },
];

const COZUMLER = [
  { katman: "01 — Nakit & Muhasebe", baslik: "Finansal Görünürlük",  maddeler: ["Anlık nakit akışı takibi", "KDV mahsuplaşma otomasyonu", "Kâr-zarar hiyerarşisi ve analizi"] },
  { katman: "02 — Operasyon",         baslik: "İş Süreci Kontrolü",   maddeler: ["Ürün ve stok hareketi yönetimi", "Görev ataması ve takibi", "SOP / prosedür kütüphanesi"] },
  { katman: "03 — Yönetim",           baslik: "Ekip & Risk Yönetimi", maddeler: ["Acil durum fonu modülü", "Pilot / Co-Pilot rol kısıtlama", "Çalışan yetki ve izin yönetimi"] },
];

const OZELLIKLER = [
  { baslik: "KDV Mahsuplaşma Hesaplama", aciklama: "Gelir ve gider KDV'lerini otomatik karşılaştırır, net ödeme ya da iade tutarınızı anlık gösterir." },
  { baslik: "Çalışan Rol Kısıtlama",     aciklama: "Pilot (işletme sahibi) tam yetkiyle çalışır; Co-Pilot yalnızca izin verilen modüllere erişir." },
  { baslik: "Gerçek Zamanlı Uyarılar",   aciklama: "Kritik duyurular ve güncellemeler anında ekrana gelir, hiçbir şeyi kaçırmazsınız." },
  { baslik: "Tüm Veriler Senkron",       aciklama: "Nakit, stok, görev ve raporlar aynı platformda. Ekibin tüm üyeleri aynı gerçeği görür." },
];

function Ayrac() {
  return <hr className="border-gray-200" />;
}

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900">

      {/* ── Navbar ── */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-xl font-black tracking-tight" style={{ color: "var(--forest)" }}>
            Pilot<span className="text-gray-900">Sensin</span>
          </span>
          <nav className="flex items-center gap-2">
            <Link href="/fiyatlandirma"
              className="hidden sm:block text-sm px-3 py-1.5 rounded-lg text-gray-500 hover:text-gray-700 transition-colors">
              Fiyatlandırma
            </Link>
            <Link href="/giris"
              className="text-sm px-3 sm:px-4 py-1.5 rounded-lg border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 transition-colors">
              Giriş Yap
            </Link>
            <Link href="/kayit"
              className="text-sm px-3 sm:px-4 py-1.5 rounded-lg font-semibold text-white whitespace-nowrap transition-opacity hover:opacity-90"
              style={{ background: "var(--forest)" }}>
              Ücretsiz Dene
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">

        {/* ── Hero ── */}
        <section className="max-w-6xl mx-auto px-6 py-24 text-center">
          <p className="inline-block text-xs uppercase tracking-widest font-semibold mb-6 px-3 py-1 rounded-full"
            style={{ background: "var(--mint)", color: "var(--forest)", border: "1px solid var(--forest-100, #D9F2E4)" }}>
            Üçlü Entegre Otomasyon Platformu
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-6 max-w-4xl mx-auto text-gray-900">
            İşletmenizin Rotasını{" "}
            <span style={{ color: "var(--forest)" }}>Belirleyin</span>
          </h1>
          <p className="text-lg max-w-2xl mx-auto mb-10 text-gray-500" style={{ lineHeight: 1.7 }}>
            Nakit akışından stoğa, görevlerden SOP&apos;a — PilotSensin tüm
            operasyonlarınızı tek platformda birleştirir. Artık sürpriz yoktur.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/kayit"
              className="px-7 py-3.5 rounded-xl font-bold text-base text-white transition-opacity hover:opacity-90"
              style={{ background: "var(--forest)" }}>
              7 Gün Ücretsiz Başla
            </Link>
            <Link href="/giris"
              className="px-7 py-3.5 rounded-xl font-semibold text-base text-gray-600 bg-white border border-gray-200 hover:border-gray-300 transition-colors">
              Giriş Yap
            </Link>
          </div>
          <p className="text-xs mt-5 text-gray-400">
            Kredi kartı gerekmez · Kurulum yok · Hemen başlayın
          </p>
        </section>

        <Ayrac />

        {/* ── 6 Sorun ── */}
        <section className="bg-white py-20">
          <div className="max-w-6xl mx-auto px-6">
            <div className="mb-14">
              <p className="text-xs uppercase tracking-widest mb-3 text-gray-400 font-semibold">
                Neden işletmeler kapanıyor?
              </p>
              <h2 className="text-3xl font-bold max-w-xl text-gray-900">
                İşletmelerin Batmasının{" "}
                <span style={{ color: "var(--forest)" }}>6 Temel Nedeni</span>
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {SORUNLAR.map((s) => (
                <div key={s.no} className="rounded-xl p-6 bg-gray-50 border border-gray-100">
                  <p className="text-3xl font-black mb-4" style={{ color: "var(--forest-100, #D9F2E4)" }}>{s.no}</p>
                  <h3 className="font-bold text-base mb-2 text-gray-800">{s.baslik}</h3>
                  <p className="text-sm leading-relaxed text-gray-500">{s.aciklama}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <Ayrac />

        {/* ── Çözüm ── */}
        <section className="max-w-6xl mx-auto px-6 py-20">
          <div className="mb-14">
            <p className="text-xs uppercase tracking-widest mb-3 text-gray-400 font-semibold">
              PilotSensin çözümü
            </p>
            <h2 className="text-3xl font-bold max-w-xl text-gray-900">
              <span style={{ color: "var(--forest)" }}>Üçlü Entegre</span> Otomasyon
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-gray-500">
              Birbirinden bağımsız araçlar değil; birlikte çalışan üç katman.
              Her katman diğerini besler, körlük noktası kalmaz.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {COZUMLER.map((c) => (
              <div key={c.katman} className="rounded-xl p-7 border"
                style={{ background: "var(--mint)", borderColor: "var(--forest-200, #B3E8C8)" }}>
                <p className="text-xs font-semibold tracking-wider mb-3" style={{ color: "var(--forest)" }}>{c.katman}</p>
                <h3 className="font-bold text-lg mb-5 text-gray-800">{c.baslik}</h3>
                <ul className="space-y-2.5">
                  {c.maddeler.map((m) => (
                    <li key={m} className="flex items-start gap-2.5 text-sm text-gray-600">
                      <span style={{ color: "var(--leaf)", marginTop: 1 }}>→</span>
                      {m}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <Ayrac />

        {/* ── Özellikler ── */}
        <section className="bg-white py-20">
          <div className="max-w-6xl mx-auto px-6">
            <div className="mb-14">
              <p className="text-xs uppercase tracking-widest mb-3 text-gray-400 font-semibold">
                Öne çıkan özellikler
              </p>
              <h2 className="text-3xl font-bold text-gray-900">
                İşletmenize Özel{" "}
                <span style={{ color: "var(--forest)" }}>Araçlar</span>
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-6">
              {OZELLIKLER.map((o) => (
                <div key={o.baslik} className="rounded-xl p-6 flex gap-4 bg-gray-50 border border-gray-100">
                  <div className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center text-base font-bold text-white"
                    style={{ background: "var(--forest)" }}>✓</div>
                  <div>
                    <h3 className="font-semibold mb-1.5 text-gray-800">{o.baslik}</h3>
                    <p className="text-sm leading-relaxed text-gray-500">{o.aciklama}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <Ayrac />

        {/* ── Fiyatlandırma ── */}
        <section className="max-w-6xl mx-auto px-6 py-20">
          <div className="mb-14 text-center">
            <p className="text-xs uppercase tracking-widest mb-3 text-gray-400 font-semibold">
              Fiyatlandırma
            </p>
            <h2 className="text-3xl font-bold text-gray-900">
              Tek Plan,{" "}
              <span style={{ color: "var(--forest)" }}>Şeffaf Fiyat</span>
            </h2>
            <p className="mt-3 text-sm text-gray-500">Gizli ücret yok. Ek modül yok. Her şey dahil.</p>
          </div>
          <div className="max-w-md mx-auto rounded-2xl overflow-hidden border-2"
            style={{ borderColor: "var(--forest)" }}>
            <div className="px-8 pt-8 pb-6" style={{ background: "var(--forest)" }}>
              <p className="text-xs uppercase tracking-widest mb-2 text-white/70 font-semibold">İşletme Paketi</p>
              <div className="flex items-end gap-2 mb-4">
                <span className="text-5xl font-black text-white font-number">499</span>
                <span className="text-lg mb-1 text-white/60">TL/ay</span>
              </div>
              <p className="text-sm text-white/70">İlk 3 çalışan dahil · Her ek Co-Pilot +100 TL/ay</p>
            </div>
            <div className="px-8 py-6 space-y-3 bg-white">
              {["Tüm modüllere sınırsız erişim", "3 Co-Pilot hesabı dahil", "Gerçek zamanlı bildirimler",
                "KDV mahsuplaşma ve raporlar", "Pilot / Co-Pilot yetki sistemi", "7×24 kullanım"].map((f) => (
                <div key={f} className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="font-bold" style={{ color: "var(--leaf)" }}>✓</span>{f}
                </div>
              ))}
            </div>
            <div className="px-8 pb-8 pt-5 bg-white border-t border-gray-100">
              <Link href="/kayit"
                className="w-full block text-center py-3.5 rounded-xl font-bold text-base text-white transition-opacity hover:opacity-90"
                style={{ background: "var(--forest)" }}>
                7 Gün Ücretsiz Başla
              </Link>
              <p className="text-center text-xs mt-3 text-gray-400">
                Kredi kartı gerekmez · İstediğiniz zaman iptal
              </p>
            </div>
          </div>
        </section>

        <Ayrac />

        {/* ── Son CTA ── */}
        <section className="max-w-6xl mx-auto px-6 py-24 text-center">
          <h2 className="text-3xl font-bold mb-4 text-gray-900">
            İşletmenizi Kontrol Altına{" "}
            <span style={{ color: "var(--forest)" }}>Alın</span>
          </h2>
          <p className="text-sm mb-10 max-w-xl mx-auto text-gray-500" style={{ lineHeight: 1.7 }}>
            Bugün kaydolun, 7 gün içinde nakit akışınızı, stoğunuzu ve ekibinizi
            tek ekrandan yönetmeye başlayın.
          </p>
          <Link href="/kayit"
            className="inline-block px-10 py-4 rounded-xl font-bold text-lg text-white transition-opacity hover:opacity-90"
            style={{ background: "var(--forest)" }}>
            Ücretsiz Hesap Oluştur
          </Link>
          <p className="text-xs mt-4 text-gray-400">Kurulum yok · Eğitim gerekmez · Hemen aktif</p>
        </section>

      </main>

      {/* ── Footer ── */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col items-center gap-4">
          <span className="font-black tracking-tight" style={{ color: "var(--forest)" }}>
            Pilot<span className="text-gray-400">Sensin</span>
          </span>
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-gray-400">
            <Link href="/fiyatlandirma"                  className="hover:text-gray-600 transition-colors">Fiyatlandırma</Link>
            <Link href="/politikalar/kvkk"               className="hover:text-gray-600 transition-colors">KVKK</Link>
            <Link href="/politikalar/gizlilik"           className="hover:text-gray-600 transition-colors">Gizlilik</Link>
            <Link href="/politikalar/kullanim-kosullari" className="hover:text-gray-600 transition-colors">Kullanım Koşulları</Link>
            <Link href="/politikalar/cerez"              className="hover:text-gray-600 transition-colors">Çerez</Link>
            <Link href="/politikalar/mesafeli-satis"     className="hover:text-gray-600 transition-colors">Mesafeli Satış</Link>
            <Link href="/politikalar/on-bilgilendirme"   className="hover:text-gray-600 transition-colors">Ön Bilgilendirme</Link>
            <Link href="/politikalar/iade-iptal"         className="hover:text-gray-600 transition-colors">İade &amp; İptal</Link>
            <Link href="/politikalar/acik-riza"          className="hover:text-gray-600 transition-colors">Açık Rıza</Link>
            <Link href="/politikalar/sla"                className="hover:text-gray-600 transition-colors">SLA</Link>
          </div>
          <p className="text-xs text-gray-400">© {new Date().getFullYear()} PilotSensin · destek@pilotsensin.com</p>
        </div>
      </footer>

    </div>
  );
}
