import Link from "next/link";

const GUNCELLEME = "19 Mayıs 2026";

export default function SLABelge() {
  return (
    <div className="space-y-6">
      <div className="card rounded-2xl p-6 md:p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Hizmet Seviyesi Sözleşmesi (SLA)</h1>
        <p className="text-sm text-gray-500">Son güncelleme: {GUNCELLEME}</p>
        <p className="text-sm text-gray-400 mt-3">Bu belge, PilotSensin&apos;in hizmet sürekliliği, erişilebilirlik garantisi ve destek yanıt süreleri konusundaki taahhütlerini açıklamaktadır.</p>
      </div>
      <div className="card rounded-2xl p-6 md:p-8 space-y-8 text-gray-400 leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-800">1. Uptime Garantisi</h2>
          <div className="bg-[rgba(34,197,94,0.08)] border border-[rgba(34,197,94,0.2)] rounded-xl p-4 text-center">
            <p className="text-3xl font-black text-[#22c55e]">%99,5</p>
            <p className="text-sm text-gray-400 mt-1">Aylık ortalama erişilebilirlik garantisi</p>
          </div>
          <p className="text-sm">%99,5 uptime garantisi, aylık 21,6 dakikaya kadar toplam kesinti süresine karşılık gelir.</p>
        </section>
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-800">2. Kapsam Dışındaki Durumlar</h2>
          <ul className="space-y-1.5 text-sm list-disc list-inside">
            <li>Önceden duyurulan planlı bakım süreleri</li>
            <li>Mücbir sebep halleri (doğal afet, savaş, büyük çaplı siber saldırı vb.)</li>
            <li>Supabase Inc. veya Vercel Inc. kaynaklı altyapı kesintileri</li>
          </ul>
        </section>
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-800">3. SLA İhlali Durumunda Kredi</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead><tr className="border-b border-gray-200"><th className="text-left py-2.5 pr-4 text-gray-500 font-medium">Aylık Uptime</th><th className="text-left py-2.5 text-gray-500 font-medium">Kredi</th></tr></thead>
              <tbody className="divide-y divide-gray-100">
                <tr><td className="py-2.5 pr-4 text-gray-400">%99,5 ve üzeri</td><td className="py-2.5 text-gray-800">Kredi yok</td></tr>
                <tr><td className="py-2.5 pr-4 text-gray-400">%99,0 – %99,4</td><td className="py-2.5 text-gray-800">Kesinti günleri kredi</td></tr>
                <tr><td className="py-2.5 pr-4 text-gray-400">%99,0 altı</td><td className="py-2.5 text-gray-800">Kesinti günleri kredi + ek değerlendirme</td></tr>
              </tbody>
            </table>
          </div>
        </section>
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-800">4. Destek Yanıt Süreleri</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead><tr className="border-b border-gray-200"><th className="text-left py-2.5 pr-4 text-gray-500 font-medium">Öncelik</th><th className="text-left py-2.5 pr-4 text-gray-500 font-medium">Tanım</th><th className="text-left py-2.5 text-gray-500 font-medium">İlk Yanıt</th></tr></thead>
              <tbody className="divide-y divide-gray-100">
                {[
                  ["🔴 Kritik","Sistem tamamen çökmüş","4 saat"],
                  ["🟠 Yüksek","Bir modül veya kritik özellik çalışmıyor","1 iş günü"],
                  ["🟡 Orta","Özellik bozuk ancak geçici çözüm mevcut","2 iş günü"],
                  ["🟢 Düşük","Genel sorular, öneri, kozmetik hatalar","3 iş günü"],
                ].map(([o,t,s])=>(
                  <tr key={o}><td className="py-2.5 pr-4 text-gray-800 font-medium">{o}</td><td className="py-2.5 pr-4 text-gray-400">{t}</td><td className="py-2.5 text-[var(--leaf)] font-semibold">{s}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <div className="border-t border-gray-200 pt-6 text-sm text-gray-500">
          <p>Soru ve itirazlarınız için: <Link href="mailto:destek@pilotsensin.com" className="text-[var(--leaf)] hover:underline">destek@pilotsensin.com</Link></p>
          <p className="mt-1">Son güncelleme: {GUNCELLEME}</p>
        </div>
      </div>
    </div>
  );
}
