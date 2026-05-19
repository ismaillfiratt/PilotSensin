import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Gizlilik Politikası – PilotSensin" };

const GUNCELLEME = "19 Mayıs 2026";

export default function GizlilikPage() {
  return (
    <div className="space-y-6">
      <div className="card rounded-2xl p-6 md:p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Gizlilik Politikası</h1>
        <p className="text-sm text-gray-500">Son güncelleme: {GUNCELLEME}</p>
        <p className="text-sm text-gray-400 mt-3">
          PilotSensin olarak gizliliğinizi ciddiye alıyoruz. Bu politika, hangi bilgileri
          topladığımızı, nasıl kullandığımızı ve nasıl koruduğumuzu açıklamaktadır.
        </p>
      </div>

      <div className="card rounded-2xl p-6 md:p-8 space-y-8 text-gray-400 leading-relaxed">

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-800">1. Hangi Bilgileri Topluyoruz?</h2>
          <h3 className="text-base font-semibold text-[#e2e8f0]">1.1 Hesap Bilgileri</h3>
          <p className="text-sm">Kayıt sırasında ad, soyad ve e-posta adresinizi alıyoruz. Profil sayfasında ek bilgiler (telefon, işletme adı, adres) girebilirsiniz; bu bilgiler isteğe bağlıdır.</p>
          <h3 className="text-base font-semibold text-[#e2e8f0]">1.2 Ödeme Bilgileri</h3>
          <p className="text-sm">Abonelik ödemelerinde kart bilgileriniz doğrudan platformumuzda saklanmaz; ödeme altyapı sağlayıcısı üzerinden işlenir. Sistemimizde yalnızca işlem referans numarası ve abonelik durumuna ait veriler tutulur.</p>
          <h3 className="text-base font-semibold text-[#e2e8f0]">1.3 Kullanım Verileri</h3>
          <p className="text-sm">Platform kullanımınız sırasında IP adresi, tarayıcı türü, cihaz bilgisi, ziyaret edilen sayfalar ve özellik kullanım istatistikleri otomatik olarak toplanır.</p>
          <h3 className="text-base font-semibold text-[#e2e8f0]">1.4 İşletme Verileri</h3>
          <p className="text-sm">Platforma girdiğiniz satış kayıtları, stok bilgileri, nakit akışı, görevler ve diğer işletme verileri tamamen size aittir. Bu veriler yalnızca hizmetin sunulması amacıyla sistemde tutulur, üçüncü taraflarla paylaşılmaz.</p>
          <h3 className="text-base font-semibold text-[#e2e8f0]">1.5 Çerezler</h3>
          <p className="text-sm">Çerezler hakkında detaylı bilgi için <Link href="/politikalar/cerez" className="text-[var(--leaf)] hover:underline">Çerez Politikamızı</Link> inceleyiniz.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-800">2. Bilgilerinizi Nasıl Kullanıyoruz?</h2>
          <ul className="space-y-1.5 text-sm list-disc list-inside">
            <li>Hesabınızı oluşturmak, doğrulamak ve yönetmek</li>
            <li>PilotSensin hizmetini sunmak ve teknik işleyişi sağlamak</li>
            <li>Abonelik ve faturalandırma işlemlerini gerçekleştirmek</li>
            <li>Müşteri desteği sağlamak ve destek taleplerinizi yanıtlamak</li>
            <li>Platform güvenliğini korumak ve yetkisiz erişimleri önlemek</li>
            <li>Hizmet değişiklikleri ve önemli güncellemeler hakkında bilgilendirme yapmak</li>
            <li>Hizmet kalitesini ölçmek ve iyileştirmek</li>
            <li>Yasal yükümlülükleri yerine getirmek</li>
          </ul>
          <p className="text-sm">Verilerinizi reklam amaçlı üçüncü taraflara satmıyoruz.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-800">3. Üçüncü Taraflarla Paylaşım</h2>
          <p className="text-sm">Verileriniz yalnızca hizmetin sunulması için zorunlu olan altyapı sağlayıcılarıyla paylaşılmaktadır:</p>
          <div className="space-y-2 text-sm">
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="text-gray-800 font-semibold mb-1">Supabase Inc. — Veritabanı, Kimlik Doğrulama ve Depolama</p>
              <p>Hesap verileri ve işletme verileriniz Supabase Inc. altyapısında barındırılmaktadır. Supabase sunucuları Singapur konumludur. SOC 2 Type II ve ISO 27001 sertifikalıdır.</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="text-gray-800 font-semibold mb-1">Vercel Inc. — Uygulama Barındırma (Global CDN)</p>
              <p>Uygulama kodumuz Vercel global ağı üzerinden sunulmaktadır.</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="text-gray-800 font-semibold mb-1">Resend Inc. — E-posta Servisi (ABD)</p>
              <p>Hesap doğrulama, destek yanıtları ve sistem bildirimleri için kullanılır.</p>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-800">4. Veri Güvenliği</h2>
          <p className="text-sm">TLS şifreli iletişim, AES-256 veritabanı şifrelemesi, Row Level Security ile yalıtım, güvenli parola hashleme ve düzenli güvenlik güncellemeleri uygulanmaktadır.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-800">5. Veri Saklama</h2>
          <p className="text-sm">Hesabınızı sildiğinizde kişisel verileriniz 30 gün içinde kalıcı olarak silinir. Mali kayıtlar Vergi Usul Kanunu uyarınca 10 yıl saklanmak zorundadır.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-800">6. Çocukların Gizliliği</h2>
          <p className="text-sm">PilotSensin yalnızca 18 yaş ve üzerindeki kişilere yönelik bir platformdur. 18 yaşın altındaki kişilere ait verileri öğrendiğimizde derhal sileriz.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-800">7. Politika Değişiklikleri</h2>
          <p className="text-sm">Önemli değişiklikler olduğunda kayıtlı e-posta adresinize bildirim göndeririz ve sayfanın güncelleme tarihini değiştiririz.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-800">8. Haklarınız</h2>
          <p className="text-sm">KVKK kapsamındaki tüm haklarınız için <Link href="/politikalar/kvkk" className="text-[var(--leaf)] hover:underline">KVKK Aydınlatma Metni</Link>ni inceleyiniz.</p>
        </section>

        <div className="border-t border-gray-200 pt-6 text-sm text-gray-500">
          <p>Soru ve itirazlarınız için: <Link href="mailto:destek@pilotsensin.com" className="text-[var(--leaf)] hover:underline">destek@pilotsensin.com</Link></p>
          <p className="mt-1">Son güncelleme: {GUNCELLEME}</p>
        </div>
      </div>
    </div>
  );
}
