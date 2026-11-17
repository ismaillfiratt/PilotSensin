import Link from "next/link";

const GUNCELLEME = "19 Mayıs 2026";

export default function CerezBelge() {
  return (
    <div className="space-y-6">
      <div className="card rounded-2xl p-6 md:p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Çerez Politikası</h1>
        <p className="text-sm text-gray-500">Son güncelleme: {GUNCELLEME}</p>
        <p className="text-sm text-gray-400 mt-3">Bu politika, PilotSensin&apos;in çerezleri nasıl kullandığını, çerez türlerini ve tercihlerinizi nasıl yönetebileceğinizi açıklamaktadır.</p>
      </div>
      <div className="card rounded-2xl p-6 md:p-8 space-y-8 text-gray-400 leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-800">1. Çerez Nedir?</h2>
          <p className="text-sm">Çerezler (cookies), bir web sitesini ziyaret ettiğinizde tarayıcınız tarafından cihazınıza kaydedilen küçük metin dosyalarıdır. Oturumunuzun açık kalmasını sağlamak, tercihlerinizi hatırlamak ve platformun düzgün çalışması için gereklidir.</p>
        </section>
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-800">2. Çerez Kategorileri</h2>
          <div className="space-y-4">
            <div className="border border-[rgba(34,197,94,0.3)] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-[rgba(34,197,94,0.15)] text-[#22c55e]">ZORUNLU</span>
                <span className="text-sm font-semibold text-gray-800">Engellenemez</span>
              </div>
              <p className="text-sm mb-3">Platformun temel işlevleri için zorunludur. Bu çerezler devre dışı bırakılamaz.</p>
              <div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr className="border-b border-gray-200"><th className="text-left py-2 pr-3 text-gray-500">Ad</th><th className="text-left py-2 pr-3 text-gray-500">Amaç</th><th className="text-left py-2 pr-3 text-gray-500">Süre</th><th className="text-left py-2 text-gray-500">Sağlayıcı</th></tr></thead>
              <tbody className="divide-y divide-gray-100">
                <tr><td className="py-2 pr-3 font-mono text-gray-400">sb-auth-token</td><td className="py-2 pr-3">Supabase kimlik doğrulama oturumu</td><td className="py-2 pr-3">Oturum</td><td className="py-2">Supabase (1. taraf)</td></tr>
                <tr><td className="py-2 pr-3 font-mono text-gray-400">sb-refresh-token</td><td className="py-2 pr-3">Oturum yenileme tokeni</td><td className="py-2 pr-3">7 gün</td><td className="py-2">Supabase (1. taraf)</td></tr>
              </tbody></table></div>
            </div>
            <div className="border border-[rgba(59,130,246,0.3)] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-[rgba(59,130,246,0.15)] text-[#3b82f6]">FONKSİYONEL</span>
                <span className="text-sm font-semibold text-gray-800">Açık Rıza Gerektirir</span>
              </div>
              <p className="text-sm">Tema tercihi, dil ayarı ve benzeri kişiselleştirme verilerini hatırlamak için kullanılır.</p>
            </div>
            <div className="border border-[rgba(148,163,184,0.2)] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-[rgba(148,163,184,0.12)] text-gray-400">PAZARLAMA</span>
                <span className="text-sm font-semibold text-gray-800">Şu An Kullanılmıyor</span>
              </div>
              <p className="text-sm">Pazarlama amaçlı çerezler şu an kullanılmamaktadır.</p>
            </div>
          </div>
        </section>
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-800">3. Çerez Tercihlerinizi Yönetme</h2>
          <ul className="space-y-1.5 text-sm list-disc list-inside">
            <li><strong className="text-gray-800">Çerez Banner&apos;ı:</strong> İlk ziyarette gösterilen banner üzerinden tercihlerinizi seçebilirsiniz.</li>
            <li><strong className="text-gray-800">Ayarlar Sayfası:</strong> Ayarlar &gt; Yasal Bilgiler bölümünden &quot;Çerez Tercihlerini Güncelle&quot; seçeneğiyle değiştirebilirsiniz.</li>
            <li><strong className="text-gray-800">Tarayıcı Ayarları:</strong> Tarayıcınızın ayarlarından çerezleri silebilir veya engelleyebilirsiniz.</li>
          </ul>
        </section>
        <div className="border-t border-gray-200 pt-6 text-sm text-gray-500">
          <p>Soru ve itirazlarınız için: <Link href="mailto:destek@pilotsensin.com" className="text-[var(--leaf)] hover:underline">destek@pilotsensin.com</Link></p>
          <p className="mt-1">Son güncelleme: {GUNCELLEME}</p>
        </div>
      </div>
    </div>
  );
}
