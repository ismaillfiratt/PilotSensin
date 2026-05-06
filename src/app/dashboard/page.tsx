import PilotScore from "@/components/dashboard/PilotScore";
import ModuleCard from "@/components/dashboard/ModuleCard";
import QuickActions from "@/components/dashboard/QuickActions";
import TarihBilgisi from "@/components/dashboard/TarihBilgisi";

const modules = [
  {
    title: "Nakit Akışı",
    href: "/nakit-akisi",
    iconName: "TrendingUp" as const,
    score: 52,
    status: "warning" as const,
    metric: "₺48.200",
    metricLabel: "Mevcut nakit",
    alertCount: 2,
  },
  {
    title: "Kar-Zarar",
    href: "/kar-zarar",
    iconName: "BarChart3" as const,
    score: 68,
    status: "warning" as const,
    metric: "%18",
    metricLabel: "Brüt marj",
    alertCount: 1,
  },
  {
    title: "Stok Yönetimi",
    href: "/stok",
    iconName: "Package" as const,
    score: 61,
    status: "warning" as const,
    metric: "3",
    metricLabel: "Kritik stok kalemi",
    alertCount: 3,
  },
  {
    title: "Görevler",
    href: "/gorevler",
    iconName: "CheckSquare" as const,
    score: 74,
    status: "ok" as const,
    metric: "12",
    metricLabel: "Açık görev",
    alertCount: 0,
  },
  {
    title: "Prosedürler",
    href: "/prosedurler",
    iconName: "ClipboardList" as const,
    score: 80,
    status: "ok" as const,
    metric: "%85",
    metricLabel: "Tamamlanma oranı",
    alertCount: 0,
  },
  {
    title: "Acil Durum Fonu",
    href: "/acil-fon",
    iconName: "Shield" as const,
    score: 35,
    status: "critical" as const,
    metric: "₺12.000",
    metricLabel: "Mevcut birikim / ₺30.000 hedef",
    alertCount: 1,
  },
];

const summaryStats = [
  { label: "Bu ay gelir", value: "₺124.500", change: "+8%", up: true },
  { label: "Bu ay gider", value: "₺76.300", change: "+3%", up: false },
  { label: "Net kar", value: "₺48.200", change: "+14%", up: true },
];

export default function DashboardPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Kontrol Paneli</h1>
        <p className="text-sm text-[#94a3b8] mt-1">
          <TarihBilgisi />
</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <PilotScore score={72} />
        </div>
        <div className="lg:col-span-2 flex flex-col gap-6">
          <QuickActions />
          <div className="grid grid-cols-3 gap-3">
            {summaryStats.map(({ label, value, change, up }) => (
              <div key={label} className="glass-card rounded-xl p-4">
                <p className="text-xs text-[#94a3b8] mb-1">{label}</p>
                <p className="text-lg font-bold text-white">{value}</p>
                <span className={`text-xs font-medium ${up ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                  {up ? "▲" : "▼"} {change}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-widest mb-4">
          Modüller
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((mod, i) => (
            <ModuleCard key={mod.href} {...mod} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
