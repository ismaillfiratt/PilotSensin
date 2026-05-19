"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Receipt, TrendingDown, TrendingUp, AlertTriangle,
  CheckCircle, ChevronDown,
} from "lucide-react";
import { useKdvHavuzu, toplamGirdiKdv, toplamCiktiKdv, netKdvBakiye } from "@/store/kdvHavuzu";
import { useSirket } from "@/store/sirket";

const tl = (n: number) =>
  (n / 100).toLocaleString("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 2 });

const tlK = (n: number) =>
  (n / 100).toLocaleString("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 });

function zaman(iso: string) {
  return new Date(iso).toLocaleString("tr-TR", {
    day: "2-digit", month: "2-digit", year: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

type Sekme = "bakiye" | "gecmis";

export default function KdvYonetimBolumu() {
  const { rol }      = useSirket();
  const { kayitlar: havuzKayitlari } = useKdvHavuzu();
  const [sekme, setSekme] = useState<Sekme>("bakiye");

  // RBAC: sadece Pilot
  if (rol && rol !== "pilot") return null;

  // ─── Genel Bakiye (gerçek havuz verisi) ───
  const girdiKdv  = toplamGirdiKdv(havuzKayitlari);
  const ciktiKdv  = toplamCiktiKdv(havuzKayitlari);
  const netKdv    = netKdvBakiye(havuzKayitlari);
  const devreden  = netKdv < 0;
  const havuzBos  = havuzKayitlari.length === 0;

  const sekmeler: { key: Sekme; label: string; badge?: number }[] = [
    { key: "bakiye",  label: "Genel Bakiye",    badge: havuzKayitlari.length },
    { key: "gecmis",  label: "Hareket Geçmişi", badge: havuzKayitlari.length },
  ];

  return (
    <div className="card rounded-2xl overflow-hidden">
      {/* ─── Başlık ─── */}
      <div className="px-5 pt-5 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[rgba(34,197,94,0.12)] border border-[rgba(34,197,94,0.2)] flex items-center justify-center shrink-0">
            <Receipt className="w-4.5 h-4.5 text-[#22c55e]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-800">KDV Yönetimi</h2>
            <p className="text-xs text-gray-500">
              Girdi/çıktı KDV takibi · mahsuplaşma projeksiyonu · hareket geçmişi
            </p>
          </div>
        </div>

        {/* Sekmeler */}
        <div className="flex gap-1 mt-4">
          {sekmeler.map((s) => (
            <button
              key={s.key}
              onClick={() => setSekme(s.key)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                backgroundColor: sekme === s.key ? "rgba(34,197,94,0.12)" : "transparent",
                color:           sekme === s.key ? "#22c55e"              : "#64748b",
                border:          sekme === s.key ? "1px solid rgba(34,197,94,0.25)" : "1px solid transparent",
              }}
            >
              {s.label}
              {s.badge !== undefined && s.badge > 0 && (
                <span className="text-[9px] opacity-70">{s.badge}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="p-5 space-y-5">
        <AnimatePresence mode="wait">
          {/* ─────────── SEKME 1: GENEL BAKİYE ─────────── */}
          {sekme === "bakiye" && (
            <motion.div
              key="bakiye"
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}
              className="space-y-4"
            >
              {havuzBos ? (
                <div className="py-10 text-center space-y-2">
                  <Receipt className="w-8 h-8 mx-auto text-gray-600 opacity-50" />
                  <p className="text-sm text-gray-500">Henüz KDV hareketi yok</p>
                  <p className="text-xs text-gray-500">
                    Stok girişi veya çıkışı yaptığınızda KDV otomatik izlenir
                  </p>
                </div>
              ) : (
                <>
                  {/* 3 ana kart */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-4 rounded-xl bg-[rgba(34,197,94,0.07)] border border-[rgba(34,197,94,0.2)] space-y-1">
                      <div className="flex items-center gap-1.5">
                        <TrendingDown className="w-3.5 h-3.5 text-[#22c55e]" />
                        <p className="text-[10px] text-[#22c55e] font-semibold uppercase tracking-wide">İndirilecek KDV</p>
                      </div>
                      <p className="text-xl font-black text-[#22c55e]">{tlK(girdiKdv)}</p>
                      <p className="text-[10px] text-[#16a34a]">
                        {havuzKayitlari.filter((k) => k.tip === "giris").length} alış hareketi
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-[rgba(239,68,68,0.07)] border border-[rgba(239,68,68,0.2)] space-y-1">
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-[#ef4444]" />
                        <p className="text-[10px] text-[#ef4444] font-semibold uppercase tracking-wide">Hesaplanan KDV</p>
                      </div>
                      <p className="text-xl font-black text-[#ef4444]">{tlK(ciktiKdv)}</p>
                      <p className="text-[10px] text-[#dc2626]">
                        {havuzKayitlari.filter((k) => k.tip === "cikis").length} satış hareketi
                      </p>
                    </div>

                    <div className={`p-4 rounded-xl border space-y-1 ${
                      devreden
                        ? "bg-[rgba(34,197,94,0.07)] border-[rgba(34,197,94,0.2)]"
                        : "bg-[var(--mint)] border-[var(--forest-100, #D9F2E4)]"
                    }`}>
                      <div className="flex items-center gap-1.5">
                        {devreden
                          ? <CheckCircle className="w-3.5 h-3.5 text-[#22c55e]" />
                          : <AlertTriangle className="w-3.5 h-3.5 text-[var(--leaf)]" />}
                        <p className={`text-[10px] font-semibold uppercase tracking-wide ${devreden ? "text-[#22c55e]" : "text-[var(--leaf)]"}`}>
                          {devreden ? "Devreden KDV" : "Ödenecek KDV"}
                        </p>
                      </div>
                      <p className={`text-xl font-black ${devreden ? "text-[#22c55e]" : "text-[var(--leaf)]"}`}>
                        {tlK(Math.abs(netKdv))}
                      </p>
                      <p className={`text-[10px] ${devreden ? "text-[#16a34a]" : "text-[#b45309]"}`}>
                        {devreden ? "Sonraki döneme devir" : "Vergi dairesine öde"}
                      </p>
                    </div>
                  </div>

                  {/* Formül */}
                  <div className="flex items-center gap-2 px-1 text-xs flex-wrap">
                    <span className="text-[#ef4444] font-semibold">{tlK(ciktiKdv)}</span>
                    <span className="text-gray-500">Hesaplanan</span>
                    <span className="text-gray-500">−</span>
                    <span className="text-[#22c55e] font-semibold">{tlK(girdiKdv)}</span>
                    <span className="text-gray-500">İndirilecek</span>
                    <span className="text-gray-500">=</span>
                    <span className={`font-bold ${devreden ? "text-[#22c55e]" : "text-[var(--leaf)]"}`}>
                      {devreden ? `−${tlK(Math.abs(netKdv))}` : tlK(netKdv)}
                    </span>
                    <span className={devreden ? "text-[#22c55e]" : "text-[var(--leaf)]"}>
                      {devreden ? "Devreden" : "Ödenecek"}
                    </span>
                  </div>

                  {/* Sonuç banner */}
                  <div className={`flex items-start gap-2.5 p-3.5 rounded-xl border ${
                    devreden
                      ? "bg-[rgba(34,197,94,0.05)] border-[rgba(34,197,94,0.15)]"
                      : "bg-[var(--mint)] border-[var(--mint)]"
                  }`}>
                    {devreden
                      ? <CheckCircle className="w-4 h-4 text-[#22c55e] shrink-0 mt-0.5" />
                      : <AlertTriangle className="w-4 h-4 text-[var(--leaf)] shrink-0 mt-0.5" />}
                    <div>
                      <p className={`text-sm font-semibold ${devreden ? "text-[#22c55e]" : "text-[var(--leaf)]"}`}>
                        {devreden
                          ? `Bu dönemde ödenecek KDV yok — devreden: ${tlK(Math.abs(netKdv))}`
                          : `Bu dönemde vergi dairesine ödenecek net KDV: ${tlK(netKdv)}`}
                      </p>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        Veriler stok hareketi kaydedildiğinde otomatik güncellenir.
                        Ürüne maliyet girilmemişse o hareket izlenmez.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* ─────────── SEKME 2: HAREKET GEÇMİŞİ ─────────── */}
          {sekme === "gecmis" && (
            <motion.div
              key="gecmis"
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}
              className="space-y-3"
            >
              {havuzKayitlari.length === 0 ? (
                <div className="py-10 text-center space-y-2">
                  <Receipt className="w-8 h-8 mx-auto text-gray-600 opacity-50" />
                  <p className="text-sm text-gray-500">Henüz KDV hareketi yok</p>
                </div>
              ) : (
                <div className="rounded-xl border border-gray-200 overflow-hidden">
                  <div className="grid grid-cols-[1fr_80px_60px_80px_90px] gap-3 px-4 py-2.5 bg-gray-50 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                    <span>Ürün / Tarih</span>
                    <span>Hareket</span>
                    <span className="text-right">Adet</span>
                    <span className="text-right">Birim KDV</span>
                    <span className="text-right">Toplam KDV</span>
                  </div>
                  <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
                    {[...havuzKayitlari]
                      .sort((a, b) => new Date(b.tarih).getTime() - new Date(a.tarih).getTime())
                      .map((k) => (
                        <div key={k.id} className="grid grid-cols-[1fr_80px_60px_80px_90px] gap-3 px-4 py-3 items-center hover:bg-gray-50">
                          <div className="min-w-0">
                            <p className="text-xs text-gray-800 truncate">{k.urunAd}</p>
                            <p className="text-[10px] text-gray-500">{zaman(k.tarih)}</p>
                          </div>
                          <div>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                              k.tip === "giris"
                                ? "bg-[rgba(34,197,94,0.12)] text-[#22c55e]"
                                : "bg-[rgba(239,68,68,0.12)] text-[#ef4444]"
                            }`}>
                              {k.tip === "giris" ? "Alış" : "Satış"}
                            </span>
                          </div>
                          <p className="text-gray-400 text-right text-xs">{k.adet}</p>
                          <p className="text-gray-400 text-right text-xs">{tl(k.birimKdvKurus)}</p>
                          <p className={`text-right text-xs font-semibold ${
                            k.tip === "giris" ? "text-[#22c55e]" : "text-[#ef4444]"
                          }`}>
                            {k.tip === "giris" ? "+" : "−"}{tl(k.toplamKdvKurus)}
                          </p>
                        </div>
                      ))}
                  </div>
                  {/* Footer: toplam */}
                  <div className="grid grid-cols-[1fr_80px_60px_80px_90px] gap-3 px-4 py-2.5 bg-gray-50 border-t border-gray-200 text-xs font-bold">
                    <span className="text-gray-500">{havuzKayitlari.length} kayıt</span>
                    <span />
                    <span />
                    <span className="text-right text-gray-500">Net:</span>
                    <span className={`text-right ${devreden ? "text-[#22c55e]" : "text-[var(--leaf)]"}`}>
                      {devreden ? `−${tl(Math.abs(netKdv))}` : tl(netKdv)}
                    </span>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
