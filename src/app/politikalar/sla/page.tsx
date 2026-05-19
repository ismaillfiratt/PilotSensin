import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Hizmet Seviyesi Sözleşmesi (SLA) – PilotSensin" };

const GUNCELLEME = "19 Mayıs 2026";

export default function SLAPage() {
  return (
    <div className="space-y-6">
      <div className="card rounded-2xl p-6 md:p-8">
        <h1 className="text-2xl font-bold text-white mb-1">Hizmet Seviyesi Sözleşmesi (SLA)</h1>
        <p className="text-sm text-gray-500">Son güncelleme: {GUNCELLEME}</p>
        <p className="text-sm text-gray-400 mt-3">
          Bu belge, PilotSensin&apos;in hizmet sürekliliği, erişilebilirlik garantisi ve destek
          yanıt süreleri konusundaki taahhütlerini açıklamaktadır.
        </p>
      </div>

      <div className="card rounded-2xl p-6 md:p-8 space-y-8 text-gray-400 leading-relaxed">

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">1. Uptime Garantisi</h2>
          <div className="bg-[rgba(34,197,94,0.08)] border border-[rgba(34,197,94,0.2)] rounded-xl p-4 text-center">
            <p className="text-3xl font-black text-[#22c55e]">%99,5</p>
            <p className="text-sm text-gray-400 mt-1">Aylık ortalama erişilebilirlik garantisi</p>
          </div>
          <p className="text-sm">
            %99,5 uptime garantisi, aylık 21,6 dakikaya kadar toplam kesinti süresine karşılık
            gelir. Bu değer, takvim ayı bazında ölçülür ve planlı bakımlar kapsam dışında tutulur.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">2. Kapsam Dışındaki Durumlar</h2>
          <p className="text-sm">Aşağıdaki durumlar uptime hesaplamasına dahil edilmez:</p>
          <ul className="space-y-1.5 text-sm list-disc list-inside">
            <li>Önceden duyurulan planlı bakım süreleri (en az 48 saat öncesinden e-posta ile bildirim yapılır)</li>
            <li>Mücbir sebep halleri (doğal afet, savaş, büyük çaplı siber saldırı vb.)</li>
            <li>Supabase Inc. veya Vercel Inc. kaynaklı altyapı kesintileri</li>
            <li>Kullanıcının internet bağlantısı veya cihazından kaynaklanan sorunlar</li>
            <li>Kullanıcının kendi eylemleri nedeniyle oluşan erişim sorunları</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">3. İzleme ve Durum Bilgisi</h2>
          <p className="text-sm">
            Platform durumu Vercel Analytics ve Supabase Status aracılığıyla sürekli izlenmektedir.
            Hizmet kesintisi durumunda kullanıcılar e-posta yoluyla bilgilendirilir. Güncel
            sistem durumu için altyapı sağlayıcılarının durum sayfaları takip edilebilir.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">4. SLA İhlali Durumunda Kredi</h2>
          <p className="text-sm">
            Aylık uptime garantisinin (%99,5) altına düşülmesi durumunda, hizmet kesintisi
            yaşanan günlere ait günlük ücret, bir sonraki fatura döneminden düşülür.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2.5 pr-4 text-gray-500 font-medium">Aylık Uptime</th>
                  <th className="text-left py-2.5 text-gray-500 font-medium">Kredi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr><td className="py-2.5 pr-4 text-gray-400">%99,5 ve üzeri</td><td className="py-2.5 text-white">Kredi yok</td></tr>
                <tr><td className="py-2.5 pr-4 text-gray-400">%99,0 – %99,4</td><td className="py-2.5 text-white">Kesinti günleri kredi</td></tr>
                <tr><td className="py-2.5 pr-4 text-gray-400">%99,0 altı</td><td className="py-2.5 text-white">Kesinti günleri kredi + ek değerlendirme</td></tr>
              </tbody>
            </table>
          </div>
          <p className="text-sm text-gray-500 text-xs">Kredi talebinde bulunmak için kesintiden itibaren 7 gün içinde destek@pilotsensin.com adresine yazılı bildirim gerekmektedir.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">5. Destek Yanıt Süreleri</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2.5 pr-4 text-gray-500 font-medium">Öncelik</th>
                  <th className="text-left py-2.5 pr-4 text-gray-500 font-medium">Tanım</th>
                  <th className="text-left py-2.5 text-gray-500 font-medium">İlk Yanıt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[
                  ["🔴 Kritik", "Sistem tamamen çökmüş, platforma hiç erişilemiyor", "4 saat"],
                  ["🟠 Yüksek", "Bir modül veya kritik özellik çalışmıyor", "1 iş günü"],
                  ["🟡 Orta", "Özellik bozuk ancak geçici çözüm mevcut", "2 iş günü"],
                  ["🟢 Düşük", "Genel sorular, öneri, kozmetik hatalar", "3 iş günü"],
                ].map(([oncelik, tanim, sure]) => (
                  <tr key={oncelik}>
                    <td className="py-2.5 pr-4 text-white font-medium">{oncelik}</td>
                    <td className="py-2.5 pr-4 text-gray-400">{tanim}</td>
                    <td className="py-2.5 text-[var(--leaf)] font-semibold">{sure}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-gray-500 text-xs">İş günleri hafta içi 09:00–18:00 (TSİ) olarak tanımlanmıştır. Destek kanalları: destek@pilotsensin.com veya platform içi /iletisim sayfası.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">6. Destek Talep Kanalları</h2>
          <ul className="space-y-1.5 text-sm list-disc list-inside">
            <li>E-posta: destek@pilotsensin.com</li>
            <li>Platform içi: <Link href="/iletisim" className="text-[var(--leaf)] hover:underline">/iletisim</Link> sayfası üzerinden ticket oluşturma</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">7. SLA Değişiklikleri</h2>
          <p className="text-sm">
            Bu sözleşmede yapılacak değişiklikler, yürürlüğe girmeden en az 30 gün önce
            kayıtlı e-posta adresinize bildirilir.
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
