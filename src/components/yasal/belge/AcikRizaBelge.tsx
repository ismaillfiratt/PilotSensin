import Link from "next/link";

const GUNCELLEME = "19 Mayıs 2026";

export default function AcikRizaBelge() {
  return (
    <div className="space-y-6">
      <div className="card rounded-2xl p-6 md:p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Kişisel Verilerin Yurt Dışına Aktarımına İlişkin Açık Rıza Metni</h1>
        <p className="text-sm text-gray-500">Son güncelleme: {GUNCELLEME}</p>
        <p className="text-sm text-gray-400 mt-3">İşbu metin, KVKK madde 9 kapsamında kişisel verilerinizin yurt dışına aktarımına ilişkin açık rızanıza dair bilgilendirme niteliğindedir.</p>
      </div>
      <div className="card rounded-2xl p-6 md:p-8 space-y-8 text-gray-400 leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-800">1. Aktarımın Kapsamı</h2>
          <p className="text-sm">PilotSensin platformunun teknik altyapısı, Supabase Inc. tarafından sağlanmaktadır. Bu kapsamda kişisel verileriniz, Supabase Inc.&apos;in sunucularının bulunduğu Singapur&apos;da işlenebilmektedir.</p>
        </section>
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-800">2. Aktarılan Veri Kategorileri</h2>
          <ul className="space-y-1.5 text-sm list-disc list-inside">
            <li>Kimlik bilgileri (ad, soyad, e-posta adresi)</li>
            <li>İletişim bilgileri</li>
            <li>Hesap ve kullanım bilgileri</li>
            <li>Hizmet kullanım verileri (işletme verileri, satış kayıtları vb.)</li>
          </ul>
        </section>
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-800">3. Güvenceler</h2>
          <p className="text-sm">Supabase Inc. SOC 2 Type II ve ISO 27001 sertifikalarına sahiptir. Verileriniz TLS 1.2+ ile şifrelenerek aktarılır ve Row Level Security ile kullanıcı bazında yalıtılır.</p>
        </section>
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-800">4. Açık Rızanızı Geri Çekme</h2>
          <ul className="space-y-1.5 text-sm list-disc list-inside">
            <li>destek@pilotsensin.com adresine &quot;Açık Rıza Geri Çekme Talebi&quot; başlıklı e-posta</li>
            <li>Platform içi Ayarlar &gt; Tehlike &gt; Açık Rızayı Geri Çek yolu</li>
          </ul>
          <p className="text-sm">Açık rızanızı geri çekmeniz durumunda hesabınız kapatılacak ve verileriniz silinecektir.</p>
        </section>
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-800">5. Rıza Kaydı</h2>
          <p className="text-sm">Kayıt formundaki onay kutucuğunu işaretleyerek bu metnin tamamını okuduğunuzu ve serbest iradenizle açık rızanızı verdiğinizi kabul etmiş sayılırsınız.</p>
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
