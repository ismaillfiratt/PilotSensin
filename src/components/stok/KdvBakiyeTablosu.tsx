"use client";

import { useMemo, useState } from "react";
import { Receipt, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, ChevronDown } from "lucide-react";
import { useKdvHavuzu, toplamGirdiKdv, toplamCiktiKdv, netKdvBakiye } from "@/store/kdvHavuzu";
import { useSirket } from "@/store/sirket";
import { motion, AnimatePresence } from "framer-motion";

const tl = (n: number) =>
  (n / 100).toLocaleString("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 2 });

function zaman(iso: string) {
  return new Date(iso).toLocaleString("tr-TR", {
    day: "2-digit", month: "2-digit", year: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function KdvBakiyeTablosu() {
  const { rol }    = useSirket();
  const { kayitlar } = useKdvHavuzu();
  const [logAcik, setLogAcik] = useState(false);

  // RBAC: sadece Pilot
  if (rol && rol !== "pilot") return null;
  if (kayitlar.length === 0) return null;

  const girdi  = toplamGirdiKdv(kayitlar);
  const cikti  = toplamCiktiKdv(kayitlar);
  const net    = netKdvBakiye(kayitlar);
  const devreden = net < 0;

  return (
    <div className="card rounded-2xl p-5 space-y-4">
      {/* Başlık */}
      <div className="flex items-center gap-2">
        <Receipt className="w-5 h-5 text-[#22c55e]" />
        <h2 className="text-base font-bold text-gray-800">KDV Genel Bakiye</h2>
        <span className="text-xs text-gray-500">— stok hareketlerinden birikimli</span>
      </div>

      {/* Özet kartlar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-[rgba(34,197,94,0.07)] border border-[rgba(34,197,94,0.2)]">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingDown className="w-3.5 h-3.5 text-[#22c55e]" />
            <p className="text-[10px] text-[#22c55e] font-semibold uppercase tracking-wide">İndirilecek KDV</p>
          </div>
          <p className="text-xl font-black text-[#22c55e]">{tl(girdi)}</p>
          <p className="text-[10px] text-[#16a34a] mt-1">
            {kayitlar.filter((k) => k.tip === "giris").length} stok girişi
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[rgba(239,68,68,0.07)] border border-[rgba(239,68,68,0.2)]">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-[#ef4444]" />
            <p className="text-[10px] text-[#ef4444] font-semibold uppercase tracking-wide">Hesaplanan KDV</p>
          </div>
          <p className="text-xl font-black text-[#ef4444]">{tl(cikti)}</p>
          <p className="text-[10px] text-[#dc2626] mt-1">
            {kayitlar.filter((k) => k.tip === "cikis").length} satış hareketi
          </p>
        </div>

        <div className={`p-4 rounded-xl border ${
          devreden
            ? "bg-[rgba(34,197,94,0.07)] border-[rgba(34,197,94,0.2)]"
            : "bg-[var(--mint)] border-[var(--forest-100, #D9F2E4)]"
        }`}>
          <div className="flex items-center gap-1.5 mb-1">
            {devreden
              ? <CheckCircle className="w-3.5 h-3.5 text-[#22c55e]" />
              : <AlertTriangle className="w-3.5 h-3.5 text-[var(--leaf)]" />}
            <p className={`text-[10px] font-semibold uppercase tracking-wide ${devreden ? "text-[#22c55e]" : "text-[var(--leaf)]"}`}>
              {devreden ? "Devreden KDV" : "Ödenecek KDV"}
            </p>
          </div>
          <p className={`text-xl font-black ${devreden ? "text-[#22c55e]" : "text-[var(--leaf)]"}`}>
            {tl(Math.abs(net))}
          </p>
          <p className={`text-[10px] mt-1 ${devreden ? "text-[#16a34a]" : "text-[#b45309]"}`}>
            {devreden ? "Sonraki döneme devreden" : "Vergi dairesine ödenecek"}
          </p>
        </div>
      </div>

      {/* Formül gösterimi */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 px-1">
        <span className="text-[#ef4444] font-semibold">{tl(cikti)}</span>
        <span>(Hesaplanan)</span>
        <span>−</span>
        <span className="text-[#22c55e] font-semibold">{tl(girdi)}</span>
        <span>(İndirilecek)</span>
        <span>=</span>
        <span className={`font-bold ${devreden ? "text-[#22c55e]" : "text-[var(--leaf)]"}`}>
          {devreden ? `−${tl(Math.abs(net))}` : tl(net)}
        </span>
        <span>{devreden ? "Devreden" : "Ödenecek"}</span>
      </div>

      {/* KDV Hareket Geçmişi */}
      <div>
        <button
          onClick={() => setLogAcik((v) => !v)}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-400 transition-colors"
        >
          <motion.div animate={{ rotate: logAcik ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="w-3.5 h-3.5" />
          </motion.div>
          KDV Hareket Geçmişi ({kayitlar.length} kayıt)
        </button>

        <AnimatePresence>
          {logAcik && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-3 rounded-xl border border-gray-200 overflow-hidden">
                {/* Desktop başlık */}
                <div className="hidden sm:grid sm:grid-cols-[1fr_80px_60px_80px_80px] gap-3 px-4 py-2.5 bg-gray-50 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                  <span>Ürün</span><span>Hareket</span>
                  <span className="text-right">Adet</span>
                  <span className="text-right">Birim KDV</span>
                  <span className="text-right">Toplam KDV</span>
                </div>
                <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
                  {kayitlar.map((k) => (
                    <div key={k.id}>
                      {/* Mobile kart */}
                      <div className="sm:hidden px-4 py-3 space-y-1.5 text-xs hover:bg-gray-50">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-gray-800 font-medium truncate">{k.urunAd}</p>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0 ${k.tip === "giris" ? "bg-[rgba(34,197,94,0.1)] text-[#22c55e]" : "bg-[rgba(239,68,68,0.1)] text-[#ef4444]"}`}>
                            {k.tip === "giris" ? "Alış" : "Satış"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-gray-400">
                          <span>{zaman(k.tarih)} · {k.adet} adet</span>
                          <span className={`font-semibold ${k.tip === "giris" ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                            {k.tip === "giris" ? "+" : "−"}{tl(k.toplamKdvKurus)}
                          </span>
                        </div>
                      </div>
                      {/* Desktop satır */}
                      <div className="hidden sm:grid sm:grid-cols-[1fr_80px_60px_80px_80px] gap-3 px-4 py-2.5 items-center text-xs hover:bg-gray-50">
                        <div className="min-w-0">
                          <p className="text-gray-800 truncate">{k.urunAd}</p>
                          <p className="text-[10px] text-gray-500">{zaman(k.tarih)}</p>
                        </div>
                        <div>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${k.tip === "giris" ? "bg-[rgba(34,197,94,0.1)] text-[#22c55e]" : "bg-[rgba(239,68,68,0.1)] text-[#ef4444]"}`}>
                            {k.tip === "giris" ? "Alış" : "Satış"}
                          </span>
                        </div>
                        <span className="text-gray-400 text-right">{k.adet}</span>
                        <span className="text-gray-400 text-right">{tl(k.birimKdvKurus)}</span>
                        <span className={`font-semibold text-right ${k.tip === "giris" ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                          {k.tip === "giris" ? "+" : "−"}{tl(k.toplamKdvKurus)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
