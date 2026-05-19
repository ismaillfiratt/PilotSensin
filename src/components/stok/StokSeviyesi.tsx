import { Urun, stokDurumu, gunKaldi } from "@/lib/stok-data";

interface Props { urun: Urun; }

const durumConfig = {
  normal: { color: "#10B981", label: "Normal",   barColor: "#10B981", labelBg: "#F0FDF4" },
  uyari:  { color: "#F59E0B", label: "Uyarı",    barColor: "#F59E0B", labelBg: "#FFFBEB" },
  kritik: { color: "#EF4444", label: "Kritik",   barColor: "#EF4444", labelBg: "#FEF2F2" },
  olu:    { color: "#94A3B8", label: "Ölü Stok", barColor: "#CBD5E1", labelBg: "#F1F5F9" },
};

export default function StokSeviyesi({ urun }: Props) {
  const durum = stokDurumu(urun);
  const cfg   = durumConfig[durum];
  const gun   = gunKaldi(urun);

  const maxGorsel    = urun.emniyetStogu * 2;
  const yuzde        = Math.min((urun.mevcutAdet / maxGorsel) * 100, 100);
  const emniyetYuzde = Math.min((urun.emniyetStogu / maxGorsel) * 100, 100);
  const kritikYuzde  = Math.min((urun.kritikStok / maxGorsel) * 100, 100);

  return (
    <div className="flex flex-col gap-1 min-w-30">
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="font-semibold text-gray-700">{urun.mevcutAdet} {urun.birim}</span>
        {gun !== null && <span className="text-gray-400">~{gun}g</span>}
      </div>
      <div className="relative h-2 rounded-full bg-gray-100 overflow-visible">
        <div className="absolute top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full bg-amber-400 opacity-70 z-10"
          style={{ left: `${emniyetYuzde}%` }}
          title={`Emniyet: ${urun.emniyetStogu}`} />
        <div className="absolute top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full bg-red-400 opacity-70 z-10"
          style={{ left: `${kritikYuzde}%` }}
          title={`Kritik: ${urun.kritikStok}`} />
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${yuzde}%`, backgroundColor: cfg.barColor }} />
      </div>
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
          style={{ color: cfg.color, backgroundColor: cfg.labelBg }}>
          {cfg.label}
        </span>
        <span className="text-[10px] text-gray-400">min {urun.kritikStok} / em {urun.emniyetStogu}</span>
      </div>
    </div>
  );
}
