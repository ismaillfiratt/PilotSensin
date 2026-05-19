import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "KVKK Aydınlatma Metni – PilotSensin" };

const GUNCELLEME = "19 Mayıs 2026";

export default function KVKKPage() {
  return (
    <div className="space-y-6">
      <div className="card rounded-2xl p-6 md:p-8">
        <h1 className="text-2xl font-bold text-white mb-1">KVKK Aydınlatma Metni</h1>
        <p className="text-sm text-gray-500">Son güncelleme: {GUNCELLEME}</p>
        <p className="text-sm text-gray-400 mt-3">
          6698 sayılı Kişisel Verilerin Korunması Kanunu&apos;nun 10. maddesi uyarınca, kişisel verilerinizin
          işlenmesine ilişkin aşağıda yer alan bilgileri dikkatinize sunarız.
        </p>
      </div>

      <div className="card rounded-2xl p-6 md:p-8 space-y-8 text-gray-400 leading-relaxed">

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">1. Veri Sorumlusunun Kimliği</h2>
          <p>
            Kişisel verileriniz; aşağıda kimlik ve iletişim bilgileri yer alan veri sorumlusu
            tarafından 6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında işlenmektedir.
          </p>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-1.5 text-sm">
            <div className="flex gap-3"><span className="text-gray-500 min-w-32">Unvan</span><span className="text-white">İsmail Fırat (Şahıs Şirketi)</span></div>
            <div className="flex gap-3"><span className="text-gray-500 min-w-32">Adres</span><span className="text-white">Güveren Mah. 3746. Sk. No:13 Kepez / Antalya</span></div>
            <div className="flex gap-3"><span className="text-gray-500 min-w-32">E-posta</span><span className="text-[var(--leaf)]">destek@pilotsensin.com</span></div>
            <div className="flex gap-3"><span className="text-gray-500 min-w-32">Web</span><span className="text-white">https://pilotsensin.com</span></div>
            <div className="flex gap-3"><span className="text-gray-500 min-w-32">Vergi No</span><span className="text-white">[SONRADAN_EKLENECEK]</span></div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">2. İşlenen Kişisel Veri Kategorileri</h2>
          <p>Platformumuz aracılığıyla aşağıdaki kategorilerdeki kişisel veriler işlenmektedir:</p>
          <ul className="space-y-2 list-none">
            {[
              ["Kimlik Verileri", "Ad, soyad, kullanıcı adı"],
              ["İletişim Verileri", "E-posta adresi, iş adresi (kullanıcı girsede), telefon numarası (kullanıcı girsede)"],
              ["Hesap Verileri", "Şifrelenmiş parola, hesap oluşturma tarihi, son giriş tarihi, profil bilgileri"],
              ["Finansal Veriler", "Abonelik planı, fatura bilgileri, ödeme işlem referansları (kart numarası saklanmaz)"],
              ["İşletme Verileri", "Kullanıcının platforma girdiği satış, stok, nakit, görev ve diğer işletme kayıtları"],
              ["Kullanım Verileri", "Platform içi işlemler, sayfa ziyaretleri, özellik kullanım istatistikleri, hata logları"],
              ["Teknik Veriler", "IP adresi, tarayıcı türü ve sürümü, cihaz bilgisi, oturum tokenları"],
              ["Çerez Verileri", "Oturum çerezleri, tercih çerezleri, analitik çerezler (rıza alındığında)"],
            ].map(([kategori, aciklama]) => (
              <li key={kategori} className="flex gap-3 bg-gray-50 rounded-lg px-4 py-2.5 text-sm">
                <span className="text-[var(--leaf)] font-semibold min-w-40 shrink-0">{kategori}</span>
                <span>{aciklama}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">3. Kişisel Verilerin İşlenme Amaçları</h2>
          <p>Kişisel verileriniz aşağıdaki amaçlarla işlenmektedir:</p>
          <ol className="space-y-2 list-decimal list-inside text-sm">
            <li>Üyelik hesabının oluşturulması, doğrulanması ve yönetilmesi</li>
            <li>PilotSensin SaaS hizmetinin sağlanması ve teknik işleyişinin temini</li>
            <li>Abonelik planı yönetimi, faturalandırma ve ödeme işlemlerinin gerçekleştirilmesi</li>
            <li>Müşteri desteği ve destek taleplerinin karşılanması</li>
            <li>Platform güvenliğinin sağlanması, yetkisiz erişimlerin önlenmesi</li>
            <li>Hizmet kalitesinin ölçülmesi ve iyileştirilmesi</li>
            <li>Yasal yükümlülüklerin yerine getirilmesi (vergi, muhasebe, hukuki saklama)</li>
            <li>Teknik sorunların tespiti ve giderilmesi (hata logları)</li>
            <li>Kullanıcılara hizmet değişiklikleri ve önemli güncellemeler hakkında bilgilendirme yapılması</li>
            <li>İstatistiksel analiz ve anonim raporlama (kişisel veri içermeyecek şekilde)</li>
          </ol>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">4. Kişisel Verilerin Toplanma Yöntemleri</h2>
          <p>Kişisel verileriniz aşağıdaki yollarla toplanmaktadır:</p>
          <ul className="space-y-1.5 text-sm list-disc list-inside">
            <li>Kayıt formu ve profil güncelleme ekranları aracılığıyla doğrudan</li>
            <li>Platform kullanımı sırasında otomatik olarak (teknik loglar, oturum bilgileri)</li>
            <li>Çerezler ve benzeri teknolojiler aracılığıyla (onay alınan kategoriler kapsamında)</li>
            <li>Ödeme işlemleri sırasında ödeme altyapısı sağlayıcısından</li>
            <li>Destek talebi oluşturulduğunda kullanıcı tarafından iletilen bilgiler</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">5. Hukuki Sebepler</h2>
          <p>Kişisel verileriniz, 6698 sayılı Kanun madde 5/2 ile madde 9 kapsamında aşağıdaki hukuki sebeplere dayalı olarak işlenmektedir:</p>
          <div className="space-y-2 text-sm">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <span className="text-white font-semibold">Sözleşmenin Kurulması veya İfası (md. 5/2-c):</span>
              <span className="ml-2">Hesap oluşturma, abonelik yönetimi, hizmet sunumu</span>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <span className="text-white font-semibold">Hukuki Yükümlülük (md. 5/2-ç):</span>
              <span className="ml-2">Vergi kanunları kapsamında saklama, adli/idari makam talepleri</span>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <span className="text-white font-semibold">Meşru Menfaat (md. 5/2-f):</span>
              <span className="ml-2">Platform güvenliği, dolandırıcılık önleme, hizmet iyileştirme</span>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <span className="text-white font-semibold">Açık Rıza (md. 5/1 ve md. 9):</span>
              <span className="ml-2">Analitik çerezler, pazarlama bildirimleri, yurt dışına veri aktarımı</span>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">6. Kişisel Verilerin Aktarımı</h2>

          <h3 className="text-base font-semibold text-[#e2e8f0]">6.1 Yurt İçi Aktarım</h3>
          <p className="text-sm">
            Kişisel verileriniz yurt içinde yalnızca yasal yükümlülük kapsamında yetkili kamu kurum ve
            kuruluşlarına (vergi dairesi, mahkeme, savcılık vb.) aktarılmaktadır. Ticari amaçla
            herhangi bir üçüncü kişiyle paylaşılmamaktadır.
          </p>

          <h3 className="text-base font-semibold text-[#e2e8f0]">6.2 Yurt Dışı Aktarım</h3>
          <p className="text-sm">
            Hizmet altyapımız Supabase Inc. tarafından sağlanmaktadır. Bu kapsamda kişisel
            verileriniz şirketin sunucularının bulunduğu Singapur&apos;da işlenebilmektedir. Söz konusu
            aktarım KVKK madde 9 uyarınca açık rızanız temelinde gerçekleştirilmektedir. Supabase
            Inc. SOC 2 Type II ve ISO 27001 sertifikalarına sahip olup, verileriniz TLS şifrelemesi
            ile aktarılır ve Row Level Security ile yalıtılır.
          </p>
          <p className="text-sm">
            E-posta altyapısı için Resend Inc. (ABD) kullanılmaktadır; yalnızca e-posta adresi ve
            gönderim içerikleri bu kapsamda işlenmektedir. Hosting hizmeti Vercel Inc. (Global CDN)
            aracılığıyla sunulmakta olup statik varlıklar ve uygulama kodu bu kapsamda dağıtılmaktadır.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">7. Veri Saklama Süreleri</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2.5 pr-4 text-gray-500 font-medium">Veri Kategorisi</th>
                  <th className="text-left py-2.5 pr-4 text-gray-500 font-medium">Saklama Süresi</th>
                  <th className="text-left py-2.5 text-gray-500 font-medium">Dayanak</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[
                  ["Hesap ve profil bilgileri", "Hesap silme + 30 gün", "Kanun md. 7"],
                  ["Mali kayıtlar (fatura, ödeme)", "10 yıl", "VUK md. 253"],
                  ["Teknik loglar (IP, erişim)", "1 yıl", "5651 s. Kanun"],
                  ["İşletme verileri (kullanıcı girdisi)", "Hesap silme + 30 gün", "Kanun md. 7"],
                  ["Destek talepleri", "2 yıl", "Tüketici mevzuatı"],
                  ["Çerez verileri", "Çerez tercihine göre (azami 1 yıl)", "Kanun md. 7"],
                ].map(([kategori, sure, dayanak]) => (
                  <tr key={kategori}>
                    <td className="py-2.5 pr-4 text-gray-400">{kategori}</td>
                    <td className="py-2.5 pr-4 text-white">{sure}</td>
                    <td className="py-2.5 text-gray-500 text-xs">{dayanak}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">8. Veri Güvenliği Önlemleri</h2>
          <p className="text-sm">Kişisel verilerinizin güvenliği için aşağıdaki teknik ve idari tedbirler alınmaktadır:</p>
          <ul className="space-y-1.5 text-sm list-disc list-inside">
            <li>Tüm veri aktarımları Transport Layer Security (TLS 1.2+) ile şifrelenir</li>
            <li>Veritabanı erişimleri Row Level Security (RLS) ile kullanıcı bazında yalıtılır</li>
            <li>Parolalar güçlü hash algoritmaları (bcrypt) ile şifrelenmiş şekilde saklanır</li>
            <li>Supabase altyapısı AES-256 ile veri tabanı düzeyinde şifreleme sağlar</li>
            <li>Yetkisiz erişim girişimleri anlık olarak izlenir ve loglanır</li>
            <li>Veri erişimi "en az ayrıcalık" ilkesine göre yönetilir</li>
            <li>Üçüncü taraf sağlayıcılar SOC 2 Type II ve ISO 27001 sertifikalıdır</li>
            <li>Düzenli güvenlik güncellemeleri ve açık yönetim süreçleri uygulanır</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">9. Veri Sahibinin Hakları (KVKK Madde 11)</h2>
          <p className="text-sm">6698 sayılı Kanun&apos;un 11. maddesi kapsamında aşağıdaki haklara sahipsiniz:</p>
          <ol className="space-y-2 text-sm list-decimal list-inside">
            <li><strong className="text-white">Bilgi Alma:</strong> Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
            <li><strong className="text-white">Açıklama Talep Etme:</strong> İşlenmişse buna ilişkin bilgi talep etme</li>
            <li><strong className="text-white">Amaç Öğrenme:</strong> İşlenme amacını ve amaca uygun kullanılıp kullanılmadığını öğrenme</li>
            <li><strong className="text-white">Aktarım Bilgisi:</strong> Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme</li>
            <li><strong className="text-white">Düzeltme:</strong> Eksik veya yanlış işlenmiş verilerin düzeltilmesini isteme</li>
            <li><strong className="text-white">Silme/Yok Etme:</strong> Kanun&apos;un 7. maddesi kapsamında silinmesini veya yok edilmesini isteme</li>
            <li><strong className="text-white">Düzeltme/Silme Bildirimi:</strong> Yapılan işlemlerin aktarıldığı üçüncü kişilere bildirilmesini isteme</li>
            <li><strong className="text-white">İtiraz:</strong> Otomatik sistemler vasıtasıyla analiz edilmesi durumunda aleyhte sonuca itiraz etme</li>
            <li><strong className="text-white">Tazminat:</strong> Kanuna aykırı işleme nedeniyle zarara uğranılması halinde tazminat talep etme</li>
          </ol>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">10. Başvuru Yöntemi</h2>
          <p className="text-sm">
            Haklarınızı kullanmak için aşağıdaki kanallar aracılığıyla veri sorumlusuna başvurabilirsiniz:
          </p>
          <div className="space-y-2 text-sm">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <span className="text-white font-semibold">E-posta:</span>
              <span className="ml-2">destek@pilotsensin.com — konu satırına &quot;KVKK Başvurusu&quot; yazınız</span>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <span className="text-white font-semibold">Posta:</span>
              <span className="ml-2">Güveren Mah. 3746. Sk. No:13 Kepez / Antalya</span>
            </div>
          </div>
          <p className="text-sm">
            Başvurularınız en geç 30 gün içinde ücretsiz olarak yanıtlanacaktır. Talebin niteliğine
            göre ek süre gerekebilir; bu durumda tarafınıza bildirim yapılır.
          </p>
        </section>

        <div className="border-t border-gray-200 pt-6 text-sm text-gray-500">
          <p>Soru ve itirazlarınız için: <Link href="mailto:destek@pilotsensin.com" className="text-[var(--leaf)] hover:underline">destek@pilotsensin.com</Link></p>
          <p className="mt-1">Son güncelleme: {GUNCELLEME}</p>
        </div>
      </div>
    </div>
  );
}
