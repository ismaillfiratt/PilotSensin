import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Açık Rıza Metni – PilotSensin" };

const GUNCELLEME = "19 Mayıs 2026";

export default function AcikRizaPage() {
  return (
    <div className="space-y-6">
      <div className="card rounded-2xl p-6 md:p-8">
        <h1 className="text-2xl font-bold text-white mb-1">
          Kişisel Verilerin Yurt Dışına Aktarımına İlişkin Açık Rıza Metni
        </h1>
        <p className="text-sm text-gray-500">Son güncelleme: {GUNCELLEME}</p>
        <p className="text-sm text-gray-400 mt-3">
          İşbu metin, 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) madde 9 kapsamında
          kişisel verilerinizin yurt dışına aktarımına ilişkin açık rızanıza dair bilgilendirme
          niteliğindedir.
        </p>
      </div>

      <div className="card rounded-2xl p-6 md:p-8 space-y-8 text-gray-400 leading-relaxed">

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">1. Aktarımın Kapsamı</h2>
          <p className="text-sm">
            PilotSensin platformunun teknik altyapısı, dünyaca tanınan bulut hizmet sağlayıcısı
            Supabase Inc. tarafından sağlanmaktadır. Bu kapsamda kişisel verileriniz, Supabase
            Inc.&apos;in sunucularının bulunduğu Singapur&apos;da işlenebilmektedir.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">2. Aktarılan Veri Kategorileri</h2>
          <ul className="space-y-1.5 text-sm list-disc list-inside">
            <li>Kimlik bilgileri (ad, soyad, e-posta adresi)</li>
            <li>İletişim bilgileri</li>
            <li>Hesap ve kullanım bilgileri (oturum logu, uygulama tercihleri)</li>
            <li>Hizmet kullanım verileri (işletme verileri, satış kayıtları, stok bilgileri, nakit akışı ve benzeri platform içi kayıtlar)</li>
            <li>Ödeme bilgileri (kart numarası, CVV gibi hassas kart verisi saklanmamakta olup yalnızca işlem referans numarası ve abonelik durumu aktarılmaktadır)</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">3. Aktarımın Hukuki Sebebi</h2>
          <p className="text-sm">
            Söz konusu aktarım, KVKK madde 9 hükmü gereği açık rızanız temelinde
            gerçekleştirilmektedir. Hizmetin teknik yapısı gereği bu aktarım olmaksızın
            platform hizmetlerinden yararlanılması mümkün değildir.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">4. Aktarımın Amacı</h2>
          <ul className="space-y-1.5 text-sm list-disc list-inside">
            <li>PilotSensin hizmet altyapısının sağlanması ve sürdürülmesi</li>
            <li>Yüksek erişilebilirlik, veri yedekleme ve felaket kurtarma</li>
            <li>Sürekli güvenlik güncellemeleri ve teknik destek hizmetleri</li>
            <li>Veri bütünlüğünün ve tutarlılığının korunması</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">5. Güvenceler</h2>
          <p className="text-sm">
            Supabase Inc. SOC 2 Type II ve ISO 27001 sertifikalarına sahiptir. Verileriniz
            Transport Layer Security (TLS 1.2+) ile şifrelenerek aktarılır ve Row Level
            Security (RLS) ile veritabanı seviyesinde kullanıcı bazında yalıtılır. Supabase,
            AB Genel Veri Koruma Tüzüğü (GDPR) ile de uyumlu veri işleme uygulamalarını
            benimsemektedir.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">6. Açık Rızanızı Geri Çekme</h2>
          <p className="text-sm">
            Açık rızanızı her zaman geri çekebilirsiniz. Geri çekme yolları:
          </p>
          <ul className="space-y-1.5 text-sm list-disc list-inside">
            <li>destek@pilotsensin.com adresine &quot;Açık Rıza Geri Çekme Talebi&quot; başlıklı e-posta</li>
            <li>Platform içi Ayarlar &gt; Tehlike Zonu &gt; Açık Rızayı Geri Çek ve Hesabı Sil yolu</li>
          </ul>
          <p className="text-sm">
            Açık rızanızı geri çekmeniz durumunda PilotSensin hizmetinden yararlanmanız teknik
            açıdan mümkün olmayacağından hesabınız kapatılacak ve verileriniz Veri Saklama ve
            İmha Politikamız çerçevesinde silinecektir. Mali kayıtlar yasal saklama süreleri
            boyunca Vergi Usul Kanunu kapsamında saklanmaya devam edecektir.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">7. KVKK Kapsamındaki Haklarınız</h2>
          <p className="text-sm">
            KVKK madde 11 kapsamındaki tüm haklarınızı kullanabilirsiniz: bilgi alma, düzeltme
            talep etme, silme talep etme, aktarılan üçüncü kişilere bildirim isteme, itiraz
            etme ve tazminat talep etme hakları. Başvuru için{" "}
            <Link href="/politikalar/kvkk" className="text-[var(--leaf)] hover:underline">KVKK Aydınlatma Metni</Link>ni inceleyiniz.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">8. Rıza Kaydı</h2>
          <p className="text-sm">
            Kayıt formundaki onay kutucuğunu işaretleyerek ve &quot;Hesap Oluştur&quot; butonuna
            tıklayarak bu metnin tamamını okuduğunuzu, anladığınızı ve serbest iradenizle
            açık rızanızı verdiğinizi kabul etmiş sayılırsınız. Bu onaya ilişkin kayıt,
            tarih, IP adresi ve tarayıcı bilgisiyle birlikte sistemimizde saklanmaktadır.
          </p>
        </section>

        <div className="border-t border-gray-200 pt-6 text-sm text-gray-500">
          <p>İlgili belgeler: <Link href="/politikalar/kvkk" className="text-[var(--leaf)] hover:underline mr-3">KVKK Aydınlatma Metni</Link><Link href="/politikalar/gizlilik" className="text-[var(--leaf)] hover:underline">Gizlilik Politikası</Link></p>
          <p className="mt-2">Soru ve itirazlarınız için: <Link href="mailto:destek@pilotsensin.com" className="text-[var(--leaf)] hover:underline">destek@pilotsensin.com</Link></p>
          <p className="mt-1">Son güncelleme: {GUNCELLEME}</p>
        </div>
      </div>
    </div>
  );
}
