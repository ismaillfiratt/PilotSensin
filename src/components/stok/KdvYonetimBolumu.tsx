"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Receipt } from "lucide-react";
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

  if (rol && rol !== "pilot") return null;

  const girdiKdv = toplamGirdiKdv(havuzKayitlari);
  const ciktiKdv = toplamCiktiKdv(havuzKayitlari);
  const netKdv   = netKdvBakiye(havuzKayitlari);
  const devreden = netKdv < 0;
  const havuzBos = havuzKayitlari.length === 0;

  const sekmeler: { key: Sekme; label: string; badge?: number }[] = [
    { key: "bakiye",  label: "Genel Bakiye",    badge: havuzKayitlari.length },
    { key: "gecmis",  label: "Hareket Geçmişi", badge: havuzKayitlari.length },
  ];

  return (
    <section className="py-2">
      <h2 className="text-sm font-semibold mb-4">KDV Yönetimi</h2>

      <div className="rounded-xl border border-black/8 bg-white overflow-hidden">
        {/* Sekmeler */}
        <div className="px-5 pt-4 pb-0 border-b border-black/5 flex gap-1">
          {sekmeler.map((s) => (
            <button
              key={s.key}
              onClick={() => setSekme(s.key)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-all border-b-2 -mb-px"
              style={{
                borderColor: sekme === s.key ? "var(--forest)" : "transparent",
                color:       sekme === s.key ? "var(--forest)" : "var(--text-secondary)",
              }}
            >
              {s.label}
              {s.badge !== undefined && s.badge > 0 && (
                <span className="text-[9px] opacity-60">{s.badge}</span>
              )}
            </button>
          ))}
        </div>

        <div className="p-5 space-y-5">
          <AnimatePresence mode="wait">
            {/* ─── SEKME 1: GENEL BAKİYE ─── */}
            {sekme === "bakiye" && (
              <motion.div
                key="bakiye"
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                {havuzBos ? (
                  <div className="py-10 text-center space-y-2">
                    <Receipt className="w-8 h-8 mx-auto text-gray-300" />
                    <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Henüz KDV hareketi yok</p>
                    <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                      Stok girişi veya çıkışı yaptığınızda KDV otomatik izlenir
                    </p>
                  </div>
                ) : (
                  <>
                    {/* 3 KDV stat kartı */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="stat-card">
                        <p className="label-caps mb-2">İndirilecek KDV</p>
                        <p className="font-number font-semibold text-xl text-[#0F172A]">{tlK(girdiKdv)}</p>
                        <p className="text-xs mt-1 font-medium" style={{ color: "var(--color-success)" }}>
                          {havuzKayitlari.filter((k) => k.tip === "giris").length} alış hareketi
                        </p>
                      </div>

                      <div className="stat-card">
                        <p className="label-caps mb-2">Hesaplanan KDV</p>
                        <p className="font-number font-semibold text-xl text-[#0F172A]">{tlK(ciktiKdv)}</p>
                        <p className="text-xs mt-1 font-medium" style={{ color: "var(--color-danger)" }}>
                          {havuzKayitlari.filter((k) => k.tip === "cikis").length} satış hareketi
                        </p>
                      </div>

                      <div className="stat-card">
                        <p className="label-caps mb-2">{devreden ? "Devreden KDV" : "Ödenecek KDV"}</p>
                        <p className="font-number font-semibold text-xl text-[#0F172A]">{tlK(Math.abs(netKdv))}</p>
                        <p className="text-xs mt-1 font-medium"
                          style={{ color: devreden ? "var(--color-success)" : "#F59E0B" }}>
                          {devreden ? "Sonraki döneme devir" : "Vergi dairesine öde"}
                        </p>
                      </div>
                    </div>

                    {/* Formül */}
                    <div className="flex items-center gap-2 px-1 text-xs flex-wrap">
                      <span className="font-number font-semibold" style={{ color: "var(--color-danger)" }}>{tlK(ciktiKdv)}</span>
                      <span style={{ color: "var(--text-secondary)" }}>Hesaplanan</span>
                      <span style={{ color: "var(--text-secondary)" }}>−</span>
                      <span className="font-number font-semibold" style={{ color: "var(--color-success)" }}>{tlK(girdiKdv)}</span>
                      <span style={{ color: "var(--text-secondary)" }}>İndirilecek</span>
                      <span style={{ color: "var(--text-secondary)" }}>=</span>
                      <span className="font-number font-bold" style={{ color: devreden ? "var(--color-success)" : "#F59E0B" }}>
                        {devreden ? `−${tlK(Math.abs(netKdv))}` : tlK(netKdv)}
                      </span>
                      <span style={{ color: devreden ? "var(--color-success)" : "#F59E0B" }}>
                        {devreden ? "Devreden" : "Ödenecek"}
                      </span>
                    </div>

                    {/* Sonuç banner */}
                    <div className="flex items-start gap-2.5 p-3.5 rounded-xl border border-black/8 bg-[#F9FAFB]">
                      <div>
                        <p className="text-sm font-semibold text-[#0F172A]">
                          {devreden
                            ? `Bu dönemde ödenecek KDV yok — devreden: ${tlK(Math.abs(netKdv))}`
                            : `Bu dönemde vergi dairesine ödenecek net KDV: ${tlK(netKdv)}`}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                          Veriler stok hareketi kaydedildiğinde otomatik güncellenir.
                          Ürüne maliyet girilmemişse o hareket izlenmez.
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {/* ─── SEKME 2: HAREKET GEÇMİŞİ ─── */}
            {sekme === "gecmis" && (
              <motion.div
                key="gecmis"
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}
                className="space-y-3"
              >
                {havuzKayitlari.length === 0 ? (
                  <div className="py-10 text-center space-y-2">
                    <Receipt className="w-8 h-8 mx-auto text-gray-300" />
                    <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Henüz KDV hareketi yok</p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-black/8 overflow-hidden">
                    <div className="grid grid-cols-[1fr_80px_60px_80px_90px] gap-3 px-4 py-2.5 bg-[#F9FAFB] text-[10px] font-semibold uppercase tracking-wider border-b border-black/5"
                      style={{ color: "var(--text-secondary)" }}>
                      <span>Ürün / Tarih</span>
                      <span>Hareket</span>
                      <span className="text-right">Adet</span>
                      <span className="text-right">Birim KDV</span>
                      <span className="text-right">Toplam KDV</span>
                    </div>
                    <div className="divide-y divide-black/4 max-h-80 overflow-y-auto">
                      {[...havuzKayitlari]
                        .sort((a, b) => new Date(b.tarih).getTime() - new Date(a.tarih).getTime())
                        .map((k) => (
                          <div key={k.id} className="grid grid-cols-[1fr_80px_60px_80px_90px] gap-3 px-4 py-3 items-center hover:bg-[#F9FAFB] transition-colors">
                            <div className="min-w-0">
                              <p className="text-xs text-[#0F172A] truncate">{k.urunAd}</p>
                              <p className="text-[10px]" style={{ color: "var(--text-secondary)" }}>{zaman(k.tarih)}</p>
                            </div>
                            <div>
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                                k.tip === "giris"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-[#C97676]/10 text-[#C97676]"
                              }`}>
                                {k.tip === "giris" ? "Alış" : "Satış"}
                              </span>
                            </div>
                            <p className="font-number text-right text-xs" style={{ color: "var(--text-secondary)" }}>{k.adet}</p>
                            <p className="font-number text-right text-xs" style={{ color: "var(--text-secondary)" }}>{tl(k.birimKdvKurus)}</p>
                            <p className={`font-number text-right text-xs font-semibold ${
                              k.tip === "giris" ? "text-emerald-600" : "text-[#C97676]"
                            }`}>
                              {k.tip === "giris" ? "+" : "−"}{tl(k.toplamKdvKurus)}
                            </p>
                          </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-[1fr_80px_60px_80px_90px] gap-3 px-4 py-2.5 bg-[#F9FAFB] border-t border-black/5 text-xs font-semibold">
                      <span style={{ color: "var(--text-secondary)" }}>{havuzKayitlari.length} kayıt</span>
                      <span /><span />
                      <span className="text-right" style={{ color: "var(--text-secondary)" }}>Net:</span>
                      <span className={`font-number text-right ${devreden ? "text-emerald-600" : "text-[#F59E0B]"}`}>
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
    </section>
  );
}
