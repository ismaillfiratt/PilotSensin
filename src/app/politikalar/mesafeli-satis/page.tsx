import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Mesafeli Satış Sözleşmesi – PilotSensin" };

const GUNCELLEME = "19 Mayıs 2026";

export default function MesafeliSatisPage() {
  return (
    <div className="space-y-6">
      <div className="card rounded-2xl p-6 md:p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Mesafeli Satış Sözleşmesi</h1>
        <p className="text-sm text-gray-500">Son güncelleme: {GUNCELLEME}</p>
        <p className="text-sm text-gray-400 mt-3">
          6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği
          kapsamında hazırlanmıştır. Ödeme öncesinde okunup onaylanması zorunludur.
        </p>
      </div>

      <div className="card rounded-2xl p-6 md:p-8 space-y-8 text-gray-400 leading-relaxed">

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-800">1. Taraflar</h2>
          <div className="space-y-3 text-sm">
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="text-gray-800 font-semibold mb-2">SATICI</p>
              <div className="space-y-1">
                <div className="flex gap-3"><span className="text-gray-500 min-w-24">Unvan</span><span>İsmail Fırat (Şahıs Şirketi)</span></div>
                <div className="flex gap-3"><span className="text-gray-500 min-w-24">Adres</span><span>Güveren Mah. 3746. Sk. No:13 Kepez / Antalya</span></div>
                <div className="flex gap-3"><span className="text-gray-500 min-w-24">E-posta</span><span className="text-[var(--leaf)]">destek@pilotsensin.com</span></div>
                <div className="flex gap-3"><span className="text-gray-500 min-w-24">Vergi No</span><span>[SONRADAN_EKLENECEK]</span></div>
              </div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="text-gray-800 font-semibold mb-1">ALICI (TÜKETİCİ)</p>
              <p>Ödeme işlemi sırasında sisteme kayıtlı ad, soyad ve e-posta adresiyle tanımlanan kullanıcı.</p>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-800">2. Sözleşmenin Konusu</h2>
          <p className="text-sm">
            Bu sözleşme; satıcının elektronik ortamda sunduğu PilotSensin SaaS (yazılım hizmeti
            olarak) aboneliğinin satışına ilişkin koşulları düzenlemektedir. Hizmet; stok yönetimi,
            nakit akışı, satış kaydı, görev yönetimi, prosedür, acil fon, kar-zarar analizi ve
            KDV yönetimi modüllerini kapsamaktadır.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-800">3. Hizmet Bedeli</h2>
          <div className="bg-[var(--mint)] border border-[var(--forest-100, #D9F2E4)] rounded-xl p-4 text-sm space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-800 font-semibold">Aylık Plan</span>
              <span className="text-[var(--leaf)] font-bold text-base">499 TL / ay</span>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <span className="text-gray-800 font-semibold">Yıllık Plan</span>
                <span className="ml-2 text-xs bg-[rgba(34,197,94,0.15)] text-[#22c55e] px-2 py-0.5 rounded-full">%20 İndirim</span>
              </div>
              <span className="text-[var(--leaf)] font-bold text-base">4.790 TL / yıl</span>
            </div>
            <p className="text-gray-500 text-xs">Tüm fiyatlar KDV dahildir. Yıllık plan aylık plana kıyasla %20 daha avantajlıdır.</p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-800">4. Ödeme Şekli ve Süresi</h2>
          <p className="text-sm">
            Ödeme yöntemi: [HENÜZ_KARAR_VERİLMEDİ — ödeme entegrasyonu tamamlandığında güncellenecektir].
            Ödeme, abonelik başlamadan önce alınır. Aylık aboneliklerde her dönem başında otomatik
            olarak tahsilat gerçekleştirilir. Yıllık aboneliklerde ödeme bir defada alınır.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-800">5. Hizmetin Teslimi</h2>
          <p className="text-sm">
            PilotSensin tamamen dijital bir hizmettir. Ödemenin onaylanmasının ardından hizmet
            anında aktive edilir; kullanıcı platforma derhal erişim sağlar. Herhangi bir fiziksel
            teslimat söz konusu değildir.
          </p>
          <p className="text-sm">
            Yeni üyelere 7 günlük ücretsiz deneme süresi tanınır; deneme sırasında kredi kartı
            bilgisi istenmez ve herhangi bir ücret tahsil edilmez.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-800">6. Cayma Hakkı</h2>
          <div className="bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] rounded-xl p-4 text-sm space-y-2">
            <p className="text-gray-800 font-semibold">Cayma hakkı bu hizmet için kullanılamaz.</p>
            <p>
              Mesafeli Sözleşmeler Yönetmeliği madde 15/1-h uyarınca; tüketicinin onayı ile
              ifasına başlanmış dijital içerik ve hizmetlerde cayma hakkı bulunmamaktadır.
              Kullanıcı, ödeme öncesinde bu durumu açıkça kabul etmektedir.
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-800">7. Şikayet ve İtiraz Yolları</h2>
          <ul className="space-y-1.5 text-sm list-disc list-inside">
            <li>Öncelikle destek@pilotsensin.com adresine yazılı başvuru yapılabilir.</li>
            <li>Anlaşmazlık çözümlenemezse Antalya Tüketici Hakem Heyeti&apos;ne (2026 yılı sınır değeri altındaki uyuşmazlıklar için) başvurulabilir.</li>
            <li>Daha yüksek tutarlı uyuşmazlıklarda Antalya Tüketici Mahkemeleri yetkilidir.</li>
            <li>T.C. Ticaret Bakanlığı Tüketici Bilgi Sistemi (TÜBİS) üzerinden de şikayette bulunulabilir.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-800">8. Sözleşmenin Saklanması</h2>
          <p className="text-sm">
            Bu sözleşme, Ticaret Bakanlığı mevzuatı uyarınca 10 yıl süre ile saklanacaktır.
            Kullanıcı talep ettiğinde sözleşmenin bir kopyası e-posta ile iletilir.
          </p>
        </section>

        <div className="border-t border-gray-200 pt-6 text-sm text-gray-500">
          <p>İlgili belgeler: <Link href="/politikalar/on-bilgilendirme" className="text-[var(--leaf)] hover:underline mr-3">Ön Bilgilendirme Formu</Link><Link href="/politikalar/iade-iptal" className="text-[var(--leaf)] hover:underline">İade &amp; İptal Politikası</Link></p>
          <p className="mt-2">Soru ve itirazlarınız için: <Link href="mailto:destek@pilotsensin.com" className="text-[var(--leaf)] hover:underline">destek@pilotsensin.com</Link></p>
          <p className="mt-1">Son güncelleme: {GUNCELLEME}</p>
        </div>
      </div>
    </div>
  );
}
