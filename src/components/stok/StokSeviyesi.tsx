import { Urun, stokDurumu, gunKaldi } from "@/lib/stok-data";

interface Props {
  urun: Urun;
}

const durumConfig = {
  normal: { color: "#22c55e", label: "Normal", barColor: "#22c55e" },
  uyari: { color: "#fbc024", label: "Uyarı", barColor: "#fbc024" },
  kritik: { color: "#ef4444", label: "Kritik", barColor: "#ef4444" },
  olu: { color: "#94a3b8", label: "Ölü Stok", barColor: "#94a3b8" },
};

export default function StokSeviyesi({ urun }: Props) {
  const durum = stokDurumu(urun);
  const cfg = durumConfig[durum];
  const gun = gunKaldi(urun);

  const maxGorsel = urun.emniyetStogu * 2;
  const yuzde = Math.min((urun.mevcutAdet / maxGorsel) * 100, 100);
  const emniyetYuzde = Math.min((urun.emniyetStogu / maxGorsel) * 100, 100);
  const kritikYuzde = Math.min((urun.kritikStok / maxGorsel) * 100, 100);

  return (
    <div className="flex flex-col gap-1 min-w-[120px]">
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="font-semibold text-white">{urun.mevcutAdet} {urun.birim}</span>
        {gun !== null && (
          <span className="text-[#94a3b8]">~{gun}g</span>
        )}
      </div>
      <div className="relative h-2 rounded-full bg-[rgba(255,255,255,0.06)] overflow-visible">
        {/* Emniyet çizgisi */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full bg-[#fbc024] opacity-60 z-10"
          style={{ left: `${emniyetYuzde}%` }}
          title={`Emniyet: ${urun.emniyetStogu}`}
        />
        {/* Kritik çizgisi */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full bg-[#ef4444] opacity-60 z-10"
          style={{ left: `${kritikYuzde}%` }}
          title={`Kritik: ${urun.kritikStok}`}
        />
        {/* Doluluk */}
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${yuzde}%`, backgroundColor: cfg.barColor }}
        />
      </div>
      <div className="flex justify-between items-center">
        <span
          className="text-[10px] font-bold px-1.5 py-0.5 rounded"
          style={{ color: cfg.color, backgroundColor: `${cfg.color}15` }}
        >
          {cfg.label}
        </span>
        <span className="text-[10px] text-[#94a3b8]">
          min {urun.kritikStok} / em {urun.emniyetStogu}
        </span>
      </div>
    </div>
  );
}
