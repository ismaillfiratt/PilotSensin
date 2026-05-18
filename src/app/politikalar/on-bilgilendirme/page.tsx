import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Ön Bilgilendirme Formu – PilotSensin" };

const GUNCELLEME = "19 Mayıs 2026";

export default function OnBilgilendirmePage() {
  return (
    <div className="space-y-6">
      <div className="glass-card rounded-2xl p-6 md:p-8">
        <h1 className="text-2xl font-bold text-white mb-1">Ön Bilgilendirme Formu</h1>
        <p className="text-sm text-[#64748b]">Son güncelleme: {GUNCELLEME}</p>
        <p className="text-sm text-[#94a3b8] mt-3">
          Mesafeli Sözleşmeler Yönetmeliği madde 5 uyarınca ödeme işleminden önce tüketiciye
          sunulması zorunlu bilgilendirme formudur.
        </p>
      </div>

      <div className="glass-card rounded-2xl p-6 md:p-8 space-y-8 text-[#94a3b8] leading-relaxed">

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">1. Satıcı Bilgileri</h2>
          <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-xl p-4 text-sm space-y-1">
            <div className="flex gap-3"><span className="text-[#64748b] min-w-24">Ticaret Unvanı</span><span>İsmail Fırat (Şahıs Şirketi)</span></div>
            <div className="flex gap-3"><span className="text-[#64748b] min-w-24">Adres</span><span>Güveren Mah. 3746. Sk. No:13 Kepez / Antalya</span></div>
            <div className="flex gap-3"><span className="text-[#64748b] min-w-24">E-posta</span><span className="text-[#fbc024]">destek@pilotsensin.com</span></div>
            <div className="flex gap-3"><span className="text-[#64748b] min-w-24">Web</span><span>https://pilotsensin.com</span></div>
            <div className="flex gap-3"><span className="text-[#64748b] min-w-24">Vergi / T.C.</span><span>[SONRADAN_EKLENECEK]</span></div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">2. Hizmetin Temel Nitelikleri</h2>
          <p className="text-sm">PilotSensin, küçük ve orta ölçekli işletmeler için bulut tabanlı SaaS işletme yönetim platformudur. Hizmet kapsamındaki modüller:</p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-sm">
            {[
              "Stok ve ürün yönetimi",
              "Nakit akışı takibi",
              "Satış kaydı ve raporlama",
              "Görev yönetimi (Kanban)",
              "Prosedür ve kontrol listesi",
              "Acil durum fonu takibi",
              "Kar-zarar analizi",
              "KDV hesaplama ve yönetimi",
              "Ekip yönetimi",
              "Destek ve iletişim modülü",
            ].map(m => (
              <li key={m} className="flex items-center gap-2 bg-[rgba(255,255,255,0.02)] rounded-lg px-3 py-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#fbc024] shrink-0" />
                {m}
              </li>
            ))}
          </ul>
          <p className="text-sm mt-2">Hizmet kesintisiz 7/24 erişim imkânı sunmakla birlikte %99,5 uptime garantisi taahhüt edilmektedir. Detaylar için <Link href="/politikalar/sla" className="text-[#fbc024] hover:underline">SLA</Link> dokümanını inceleyiniz.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">3. Toplam Fiyat</h2>
          <div className="space-y-2 text-sm">
            <div className="bg-[rgba(251,192,36,0.06)] border border-[rgba(251,192,36,0.2)] rounded-xl p-4 space-y-2">
              <div className="flex justify-between"><span>Aylık Plan</span><span className="text-[#fbc024] font-bold">499 TL / ay (KDV dahil)</span></div>
              <div className="flex justify-between">
                <div>
                  <span>Yıllık Plan</span>
                  <span className="ml-2 text-xs text-[#22c55e]">(%20 indirim)</span>
                </div>
                <span className="text-[#fbc024] font-bold">4.790 TL / yıl (KDV dahil)</span>
              </div>
            </div>
            <p className="text-xs text-[#64748b]">Belirtilen fiyatlar KDV dahildir. Türk Lirası cinsinden tahsil edilir.</p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">4. Ödeme Yöntemi</h2>
          <p className="text-sm">[HENÜZ_KARAR_VERİLMEDİ — ödeme entegrasyonu tamamlandığında bu bölüm güncellenecektir.]</p>
          <p className="text-sm">Abonelikler otomatik olarak yenilenir. Yenilemeyi dönem bitmeden önce Ayarlar bölümünden durdurabilirsiniz.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">5. Hizmetin Teslim Şekli ve Süresi</h2>
          <p className="text-sm">
            PilotSensin tamamen dijital bir hizmettir. Ödemenin onaylanmasının ardından hizmet
            anında aktive edilir; kullanıcı platforma https://pilotsensin.com adresi üzerinden
            derhal erişim sağlar. Herhangi bir fiziksel teslimat söz konusu değildir.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">6. Cayma Hakkının Kullanılamayacağı Durumlar</h2>
          <div className="bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] rounded-xl p-4 text-sm space-y-2">
            <p>
              Mesafeli Sözleşmeler Yönetmeliği madde 15/1-h uyarınca; tüketicinin onayıyla
              ifasına başlanmış dijital içerik ve elektronik hizmetlerde cayma hakkı
              kullanılamaz. Ödeme işlemi tamamlandığında hizmet anında başladığından, ödeme
              aşamasında kullanıcının cayma hakkının bulunmadığını açıkça kabul etmesi
              gerekmektedir.
            </p>
            <p>
              Deneme süresi (7 gün) boyunca herhangi bir ücret tahsil edilmez; deneme
              süresinde abonelik satın alınmazsa otomatik olarak sona erer.
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">7. Sözleşmenin Süresi ve Saklanması</h2>
          <p className="text-sm">
            Abonelik, iptal edilene kadar otomatik yenilemeyle devam eder. Bu sözleşme
            yasal düzenlemeler çerçevesinde 10 yıl süreyle saklanacaktır. Talep edilmesi
            halinde bir kopyası e-posta ile iletilir.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">8. Şikayet ve İtiraz Başvuru Yolları</h2>
          <ul className="space-y-1.5 text-sm list-disc list-inside">
            <li>Öncelikle destek@pilotsensin.com adresine yazılı başvuru yapılabilir.</li>
            <li>Antalya İl Tüketici Hakem Heyeti (yasal sınır değeri altındaki uyuşmazlıklar)</li>
            <li>Antalya Tüketici Mahkemeleri (üst sınırı aşan uyuşmazlıklar)</li>
            <li>T.C. Ticaret Bakanlığı — Tüketici Bilgi Sistemi (TÜBİS): tuketici.gov.tr</li>
          </ul>
        </section>

        <div className="border-t border-[rgba(255,255,255,0.07)] pt-6 text-sm text-[#64748b]">
          <p>İlgili belgeler: <Link href="/politikalar/mesafeli-satis" className="text-[#fbc024] hover:underline mr-3">Mesafeli Satış Sözleşmesi</Link><Link href="/politikalar/iade-iptal" className="text-[#fbc024] hover:underline">İade &amp; İptal Politikası</Link></p>
          <p className="mt-2">Soru ve itirazlarınız için: <Link href="mailto:destek@pilotsensin.com" className="text-[#fbc024] hover:underline">destek@pilotsensin.com</Link></p>
          <p className="mt-1">Son güncelleme: {GUNCELLEME}</p>
        </div>
      </div>
    </div>
  );
}
