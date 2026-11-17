import Link from "next/link";

const GUNCELLEME = "19 Mayıs 2026";

export default function OnBilgilendirmeBelge() {
  return (
    <div className="space-y-6">
      <div className="card rounded-2xl p-6 md:p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Ön Bilgilendirme Formu</h1>
        <p className="text-sm text-gray-500">Son güncelleme: {GUNCELLEME}</p>
        <p className="text-sm text-gray-400 mt-3">Mesafeli Sözleşmeler Yönetmeliği madde 5 uyarınca ödeme işleminden önce tüketiciye sunulması zorunlu bilgilendirme formudur.</p>
      </div>
      <div className="card rounded-2xl p-6 md:p-8 space-y-8 text-gray-400 leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-800">1. Satıcı Bilgileri</h2>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm space-y-1">
            <div className="flex gap-3"><span className="text-gray-500 min-w-24">Ticaret Unvanı</span><span>İsmail Fırat (Şahıs Şirketi)</span></div>
            <div className="flex gap-3"><span className="text-gray-500 min-w-24">Adres</span><span>Güveren Mah. 3746. Sk. No:13 Kepez / Antalya</span></div>
            <div className="flex gap-3"><span className="text-gray-500 min-w-24">E-posta</span><span className="text-[var(--leaf)]">destek@pilotsensin.com</span></div>
          </div>
        </section>
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-800">2. Hizmetin Temel Nitelikleri</h2>
          <p className="text-sm">PilotSensin, küçük ve orta ölçekli işletmeler için bulut tabanlı SaaS işletme yönetim platformudur.</p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-sm">
            {["Stok ve ürün yönetimi","Nakit akışı takibi","Satış kaydı ve raporlama","Görev yönetimi","Prosedür ve kontrol listesi","Acil durum fonu takibi","Kar-zarar analizi","KDV hesaplama ve yönetimi"].map(m=>(
              <li key={m} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--forest)] shrink-0" />{m}
              </li>
            ))}
          </ul>
        </section>
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-800">3. Toplam Fiyat</h2>
          <div className="bg-[var(--mint)] border border-[var(--forest-100,#D9F2E4)] rounded-xl p-4 text-sm space-y-2">
            <div className="flex justify-between"><span>Aylık Plan</span><span className="text-[var(--leaf)] font-bold">499 TL / ay (KDV dahil)</span></div>
            <div className="flex justify-between"><span>Yıllık Plan <span className="text-xs text-[#22c55e]">(%20 indirim)</span></span><span className="text-[var(--leaf)] font-bold">4.790 TL / yıl (KDV dahil)</span></div>
          </div>
        </section>
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-800">4. Cayma Hakkının Kullanılamayacağı Durumlar</h2>
          <div className="bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] rounded-xl p-4 text-sm">
            <p>Mesafeli Sözleşmeler Yönetmeliği madde 15/1-h uyarınca; ödeme tamamlandığında hizmet anında başladığından, ödeme aşamasında cayma hakkı bulunmamaktadır.</p>
            <p className="mt-2">Deneme süresi (7 gün) boyunca herhangi bir ücret tahsil edilmez.</p>
          </div>
        </section>
        <div className="border-t border-gray-200 pt-6 text-sm text-gray-500">
          <p>İlgili belgeler: <Link href="/politikalar/mesafeli-satis" className="text-[var(--leaf)] hover:underline mr-3">Mesafeli Satış Sözleşmesi</Link><Link href="/politikalar/iade-iptal" className="text-[var(--leaf)] hover:underline">İade &amp; İptal Politikası</Link></p>
          <p className="mt-2">Soru ve itirazlarınız için: <Link href="mailto:destek@pilotsensin.com" className="text-[var(--leaf)] hover:underline">destek@pilotsensin.com</Link></p>
          <p className="mt-1">Son güncelleme: {GUNCELLEME}</p>
        </div>
      </div>
    </div>
  );
}
