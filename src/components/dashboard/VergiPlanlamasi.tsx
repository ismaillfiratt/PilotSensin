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
    <div className="card rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Receipt className="w-4 h-4 text-[var(--text-secondary)]" />
          <h2 className="text-sm font-bold text-gray-800">Vergi Planlaması</h2>
          <span className="text-xs text-gray-500">— gerçek KDV bakiyesi</span>
        </div>
        <span className="text-[10px] text-gray-500">{kayitlar.length} hareket</span>
      </div>

      {/* Ana kartlar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-[rgba(250,250,250,0.05)] border border-[rgba(250,250,250,0.10)]">
          <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wide font-semibold">İndirilecek KDV</p>
          <p className="text-sm font-bold text-[var(--text-primary)] mt-0.5">{tl(girdi)}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">{girisSayisi} alış hareketi</p>
        </div>
        <div className="p-3 rounded-xl bg-[rgba(239,68,68,0.07)] border border-[rgba(239,68,68,0.15)]">
          <p className="text-[10px] text-[#ef4444] uppercase tracking-wide font-semibold">Hesaplanan KDV</p>
          <p className="text-sm font-bold text-[#ef4444] mt-0.5">{tl(cikti)}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">{cikisSayisi} satış hareketi</p>
        </div>
        <div className="p-3 rounded-xl border bg-[rgba(250,250,250,0.05)] border-[rgba(250,250,250,0.10)]">
          <p className="text-[10px] uppercase tracking-wide font-semibold text-[var(--text-secondary)]">
            {devreden ? "Devreden KDV" : "Ödenecek KDV"}
          </p>
          <p className="text-sm font-bold mt-0.5 text-[var(--text-primary)]">{tl(netTutar)}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">{devreden ? "sonraki döneme" : "vergi dairesi"}</p>
        </div>
      </div>

      {/* Sonuç mesajı */}
      <div className="flex items-start gap-2 p-3 rounded-xl bg-[rgba(250,250,250,0.05)] border border-[rgba(250,250,250,0.10)]">
        {devreden
          ? <CheckCircle className="w-3.5 h-3.5 text-[var(--text-secondary)] shrink-0 mt-0.5" />
          : <AlertTriangle className="w-3.5 h-3.5 text-[var(--text-secondary)] shrink-0 mt-0.5" />}
        <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          {devreden
            ? `Bu dönem ödenecek vergi yok — sonraki aya devreden KDV: ${tl(netTutar)}`
            : `Bu dönem vergi dairesine ödenecek net KDV: ${tl(netTutar)}`}
        </p>
      </div>

      <div className="flex items-start gap-1.5">
        <TrendingDown className="w-3 h-3 text-gray-600 shrink-0 mt-0.5" />
        <p className="text-[10px] text-gray-500 leading-relaxed">
          Veriler, stok hareketleri (giris/çıkış) üzerinden otomatik hesaplanır. Ürüne maliyet bilgisi girilmediyse o harekete ait KDV hesaplanmaz.
        </p>
      </div>
    </div>
  );
}
