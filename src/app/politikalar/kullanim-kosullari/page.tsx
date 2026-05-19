import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Kullanım Koşulları – PilotSensin" };

const GUNCELLEME = "19 Mayıs 2026";

export default function KullanimKosullariPage() {
  return (
    <div className="space-y-6">
      <div className="card rounded-2xl p-6 md:p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Kullanım Koşulları</h1>
        <p className="text-sm text-gray-500">Son güncelleme: {GUNCELLEME}</p>
        <p className="text-sm text-gray-400 mt-3">
          PilotSensin platformunu kullanmadan önce aşağıdaki koşulları lütfen dikkatlice okuyunuz.
          Platforma erişim veya kayıt ile bu koşulları kabul etmiş sayılırsınız.
        </p>
      </div>

      <div className="card rounded-2xl p-6 md:p-8 space-y-8 text-gray-400 leading-relaxed">

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-800">1. Hizmet Tanımı</h2>
          <p className="text-sm">
            PilotSensin, küçük ve orta ölçekli işletmelere yönelik bulut tabanlı bir işletme
            yönetim platformudur (SaaS). Platform; stok yönetimi, nakit akışı takibi, satış
            kaydı, görev yönetimi, prosedür ve kontrol listesi, acil durum fonu, kar-zarar
            analizi ve KDV yönetimi modüllerini kapsamaktadır.
          </p>
          <p className="text-sm">
            PilotSensin bir muhasebe yazılımı veya mali danışmanlık hizmeti değildir. Platform
            üzerindeki veriler bilgilendirme amaçlıdır; resmi muhasebe kaydı olarak kullanılmaz.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-800">2. Üyelik Şartları</h2>
          <ul className="space-y-1.5 text-sm list-disc list-inside">
            <li>18 yaşından büyük olmak zorunludur.</li>
            <li>Kayıt bilgilerinin doğru, güncel ve eksiksiz olması gerekir.</li>
            <li>Her kişi yalnızca bir hesap oluşturabilir.</li>
            <li>Hesap bilgilerinin gizli tutulması kullanıcının sorumluluğundadır.</li>
            <li>Başkası adına kayıt yapılırken o kişinin açık yetkisi gerekmektedir.</li>
            <li>Tüzel kişi adına kayıt yapan kişi şirketi temsil yetkisine sahip olmalıdır.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-800">3. Ücretlendirme</h2>
          <div className="space-y-3 text-sm">
            <div className="bg-[var(--mint)] border border-[var(--forest-100, #D9F2E4)] rounded-xl p-4">
              <p className="text-gray-800 font-semibold mb-2">Abonelik Planları</p>
              <div className="space-y-1.5">
                <div className="flex justify-between"><span>Aylık Plan</span><span className="text-[var(--leaf)] font-bold">499 TL / ay (KDV dahil)</span></div>
                <div className="flex justify-between"><span>Yıllık Plan</span><span className="text-[var(--leaf)] font-bold">4.790 TL / yıl (KDV dahil, aylık plana göre %20 indirimli)</span></div>
              </div>
            </div>
            <p>Fiyatlar Türk Lirası cinsindendir ve KDV dahildir. PilotSensin fiyatları önceden bildirmek kaydıyla değiştirme hakkını saklı tutar.</p>
            <p>Abonelikler otomatik olarak yenilenir. Yenilemeyi dönem bitmeden önce Ayarlar bölümünden durdurabilirsiniz.</p>
            <p>Yeni abonelere 7 günlük ücretsiz deneme süresi tanınır; deneme süresi boyunca kredi kartı bilgisi istenmez. Deneme süresi dolduğunda abonelik satın alınmazsa erişim otomatik olarak sonlandırılır.</p>
            <p>Ödeme yöntemi: [HENÜZ_KARAR_VERİLMEDİ — ödeme entegrasyonu tamamlandığında güncellenecektir]</p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-800">4. Kullanıcı Yükümlülükleri</h2>
          <ul className="space-y-1.5 text-sm list-disc list-inside">
            <li>Platformu yalnızca yasal amaçlar doğrultusunda kullanmak</li>
            <li>Diğer kullanıcıların veya üçüncü kişilerin haklarını ihlal etmemek</li>
            <li>Gerçeğe aykırı, yanıltıcı veya hatalı bilgi girmemek</li>
            <li>Hesap güvenliğini sağlamak ve şifreyi kimseyle paylaşmamak</li>
            <li>Şüpheli erişim durumunda derhal destek@pilotsensin.com ile iletişime geçmek</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-800">5. Yasak Kullanımlar</h2>
          <p className="text-sm">Aşağıdaki eylemler kesinlikle yasaktır:</p>
          <ul className="space-y-1.5 text-sm list-disc list-inside">
            <li>Platforma izinsiz erişim, güvenlik açıklarını test etme veya sömürme</li>
            <li>Başkasının hesabına izinsiz giriş yapmak veya buna teşebbüs etmek</li>
            <li>Spam, kötü amaçlı yazılım veya virüs yaymak</li>
            <li>Platform altyapısına zarar verebilecek otomatik sorgular göndermek (DoS/DDoS)</li>
            <li>Fikri mülkiyet haklarını ihlal eden içerik yüklemek veya paylaşmak</li>
            <li>Platformu yasadışı faaliyetler için kullanmak</li>
            <li>PilotSensin'in yazılı izni olmaksızın platformun herhangi bir bölümünü kopyalamak, çoğaltmak veya yeniden dağıtmak</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-800">6. Fikri Mülkiyet</h2>
          <p className="text-sm">
            Platform yazılımı, tasarımı, logoları ve tüm içerikler PilotSensin'e aittir ve fikri
            mülkiyet mevzuatı ile korunmaktadır. Kullanıcılara yalnızca bu koşullar çerçevesinde
            sınırlı, devredilemez ve münhasır olmayan kullanım lisansı tanınmaktadır.
          </p>
          <p className="text-sm">
            Kullanıcıların platforma girdiği veriler (işletme verileri, belgeler vb.) tamamen
            kullanıcıya aittir. PilotSensin bu verileri hizmet sunumu dışında kullanmaz.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-800">7. Sorumluluk Reddi ve Sınırlamaları</h2>
          <p className="text-sm">
            PilotSensin, aşağıdaki durumlardan doğan zararlardan sorumlu tutulamaz:
          </p>
          <ul className="space-y-1.5 text-sm list-disc list-inside">
            <li>Kullanıcı hatası veya ihmali nedeniyle oluşan veri kaybı</li>
            <li>İnternet bağlantısı kesintileri veya altyapı sağlayıcılarından kaynaklanan hizmet kesintileri</li>
            <li>Üçüncü taraf hizmet sağlayıcılarının (Supabase, Vercel vb.) kaynaklı hatalar</li>
            <li>Kullanıcının platforma girdiği verilerdeki yanlışlıklar</li>
            <li>Mücbir sebep halleri (doğal afet, savaş, siber saldırı vb.)</li>
          </ul>
          <p className="text-sm">
            PilotSensin'in herhangi bir nedenle sorumlu tutulabileceği azami tazminat miktarı,
            ilgili dönemde kullanıcının ödediği aylık abonelik ücretiyle sınırlıdır.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-800">8. Hizmet Değişikliği ve Kesintisi</h2>
          <p className="text-sm">
            PilotSensin, planlı bakım çalışmalarını önceden duyurmak kaydıyla hizmeti geçici
            olarak durdurabilir, özellikleri değiştirebilir veya kaldırabilir. Önemli değişiklikler
            için kullanıcılara en az 30 gün önceden e-posta ile bildirim yapılır.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-800">9. Fesih</h2>
          <p className="text-sm">
            Kullanıcı, hesabını istediği zaman Ayarlar bölümünden silebilir. Aboneliği varsa
            dönem sonuna kadar erişim devam eder.
          </p>
          <p className="text-sm">
            PilotSensin; kullanıcının bu koşulları ihlal etmesi, kötüye kullanım tespiti veya
            yasal zorunluluk halinde hesabı önceden bildirimde bulunmaksızın askıya alabilir
            veya silebilir.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-800">10. Mücbir Sebep</h2>
          <p className="text-sm">
            Deprem, sel, yangın, salgın hastalık, terör saldırısı, büyük çaplı siber saldırı,
            hükümet kararları veya her iki tarafın da kontrolü dışındaki diğer olaylar nedeniyle
            yükümlülüklerin yerine getirilmemesi halinde taraflar birbirinden tazminat talep edemez.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-800">11. Uygulanacak Hukuk ve Yetkili Mahkeme</h2>
          <p className="text-sm">
            Bu sözleşme Türk Hukuku'na tabidir. Taraflar arasındaki anlaşmazlıklarda öncelikle
            arabuluculuk yoluna başvurulacaktır. Arabuluculuk sürecinin sonuçsuz kalması
            durumunda yetkili mahkeme ve icra dairesi Antalya Merkez Mahkemeleri ve İcra
            Daireleri olacaktır.
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
