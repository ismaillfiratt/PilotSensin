"use client";

import { useState }            from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowDownCircle, ArrowUpCircle, RefreshCw, Clock, AlertTriangle } from "lucide-react";
import { type Urun, type StokHareketi } from "@/lib/stok-data";
import { alimYap, stokDuzelt } from "@/lib/islemler";
import { kurus } from "@/lib/para";

interface Props {
  urun:    Urun | null;
  onClose: () => void;
}

const tipler = [
  { value: "giris", label: "Stok Girişi",      icon: ArrowDownCircle, color: "#22c55e",  aciklama: "Tedarikten gelen ürün — maliyet ve nakit güncellenir" },
  { value: "cikis", label: "Stok Çıkışı",       icon: ArrowUpCircle,   color: "#ef4444",  aciklama: "Fire, hasar, iç tüketim — sadece stok düzeltme" },
  { value: "sayim", label: "Sayım Düzeltmesi",  icon: RefreshCw,       color: "var(--leaf)",  aciklama: "Fiziksel sayım sonucu fiili miktara göre düzelt" },
] as const;

const KDV_ORANLARI = [0, 1, 10, 20];

function zaman(iso: string) {
  return new Date(iso).toLocaleString("tr-TR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function HareketiModal({ urun, onClose }: Props) {
  const varsayilanFiyat = urun?.birimMaliyetKurus ? String(urun.birimMaliyetKurus / 100) : "";

  const [tip,        setTip]        = useState<"giris" | "cikis" | "sayim">("giris");
  const [miktar,     setMiktar]     = useState("");
  const [birimFiyat, setBirimFiyat] = useState(varsayilanFiyat);
  const [kdvOrani,   setKdvOrani]   = useState(20);
  const [aciklama,   setAciklama]   = useState("");
  const [sekme,      setSekme]      = useState<"yeni" | "log">("yeni");
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata,       setHata]       = useState<string | null>(null);

  if (!urun) return null;

  const m        = Number(miktar)     || 0;
  const fiyat    = Number(birimFiyat) || 0;
  const yeniAdet = tip === "giris" ? urun.mevcutAdet + m
                 : tip === "cikis" ? Math.max(0, urun.mevcutAdet - m)
                 : m;

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!m || m < 0) return;
    setYukleniyor(true);
    setHata(null);

    let sonuc: Awaited<ReturnType<typeof alimYap | typeof stokDuzelt>>;

    if (tip === "giris") {
      sonuc = await alimYap({
        urunId:          urun.id,
        adet:            m,
        birimAlisFiyatiKurus: kurus(fiyat),
        kdvOrani:        kdvOrani / 100,
        odemeYontemi:    "havale",
        aciklama:        aciklama.trim() || `${urun.ad} — ${m} ${urun.birim} alımı`,
      });
    } else {
      sonuc = await stokDuzelt({
        urunId:   urun.id,
        yeniAdet,
        sebep:    tip === "sayim" ? "sayim-farki" : "diger",
        aciklama: aciklama.trim() || undefined,
      });
    }

    setYukleniyor(false);

    if (sonuc.basarili) {
      setMiktar(""); setAciklama("");
      onClose();
    } else {
      setHata(sonuc.hata ?? "Bilinmeyen hata");
    }
  };

  const hareketler = urun.hareketler;
  const tipKonfig  = tipler.find((t) => t.value === tip)!;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-md card rounded-2xl overflow-hidden"
        >
          {/* Başlık */}
          <div className="flex items-start justify-between px-6 pt-6 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white">Stok Hareketi</h2>
              <p className="text-sm text-gray-400 mt-0.5">
                {urun.ad} — Mevcut: <span className="text-white font-medium">{urun.mevcutAdet} {urun.birim}</span>
              </p>
            </div>
            <button onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-50 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Sekmeler */}
          <div className="flex border-b border-gray-200 px-6">
            {(["yeni", "log"] as const).map((s) => (
              <button key={s} onClick={() => setSekme(s)}
                className="pb-3 pr-5 text-sm font-medium border-b-2 transition-colors"
                style={sekme === s
                  ? { borderColor: "var(--leaf)", color: "var(--leaf)" }
                  : { borderColor: "transparent", color: "#64748b" }}>
                {s === "yeni" ? "Yeni Hareket" : `Geçmiş (${hareketler.length})`}
              </button>
            ))}
          </div>

          <div className="p-6">
            {sekme === "yeni" ? (
              <form onSubmit={handleSubmit} className="space-y-4">

                {/* Hareket tipi */}
                <div className="grid grid-cols-3 gap-2">
                  {tipler.map(({ value, label, icon: Icon, color }) => (
                    <button key={value} type="button" onClick={() => setTip(value)}
                      className="flex flex-col items-center gap-2 p-3 rounded-xl border transition-all"
                      style={{
                        borderColor:     tip === value ? color : "rgba(255,255,255,0.08)",
                        backgroundColor: tip === value ? `${color}15` : "transparent",
                      }}>
                      <Icon className="w-5 h-5" style={{ color: tip === value ? color : "#94a3b8" }} />
                      <span className="text-[11px] text-center leading-tight"
                        style={{ color: tip === value ? color : "#94a3b8" }}>{label}</span>
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-gray-500 -mt-1">{tipKonfig.aciklama}</p>

                {/* Miktar */}
                <div>
                  <label className="text-xs text-gray-400 font-medium block mb-1.5">
                    {tip === "sayim" ? "Gerçek Sayım Miktarı" : "Miktar"} ({urun.birim})
                  </label>
                  <input
                    type="number" min="0" required
                    value={miktar} onChange={(e) => setMiktar(e.target.value)}
                    placeholder="0"
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-white placeholder-[#94a3b8] focus:outline-none focus:border-[var(--leaf)] text-lg font-bold [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  {m > 0 && (
                    <p className="text-xs text-[var(--leaf)] mt-1.5">
                      {tip === "giris" && `${urun.mevcutAdet} + ${m} = ${yeniAdet} ${urun.birim}`}
                      {tip === "cikis" && `${urun.mevcutAdet} − ${m} = ${yeniAdet} ${urun.birim}`}
                      {tip === "sayim" && `Fark: ${yeniAdet >= urun.mevcutAdet ? "+" : ""}${yeniAdet - urun.mevcutAdet} ${urun.birim}`}
                    </p>
                  )}
                </div>

                {/* Birim fiyat + KDV — sadece giris */}
                {tip === "giris" && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-400 font-medium block mb-1.5">
                        Birim Alış Fiyatı (KDV hariç) *
                      </label>
                      <input
                        type="number" min="0" step="0.01" required
                        value={birimFiyat} onChange={(e) => setBirimFiyat(e.target.value)}
                        placeholder="0.00"
                        className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-white focus:outline-none focus:border-[rgba(34,197,94,0.5)] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 font-medium block mb-1.5">Alış KDV Oranı</label>
                      <div className="flex gap-2">
                        {KDV_ORANLARI.map((r) => (
                          <button key={r} type="button" onClick={() => setKdvOrani(r)}
                            className="flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all"
                            style={{
                              borderColor:     kdvOrani === r ? "#22c55e" : "rgba(255,255,255,0.08)",
                              backgroundColor: kdvOrani === r ? "rgba(34,197,94,0.12)" : "transparent",
                              color:           kdvOrani === r ? "#22c55e" : "#64748b",
                            }}>
                            {r === 0 ? "Yok" : `%${r}`}
                          </button>
                        ))}
                      </div>
                    </div>
                    {m > 0 && fiyat > 0 && (
                      <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs space-y-1 text-gray-500">
                        <div className="flex justify-between">
                          <span>Toplam (KDV hariç)</span>
                          <span className="text-white">
                            {(m * fiyat).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>KDV (%{kdvOrani})</span>
                          <span className="text-[var(--leaf)]">
                            {(m * fiyat * kdvOrani / 100).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
                          </span>
                        </div>
                        <div className="flex justify-between font-semibold border-t border-gray-200 pt-1">
                          <span>Kasadan Çıkış</span>
                          <span className="text-[#ef4444]">
                            {(m * fiyat * (1 + kdvOrani / 100)).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Açıklama */}
                <div>
                  <label className="text-xs text-gray-400 font-medium block mb-1.5">
                    Açıklama (opsiyonel)
                  </label>
                  <input
                    type="text" value={aciklama} onChange={(e) => setAciklama(e.target.value)}
                    placeholder="Tedarikçi, fire sebebi..."
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-white placeholder-[#94a3b8] focus:outline-none focus:border-[var(--leaf)] text-sm"
                  />
                </div>

                {/* Hata */}
                {hata && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)]">
                    <AlertTriangle className="w-4 h-4 text-[#ef4444] shrink-0" />
                    <p className="text-xs text-[#ef4444]">{hata}</p>
                  </div>
                )}

                {/* Butonlar */}
                <div className="flex gap-3">
                  <button type="button" onClick={onClose}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-400 text-sm font-medium hover:bg-gray-50 transition-colors">
                    İptal
                  </button>
                  <button type="submit" disabled={yukleniyor}
                    className="flex-1 py-2.5 rounded-xl bg-[var(--forest)] text-white text-sm font-bold hover:opacity-90 transition-colors disabled:opacity-50">
                    {yukleniyor ? "Kaydediliyor..." : "Kaydet"}
                  </button>
                </div>
              </form>
            ) : (
              /* Geçmiş sekmesi */
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {hareketler.length === 0 ? (
                  <div className="text-center py-8 text-sm text-gray-500">
                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    Henüz hareket kaydı yok
                  </div>
                ) : hareketler.map((h: StokHareketi) => {
                  const renk = h.tip === "giris" ? "#22c55e" : h.tip === "cikis" ? "#ef4444" : "var(--leaf)";
                  return (
                    <div key={h.id} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200">
                      <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: renk }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold" style={{ color: renk }}>
                            {h.tip === "giris" ? "+" : h.tip === "cikis" ? "−" : "="}{h.miktar} {urun.birim}
                          </span>
                          <span className="text-[10px] text-gray-500">{h.onceki} → {h.sonraki}</span>
                        </div>
                        <p className="text-xs text-gray-400 truncate mt-0.5">{h.aciklama}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">{h.kimin} · {zaman(h.tarih)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
