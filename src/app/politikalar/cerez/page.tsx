import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Çerez Politikası – PilotSensin" };

const GUNCELLEME = "19 Mayıs 2026";

export default function CerezPage() {
  return (
    <div className="space-y-6">
      <div className="glass-card rounded-2xl p-6 md:p-8">
        <h1 className="text-2xl font-bold text-white mb-1">Çerez Politikası</h1>
        <p className="text-sm text-[#64748b]">Son güncelleme: {GUNCELLEME}</p>
        <p className="text-sm text-[#94a3b8] mt-3">
          Bu politika, PilotSensin&apos;in çerezleri nasıl kullandığını, çerez türlerini ve
          tercihlerinizi nasıl yönetebileceğinizi açıklamaktadır.
        </p>
      </div>

      <div className="glass-card rounded-2xl p-6 md:p-8 space-y-8 text-[#94a3b8] leading-relaxed">

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">1. Çerez Nedir?</h2>
          <p className="text-sm">
            Çerezler (cookies), bir web sitesini ziyaret ettiğinizde tarayıcınız tarafından
            cihazınıza kaydedilen küçük metin dosyalarıdır. Çerezler; oturumunuzun açık kalmasını
            sağlamak, tercihlerinizi hatırlamak ve platformun düzgün çalışması için gereklidir.
            Benzer teknolojiler arasında yerel depolama (localStorage) ve oturum depolama
            (sessionStorage) da yer almaktadır.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">2. Çerez Kategorileri</h2>

          <div className="space-y-4">
            <div className="border border-[rgba(34,197,94,0.3)] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-[rgba(34,197,94,0.15)] text-[#22c55e]">ZORUNLU</span>
                <span className="text-sm font-semibold text-white">Engellenemez</span>
              </div>
              <p className="text-sm mb-3">Platformun temel işlevleri için zorunludur. Bu çerezler devre dışı bırakılamaz; bırakılması durumunda platform düzgün çalışmaz.</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-[rgba(255,255,255,0.06)]">
                    <th className="text-left py-2 pr-3 text-[#64748b]">Ad</th>
                    <th className="text-left py-2 pr-3 text-[#64748b]">Amaç</th>
                    <th className="text-left py-2 pr-3 text-[#64748b]">Süre</th>
                    <th className="text-left py-2 text-[#64748b]">Sağlayıcı</th>
                  </tr></thead>
                  <tbody className="divide-y divide-[rgba(255,255,255,0.04)]">
                    <tr><td className="py-2 pr-3 font-mono text-[#94a3b8]">sb-auth-token</td><td className="py-2 pr-3">Supabase kimlik doğrulama oturumu</td><td className="py-2 pr-3">Oturum</td><td className="py-2">Supabase (1. taraf)</td></tr>
                    <tr><td className="py-2 pr-3 font-mono text-[#94a3b8]">sb-refresh-token</td><td className="py-2 pr-3">Oturum yenileme tokeni</td><td className="py-2 pr-3">7 gün</td><td className="py-2">Supabase (1. taraf)</td></tr>
                    <tr><td className="py-2 pr-3 font-mono text-[#94a3b8]">__csrf</td><td className="py-2 pr-3">CSRF saldırı koruması</td><td className="py-2 pr-3">Oturum</td><td className="py-2">1. taraf</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="border border-[rgba(59,130,246,0.3)] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-[rgba(59,130,246,0.15)] text-[#3b82f6]">FONKSİYONEL</span>
                <span className="text-sm font-semibold text-white">Açık Rıza Gerektirir</span>
              </div>
              <p className="text-sm mb-3">Tema tercihi, dil ayarı ve benzeri kişiselleştirme verilerini hatırlamak için kullanılır.</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-[rgba(255,255,255,0.06)]">
                    <th className="text-left py-2 pr-3 text-[#64748b]">Ad</th>
                    <th className="text-left py-2 pr-3 text-[#64748b]">Amaç</th>
                    <th className="text-left py-2 pr-3 text-[#64748b]">Süre</th>
                    <th className="text-left py-2 text-[#64748b]">Sağlayıcı</th>
                  </tr></thead>
                  <tbody className="divide-y divide-[rgba(255,255,255,0.04)]">
                    <tr><td className="py-2 pr-3 font-mono text-[#94a3b8]">tema_tercihi</td><td className="py-2 pr-3">Arayüz tema tercihi</td><td className="py-2 pr-3">1 yıl</td><td className="py-2">1. taraf</td></tr>
                    <tr><td className="py-2 pr-3 font-mono text-[#94a3b8]">cerez_tercihi</td><td className="py-2 pr-3">Çerez onay tercihleri</td><td className="py-2 pr-3">1 yıl</td><td className="py-2">1. taraf</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="border border-[rgba(251,192,36,0.3)] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-[rgba(251,192,36,0.15)] text-[#fbc024]">ANALİTİK</span>
                <span className="text-sm font-semibold text-white">Açık Rıza Gerektirir</span>
              </div>
              <p className="text-sm mb-3">Platform kullanım istatistiklerini ölçmek için kullanılır. Kişisel veri içermez veya anonim hale getirilir.</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-[rgba(255,255,255,0.06)]">
                    <th className="text-left py-2 pr-3 text-[#64748b]">Ad</th>
                    <th className="text-left py-2 pr-3 text-[#64748b]">Amaç</th>
                    <th className="text-left py-2 pr-3 text-[#64748b]">Süre</th>
                    <th className="text-left py-2 text-[#64748b]">Sağlayıcı</th>
                  </tr></thead>
                  <tbody className="divide-y divide-[rgba(255,255,255,0.04)]">
                    <tr><td className="py-2 pr-3 font-mono text-[#94a3b8]">_vercel_analytics</td><td className="py-2 pr-3">Vercel Analytics sayfa görüntüleme</td><td className="py-2 pr-3">1 yıl</td><td className="py-2">Vercel (3. taraf)</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="border border-[rgba(148,163,184,0.2)] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-[rgba(148,163,184,0.12)] text-[#94a3b8]">PAZARLAMA</span>
                <span className="text-sm font-semibold text-white">Şu An Kullanılmıyor</span>
              </div>
              <p className="text-sm">Pazarlama amaçlı çerezler şu an kullanılmamaktadır. İleride eklenirse bu politika güncellenerek bildirim yapılacaktır.</p>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">3. Üçüncü Taraf Çerezleri</h2>
          <p className="text-sm">
            Vercel Analytics, sayfa yükleme hızı ve ziyaretçi istatistiklerini ölçmek amacıyla
            çerez veya benzer teknolojiler kullanabilir. Bu ölçümler anonim olup kişisel veri
            içermez. Supabase, kimlik doğrulama ve güvenlik amacıyla birinci taraf çerez
            niteliğinde tokenlar depolar.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">4. Çerez Tercihlerinizi Yönetme</h2>
          <p className="text-sm">Çerez tercihlerinizi aşağıdaki yollarla yönetebilirsiniz:</p>
          <ul className="space-y-1.5 text-sm list-disc list-inside">
            <li><strong className="text-white">Çerez Banner'ı:</strong> İlk ziyarette gösterilen banner üzerinden tercihlerinizi seçebilirsiniz.</li>
            <li><strong className="text-white">Ayarlar Sayfası:</strong> Ayarlar &gt; Yasal Bilgiler bölümünden "Çerez Tercihlerini Güncelle" seçeneğiyle istediğiniz zaman değiştirebilirsiniz.</li>
            <li><strong className="text-white">Tarayıcı Ayarları:</strong> Tarayıcınızın ayarlarından çerezleri silebilir veya engelleyebilirsiniz. Zorunlu çerezlerin engellenmesi platformun çalışmasını olumsuz etkiler.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">5. "Do Not Track" Sinyalleri</h2>
          <p className="text-sm">
            Tarayıcınız "Do Not Track" sinyali gönderse dahi zorunlu çerezler teknik açıdan
            gerekli olduğundan çalışmaya devam eder. Analitik ve fonksiyonel çerezler ise
            yalnızca açık rızanız durumunda etkinleştirildiğinden, DNT sinyali analitik
            çerezlerle ilgili ek koruma sağlamaz; bu çerezleri devre dışı bırakmak için
            banner&apos;dan "Sadece Zorunlular" seçeneğini kullanabilirsiniz.
          </p>
        </section>

        <div className="border-t border-[rgba(255,255,255,0.07)] pt-6 text-sm text-[#64748b]">
          <p>Soru ve itirazlarınız için: <Link href="mailto:destek@pilotsensin.com" className="text-[#fbc024] hover:underline">destek@pilotsensin.com</Link></p>
          <p className="mt-1">Son güncelleme: {GUNCELLEME}</p>
        </div>
      </div>
    </div>
  );
}
