import TarihBilgisi from "@/components/dashboard/TarihBilgisi";
import DashboardContent from "./DashboardContent";

export default function DashboardPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-4 lg:space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-white">Kontrol Paneli</h1>
        <p className="text-xs md:text-sm text-[#94a3b8] mt-1">
          <TarihBilgisi />
        </p>
      </div>
      <DashboardContent />
    </div>
  );
}
