import Link from "next/link";

const GUNCELLEME = "19 Mayıs 2026";

export default function KullanimKosullariBelge() {
  return (
    <div className="space-y-6">
      <div className="card rounded-2xl p-6 md:p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Kullanım Koşulları</h1>
        <p className="text-sm text-gray-500">Son güncelleme: {GUNCELLEME}</p>
        <p className="text-sm text-gray-400 mt-3">PilotSensin platformunu kullanmadan önce aşağıdaki koşulları lütfen dikkatlice okuyunuz. Platforma erişim veya kayıt ile bu koşulları kabul etmiş sayılırsınız.</p>
      </div>
      <div className="card rounded-2xl p-6 md:p-8 space-y-8 text-gray-400 leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-800">1. Hizmet Tanımı</h2>
          <p className="text-sm">PilotSensin, küçük ve orta ölçekli işletmelere yönelik bulut tabanlı bir işletme yönetim platformudur (SaaS). Platform; stok yönetimi, nakit akışı takibi, satış kaydı, görev yönetimi, prosedür ve kontrol listesi, acil durum fonu, kar-zarar analizi ve KDV yönetimi modüllerini kapsamaktadır.</p>
          <p className="text-sm">PilotSensin bir muhasebe yazılımı veya mali danışmanlık hizmeti değildir.</p>
        </section>
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-800">2. Üyelik Şartları</h2>
          <ul className="space-y-1.5 text-sm list-disc list-inside">
            <li>18 yaşından büyük olmak zorunludur.</li>
            <li>Kayıt bilgilerinin doğru, güncel ve eksiksiz olması gerekir.</li>
            <li>Her kişi yalnızca bir hesap oluşturabilir.</li>
            <li>Hesap bilgilerinin gizli tutulması kullanıcının sorumluluğundadır.</li>
          </ul>
        </section>
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-800">3. Ücretlendirme</h2>
          <div className="space-y-3 text-sm">
            <div className="bg-[var(--mint)] border border-[var(--forest-100,#D9F2E4)] rounded-xl p-4">
              <p className="text-gray-800 font-semibold mb-2">Abonelik Planları</p>
              <div className="space-y-1.5">
                <div className="flex justify-between"><span>Aylık Plan</span><span className="text-[var(--leaf)] font-bold">499 TL / ay (KDV dahil)</span></div>
                <div className="flex justify-between"><span>Yıllık Plan</span><span className="text-[var(--leaf)] font-bold">4.790 TL / yıl (KDV dahil, %20 indirimli)</span></div>
              </div>
            </div>
            <p>Abonelikler otomatik olarak yenilenir. Yeni abonelere 7 günlük ücretsiz deneme süresi tanınır.</p>
          </div>
        </section>
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-800">4. Kullanıcı Yükümlülükleri</h2>
          <ul className="space-y-1.5 text-sm list-disc list-inside">
            <li>Platformu yalnızca yasal amaçlar doğrultusunda kullanmak</li>
            <li>Diğer kullanıcıların veya üçüncü kişilerin haklarını ihlal etmemek</li>
            <li>Gerçeğe aykırı, yanıltıcı veya hatalı bilgi girmemek</li>
            <li>Hesap güvenliğini sağlamak ve şifreyi kimseyle paylaşmamak</li>
          </ul>
        </section>
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-800">5. Yasak Kullanımlar</h2>
          <ul className="space-y-1.5 text-sm list-disc list-inside">
            <li>Platforma izinsiz erişim, güvenlik açıklarını test etme veya sömürme</li>
            <li>Başkasının hesabına izinsiz giriş yapmak veya buna teşebbüs etmek</li>
            <li>Spam, kötü amaçlı yazılım veya virüs yaymak</li>
            <li>Platform altyapısına zarar verebilecek otomatik sorgular göndermek</li>
          </ul>
        </section>
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-800">6. Fikri Mülkiyet</h2>
          <p className="text-sm">Platform yazılımı, tasarımı, logoları ve tüm içerikler PilotSensin&apos;e aittir. Kullanıcıların platforma girdiği veriler tamamen kullanıcıya aittir.</p>
        </section>
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-800">7. Sorumluluk Reddi</h2>
          <ul className="space-y-1.5 text-sm list-disc list-inside">
            <li>Kullanıcı hatası veya ihmali nedeniyle oluşan veri kaybı</li>
            <li>İnternet bağlantısı kesintileri veya altyapı sağlayıcılarından kaynaklanan hizmet kesintileri</li>
            <li>Mücbir sebep halleri (doğal afet, savaş, siber saldırı vb.)</li>
          </ul>
        </section>
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-800">8. Uygulanacak Hukuk</h2>
          <p className="text-sm">Bu sözleşme Türk Hukuku&apos;na tabidir. Yetkili mahkeme ve icra dairesi Antalya Merkez Mahkemeleri ve İcra Daireleri olacaktır.</p>
        </section>
        <div className="border-t border-gray-200 pt-6 text-sm text-gray-500">
          <p>Soru ve itirazlarınız için: <Link href="mailto:destek@pilotsensin.com" className="text-[var(--leaf)] hover:underline">destek@pilotsensin.com</Link></p>
          <p className="mt-1">Son güncelleme: {GUNCELLEME}</p>
        </div>
      </div>
    </div>
  );
}
