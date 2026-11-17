import Link from "next/link";

const GUNCELLEME = "19 Mayıs 2026";

export default function IadeIptalBelge() {
  return (
    <div className="space-y-6">
      <div className="card rounded-2xl p-6 md:p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">İade &amp; İptal Politikası</h1>
        <p className="text-sm text-gray-500">Son güncelleme: {GUNCELLEME}</p>
        <p className="text-sm text-gray-400 mt-3">PilotSensin aboneliğinizi iptal etme ve olası iade işlemlerine ilişkin tüm bilgiler bu sayfada yer almaktadır.</p>
      </div>
      <div className="card rounded-2xl p-6 md:p-8 space-y-8 text-gray-400 leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-800">1. Deneme Süresi</h2>
          <p className="text-sm">Yeni kullanıcılara 7 günlük ücretsiz deneme süresi tanınır. Deneme süresi boyunca herhangi bir ücret tahsil edilmez ve kredi kartı bilgisi istenmez.</p>
        </section>
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-800">2. Abonelik İptali</h2>
          <p className="text-sm">Aboneliğinizi istediğiniz zaman Ayarlar &gt; Abonelik bölümünden iptal edebilirsiniz. İptal işlemi, mevcut ödeme döneminin sonunda geçerli olur.</p>
        </section>
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-800">3. Yıllık Planda İptal</h2>
          <p className="text-sm">Yıllık aboneliği iptal ettiğinizde mevcut yıllık dönemin sonuna kadar platforma erişiminiz devam eder. Yıllık aboneliklerde kalan süre için prorata iade yapılmamaktadır.</p>
        </section>
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-800">4. Cayma Hakkı</h2>
          <div className="bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] rounded-xl p-4 text-sm">
            <p className="text-gray-800 font-semibold mb-2">Dijital hizmet istisnası uygulanır.</p>
            <p>Mesafeli Sözleşmeler Yönetmeliği madde 15/1-h kapsamında; ödeme öncesinde kullanıcının açıkça onayladığı dijital içerik ve hizmetlerde cayma hakkı kullanılamaz.</p>
          </div>
        </section>
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-800">5. İstisnai İade Durumları</h2>
          <p className="text-sm">Aşağıdaki durumlarda iade değerlendirilebilir:</p>
          <ul className="space-y-1.5 text-sm list-disc list-inside">
            <li>PilotSensin kaynaklı teknik hata nedeniyle hizmete hiç erişilememesi</li>
            <li>Çift tahsilat yapılması</li>
            <li>Abonelik iptaline rağmen yenileme ücretinin hatalı olarak tahsil edilmesi</li>
          </ul>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm mt-2">
            <p className="text-gray-800 font-semibold">İade Prosedürü</p>
            <p>1. destek@pilotsensin.com adresine &quot;İade Talebi&quot; başlığıyla yazın.</p>
            <p>2. Talebiniz 7 iş günü içinde incelenir.</p>
            <p>3. Onaylanan iadeler 14 iş günü içinde iade edilir.</p>
          </div>
        </section>
        <div className="border-t border-gray-200 pt-6 text-sm text-gray-500">
          <p>İlgili belgeler: <Link href="/politikalar/mesafeli-satis" className="text-[var(--leaf)] hover:underline mr-3">Mesafeli Satış Sözleşmesi</Link><Link href="/politikalar/on-bilgilendirme" className="text-[var(--leaf)] hover:underline">Ön Bilgilendirme</Link></p>
          <p className="mt-2">Soru ve itirazlarınız için: <Link href="mailto:destek@pilotsensin.com" className="text-[var(--leaf)] hover:underline">destek@pilotsensin.com</Link></p>
          <p className="mt-1">Son güncelleme: {GUNCELLEME}</p>
        </div>
      </div>
    </div>
  );
}
