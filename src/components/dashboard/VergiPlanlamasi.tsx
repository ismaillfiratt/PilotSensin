"use client";

import { Receipt, TrendingDown, AlertTriangle, CheckCircle } from "lucide-react";
import { useKdvHavuzu, toplamGirdiKdv, toplamCiktiKdv, netKdvBakiye } from "@/store/kdvHavuzu";
import { useSirket } from "@/store/sirket";

const tl = (n: number) =>
  (n / 100).toLocaleString("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 });

export default function VergiPlanlamasi() {
  const { rol }      = useSirket();
  const { kayitlar } = useKdvHavuzu();

  if (rol && rol !== "pilot") return null;
  if (kayitlar.length === 0)  return null;

  const girdi    = toplamGirdiKdv(kayitlar);
  const cikti    = toplamCiktiKdv(kayitlar);
  const net      = netKdvBakiye(kayitlar);
  const devreden = net < 0;
  const netTutar = Math.abs(net);

  const girisSayisi = kayitlar.filter((k) => k.tip === "giris").length;
  const cikisSayisi = kayitlar.filter((k) => k.tip === "cikis").length;

  return (
    <div className="glass-card rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Receipt className="w-4 h-4 text-[#22c55e]" />
          <h2 className="text-sm font-bold text-white">Vergi Planlaması</h2>
          <span className="text-xs text-[#64748b]">— gerçek KDV bakiyesi</span>
        </div>
        <span className="text-[10px] text-[#475569]">{kayitlar.length} hareket</span>
      </div>

      {/* Ana kartlar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-[rgba(34,197,94,0.07)] border border-[rgba(34,197,94,0.15)]">
          <p className="text-[10px] text-[#22c55e] uppercase tracking-wide font-semibold">İndirilecek KDV</p>
          <p className="text-sm font-bold text-[#22c55e] mt-0.5">{tl(girdi)}</p>
          <p className="text-[10px] text-[#475569] mt-0.5">{girisSayisi} alış hareketi</p>
        </div>
        <div className="p-3 rounded-xl bg-[rgba(239,68,68,0.07)] border border-[rgba(239,68,68,0.15)]">
          <p className="text-[10px] text-[#ef4444] uppercase tracking-wide font-semibold">Hesaplanan KDV</p>
          <p className="text-sm font-bold text-[#ef4444] mt-0.5">{tl(cikti)}</p>
          <p className="text-[10px] text-[#475569] mt-0.5">{cikisSayisi} satış hareketi</p>
        </div>
        <div className={`p-3 rounded-xl border ${devreden ? "bg-[rgba(34,197,94,0.07)] border-[rgba(34,197,94,0.15)]" : "bg-[rgba(251,192,36,0.07)] border-[rgba(251,192,36,0.15)]"}`}>
          <p className={`text-[10px] uppercase tracking-wide font-semibold ${devreden ? "text-[#22c55e]" : "text-[#fbc024]"}`}>
            {devreden ? "Devreden KDV" : "Ödenecek KDV"}
          </p>
          <p className={`text-sm font-bold mt-0.5 ${devreden ? "text-[#22c55e]" : "text-[#fbc024]"}`}>{tl(netTutar)}</p>
          <p className="text-[10px] text-[#475569] mt-0.5">{devreden ? "sonraki döneme" : "vergi dairesi"}</p>
        </div>
      </div>

      {/* Sonuç mesajı */}
      <div className={`flex items-start gap-2 p-3 rounded-xl ${
        devreden
          ? "bg-[rgba(34,197,94,0.06)] border border-[rgba(34,197,94,0.15)]"
          : "bg-[rgba(251,192,36,0.06)] border border-[rgba(251,192,36,0.15)]"
      }`}>
        {devreden
          ? <CheckCircle className="w-3.5 h-3.5 text-[#22c55e] shrink-0 mt-0.5" />
          : <AlertTriangle className="w-3.5 h-3.5 text-[#fbc024] shrink-0 mt-0.5" />}
        <p className="text-xs leading-relaxed" style={{ color: devreden ? "#22c55e" : "#fbc024" }}>
          {devreden
            ? `Bu dönem ödenecek vergi yok — sonraki aya devreden KDV: ${tl(netTutar)}`
            : `Bu dönem vergi dairesine ödenecek net KDV: ${tl(netTutar)}`}
        </p>
      </div>

      <div className="flex items-start gap-1.5">
        <TrendingDown className="w-3 h-3 text-[#334155] shrink-0 mt-0.5" />
        <p className="text-[10px] text-[#475569] leading-relaxed">
          Veriler, stok hareketleri (giris/çıkış) üzerinden otomatik hesaplanır. Ürüne maliyet bilgisi girilmediyse o harekete ait KDV hesaplanmaz.
        </p>
      </div>
    </div>
  );
}
