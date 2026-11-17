"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { X, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PieChart, Pie, Cell, Tooltip as ReTooltip, ResponsiveContainer } from "recharts";
import { useStok } from "@/store/stok";
import { useUrunMarjAnalizi } from "@/store/urunMarjAnalizi";
import { urunMarjHesapla } from "@/lib/selectors/urun-marj";
import type { GiderTipi, YuzdeBase } from "@/lib/urun-marj-data";

const PIE_COLORS = [
  "#0F3D2E", "#E07A5F", "#3D5A80", "#E9C46A",
  "#C77DFF", "#F4845F", "#06D6A0", "#EF476F",
  "#118AB2", "#073B4C", "#8338EC", "#FB5607",
];

const tl = (n: number) =>
  n.toLocaleString("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 2 });

function PieTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { fill: string } }> }) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-white border border-black/8 rounded-xl px-3 py-2 text-xs shadow-sm">
      <p className="font-semibold text-[#0F172A]">{d.name}</p>
      <p style={{ color: d.payload.fill }}>{tl(d.value)}</p>
    </div>
  );
}

const COLS = "grid-cols-[28px_minmax(120px,1fr)_48px_48px_58px_42px_56px_20px]";

const INPUT_CLS = "px-2 py-1.5 rounded-lg text-xs text-[#0F172A] border border-black/10 bg-white focus:outline-none focus:border-[var(--forest)]";

interface Props {
  urunId: string;
  onClose: () => void;
}

export default function UrunMarjDetayPanel({ urunId, onClose }: Props) {
  const { urunler, guncelle: stokGuncelle } = useStok();
  const { kayitlar, ekleAsBoss, giderEkle, giderGuncelle, giderSil, hedefMarjAyarla } = useUrunMarjAnalizi();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Eski ürünler için kayıt yoksa oluştur — "+Ekle" butonunun çalışması için şart
  useEffect(() => { ekleAsBoss(urunId); }, [urunId, ekleAsBoss]);

  const urun  = urunler.find((u) => u.id === urunId);
  const kayit = kayitlar.find((k) => k.urunId === urunId);

  const hesap = useMemo(
    () => urun ? urunMarjHesapla(urun, kayit) : null,
    [urun, kayit]
  );

  // Hedef marj
  const hedefDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hedefInput, setHedefInput] = useState<string>(
    kayit?.hedefMarjYuzde != null ? String(kayit.hedefMarjYuzde) : ""
  );
  useEffect(() => {
    setHedefInput(kayit?.hedefMarjYuzde != null ? String(kayit.hedefMarjYuzde) : "");
  }, [kayit?.hedefMarjYuzde]);

  // Fiyat düzenleme (stok'a yazar)
  const fiyatDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [alisStr,  setAlisStr]  = useState(() => urun?.birimMaliyetKurus    != null ? String(urun.birimMaliyetKurus    / 100) : "");
  const [satisStr, setSatisStr] = useState(() => urun?.birimSatisFiyatiKurus != null ? String(urun.birimSatisFiyatiKurus / 100) : "");
  useEffect(() => {
    setAlisStr(urun?.birimMaliyetKurus    != null ? String(urun.birimMaliyetKurus    / 100) : "");
    setSatisStr(urun?.birimSatisFiyatiKurus != null ? String(urun.birimSatisFiyatiKurus / 100) : "");
  }, [urun?.birimMaliyetKurus, urun?.birimSatisFiyatiKurus]);

  const handleFiyat = useCallback((
    alan: "birimMaliyetKurus" | "birimSatisFiyatiKurus",
    v: string,
    setStr: (s: string) => void,
  ) => {
    if (!/^[0-9]*[.,]?[0-9]*$/.test(v)) return;
    setStr(v);
    if (fiyatDebounce.current) clearTimeout(fiyatDebounce.current);
    fiyatDebounce.current = setTimeout(() => {
      const n = parseFloat(v.replace(",", "."));
      if (!isNaN(n) && n >= 0) stokGuncelle(urunId, { [alan]: Math.round(n * 100) });
    }, 600);
  }, [urunId, stokGuncelle]);

  const handleHedefChange = useCallback((v: string) => {
    setHedefInput(v);
    if (hedefDebounce.current) clearTimeout(hedefDebounce.current);
    hedefDebounce.current = setTimeout(() => {
      const n = parseFloat(v);
      hedefMarjAyarla(urunId, isNaN(n) || v.trim() === "" ? null : Math.max(0, Math.min(100, n)));
    }, 600);
  }, [urunId, hedefMarjAyarla]);

  const handleGiderTutar = useCallback((giderId: string, v: string) => {
    const n = parseFloat(v.replace(",", "."));
    if (!isNaN(n)) giderGuncelle(urunId, giderId, { tutar: Math.max(0, n) });
  }, [urunId, giderGuncelle]);

  const handleKdvOrani = useCallback((giderId: string, v: string) => {
    if (!/^[0-9]*$/.test(v)) return;
    const n = parseInt(v, 10);
    giderGuncelle(urunId, giderId, { kdvOrani: isNaN(n) ? 0 : Math.min(100, n) });
  }, [urunId, giderGuncelle]);

  if (!urun || !hesap) return null;

  const alisFiyati = urun.birimMaliyetKurus != null ? urun.birimMaliyetKurus / 100 : 0;
  const pieData    = hesap.directGiderler.map((g) => ({ name: g.ad, value: g.brut }));

  const durumRenk = hesap.durumu === "kar" ? "var(--color-success)"
    : hesap.durumu === "alarm" ? "#F59E0B"
    : hesap.durumu === "zarar" ? "var(--color-danger)"
    : "var(--text-secondary)";
  const durumEtiket = { kar: "Kârlı", zarar: "Zarar", basabas: "Başabaş", alarm: "Hedef altı" }[hesap.durumu];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
        {/* Overlay */}
        <motion.div
          className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        />

        {/* Panel — max-w-xl (576px), slides from right */}
        <motion.div
          className="relative w-full max-w-xl bg-white shadow-2xl flex flex-col h-full overflow-hidden"
          initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 280 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-black/8 shrink-0">
            <div>
              <p className="label-caps">ÜRÜN MARJ ANALİZİ</p>
              <h3 className="text-sm font-semibold text-[#0F172A] mt-0.5 truncate max-w-[400px]">{urun.ad}</h3>
            </div>
            <button onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-[#F3F4F6] transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">

            {/* Fiyat bilgisi — düzenlenebilir */}
            <div className="rounded-xl bg-[#F9FAFB] border border-black/5 p-4 space-y-2">
              <p className="label-caps">Fiyatlar</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Alış fiyatı (₺)</p>
                  <input
                    type="text" inputMode="decimal"
                    value={alisStr}
                    onChange={(e) => handleFiyat("birimMaliyetKurus", e.target.value, setAlisStr)}
                    placeholder="0.00"
                    className="w-full px-2.5 py-1.5 rounded-lg text-sm font-number font-semibold text-[#0F172A] border border-black/10 bg-white focus:outline-none focus:border-[var(--forest)]"
                  />
                  {urun.alisKdvOrani != null && (
                    <p className="text-[10px] text-gray-400 mt-1">
                      KDV %{urun.alisKdvOrani} {urun.alisKdvDahilHaric ?? "dahil"}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Satış fiyatı (₺)</p>
                  <input
                    type="text" inputMode="decimal"
                    value={satisStr}
                    onChange={(e) => handleFiyat("birimSatisFiyatiKurus", e.target.value, setSatisStr)}
                    placeholder="0.00"
                    className="w-full px-2.5 py-1.5 rounded-lg text-sm font-number font-semibold text-[#0F172A] border border-black/10 bg-white focus:outline-none focus:border-[var(--forest)]"
                  />
                  {urun.satisKdvOrani != null && (
                    <p className="text-[10px] text-gray-400 mt-1">
                      KDV %{urun.satisKdvOrani} {urun.satisKdvDahilHaric ?? "dahil"}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Giderler */}
            <div>
              {/* Başlık + Ekle */}
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-semibold tracking-wider text-[#6B7280]">
                  GİDERLER
                </p>
                <button
                  onClick={() => giderEkle(urunId, {
                    ad: "Yeni gider", tutar: 0, tip: "sabit",
                    kdvDahilHaric: "dahil", kdvOrani: 20, kdvIndirilebilir: true,
                    aktif: true, yuzdeBase: "satis",
                  })}
                  className="text-[11px] font-medium px-2.5 py-1 rounded-md bg-[#0F3D2E] text-white hover:opacity-90 transition-opacity">
                  + Ekle
                </button>
              </div>

              {/* Kolon başlıkları */}
              <div className={`grid ${COLS} gap-2 px-2 pb-2 border-b border-black/8`}>
                <div />
                <span className="text-[9px] font-semibold tracking-wider text-[#9CA3AF]">GİDER ADI</span>
                <span className="text-[9px] font-semibold tracking-wider text-[#9CA3AF] text-center">KDV</span>
                <span className="text-[9px] font-semibold tracking-wider text-[#9CA3AF] text-center">ORANI</span>
                <span className="text-[9px] font-semibold tracking-wider text-[#9CA3AF] text-center">TUTAR</span>
                <span className="text-[9px] font-semibold tracking-wider text-[#9CA3AF] text-center">TİP</span>
                <span className="text-[9px] font-semibold tracking-wider text-[#9CA3AF] text-center">BAZ</span>
                <div />
              </div>

              {/* Gider satırları — sabit (₺) önce, yüzde (%) sonra */}
              <div className="overflow-x-auto">
                {(kayit?.giderler ?? []).length === 0 ? (
                  <p className="text-xs text-gray-400 py-3 px-2">Henüz gider yok.</p>
                ) : (
                  [...(kayit?.giderler ?? [])]
                    .sort((a, b) => {
                      // 1. ₺ (sabit) önce, % (yuzde) sonra
                      if (a.tip !== b.tip) return a.tip === "sabit" ? -1 : 1;
                      // 2. Sabit içinde: Kargo → Paketleme → diğerleri
                      const ONCELIK: Record<string, number> = { kargo: 0, paketleme: 1 };
                      const aO = ONCELIK[a.ad.toLowerCase()] ?? 2;
                      const bO = ONCELIK[b.ad.toLowerCase()] ?? 2;
                      return aO - bO;
                    })
                    .map((g) => {
                    const isMal = g.kaynak === "stok-maliyet";
                    return (
                      <div
                        key={g.id}
                        className={`grid ${COLS} gap-2 px-2 py-2 items-center border-b border-black/4 transition-opacity ${!g.aktif ? "opacity-50" : ""}`}
                      >
                        {/* 1) Aktif pill toggle */}
                        <button
                          onClick={() => giderGuncelle(urunId, g.id, { aktif: !g.aktif })}
                          className={`w-7 h-4 rounded-full transition-colors relative shrink-0 ${g.aktif ? "bg-[#0F3D2E]" : "bg-gray-200"}`}
                          title={g.aktif ? "Devre dışı bırak" : "Etkinleştir"}
                        >
                          <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-all ${g.aktif ? "left-3.5" : "left-0.5"}`} />
                        </button>

                        {/* 2) Ad */}
                        <input
                          value={g.ad}
                          onChange={(e) => giderGuncelle(urunId, g.id, { ad: e.target.value })}
                          readOnly={isMal}
                          className="bg-transparent text-sm font-medium text-[#111827] px-0 border-0 outline-none focus:bg-black/3 focus:px-1 rounded transition-all w-full min-w-0 truncate"
                        />

                        {/* 3) KDV D/H */}
                        {isMal ? (
                          <div className="h-[22px] flex items-center justify-center gap-1 rounded-md border border-dashed border-black/10 bg-[#F9FAFB]">
                            <Lock className="w-2.5 h-2.5 text-gray-300 shrink-0" />
                            <span className="text-[9px] text-gray-300 font-medium">
                              {urun.alisKdvDahilHaric !== "haric" ? "D" : "H"}
                            </span>
                          </div>
                        ) : (
                          <div className="flex bg-[#F3F4F6] rounded-md p-0.5 h-[22px]">
                            <button
                              onClick={() => giderGuncelle(urunId, g.id, { kdvDahilHaric: "dahil" })}
                              className={`flex-1 text-[10px] font-semibold rounded transition-colors ${g.kdvDahilHaric === "dahil" ? "bg-[#0F3D2E] text-white" : "text-[#9CA3AF] hover:text-gray-600"}`}
                            >D</button>
                            <button
                              onClick={() => giderGuncelle(urunId, g.id, { kdvDahilHaric: "haric" })}
                              className={`flex-1 text-[10px] font-semibold rounded transition-colors ${g.kdvDahilHaric === "haric" ? "bg-[#0F3D2E] text-white" : "text-[#9CA3AF] hover:text-gray-600"}`}
                            >H</button>
                          </div>
                        )}

                        {/* 4) KDV oranı */}
                        {isMal ? (
                          <div className="h-[22px] flex items-center justify-center border border-black/5 rounded-md bg-[#F9FAFB]">
                            <span className="text-[10px] font-mono text-gray-300">
                              {urun.alisKdvOrani != null ? `%${urun.alisKdvOrani}` : "—"}
                            </span>
                          </div>
                        ) : (
                          <div className="relative">
                            <input
                              type="text" inputMode="decimal"
                              defaultValue={g.kdvOrani}
                              key={`${g.id}-kdvO`}
                              onChange={(e) => handleKdvOrani(g.id, e.target.value)}
                              className="w-full h-[22px] px-2 pr-5 text-center text-[11px] font-mono font-medium border border-black/10 rounded-md focus:border-[#0F3D2E] focus:outline-none"
                            />
                            <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-[#9CA3AF] pointer-events-none">%</span>
                          </div>
                        )}

                        {/* 5) Tutar */}
                        <input
                          type="text" inputMode="decimal"
                          defaultValue={g.tutar}
                          key={`${g.id}-tutar`}
                          onChange={(e) => { const v = e.target.value; if (/^[0-9]*[.,]?[0-9]*$/.test(v)) handleGiderTutar(g.id, v); }}
                          className="h-[22px] w-full px-2 text-center text-[11px] font-mono font-medium border border-black/10 rounded-md focus:border-[#0F3D2E] focus:outline-none"
                        />

                        {/* 6) Tip */}
                        <select
                          value={g.tip}
                          onChange={(e) => giderGuncelle(urunId, g.id, { tip: e.target.value as GiderTipi })}
                          className="h-[22px] px-1.5 text-center text-[10px] font-medium border border-black/10 rounded-md bg-white focus:border-[#0F3D2E] focus:outline-none"
                        >
                          <option value="yuzde">%</option>
                          <option value="sabit">₺</option>
                        </select>

                        {/* 7) Baz (sadece % tipinde aktif) */}
                        {g.tip === "yuzde" ? (
                          <select
                            value={g.yuzdeBase ?? "satis"}
                            onChange={(e) => giderGuncelle(urunId, g.id, { yuzdeBase: e.target.value as YuzdeBase })}
                            className="h-[22px] px-1.5 text-[10px] border border-black/10 rounded-md bg-white focus:border-[#0F3D2E] focus:outline-none"
                          >
                            <option value="satis">Satış</option>
                            <option value="alis">Alış</option>
                            <option value="ozel">Özel</option>
                          </select>
                        ) : (
                          <div className="h-[22px] flex items-center justify-center border border-black/5 rounded-md bg-[#F9FAFB]">
                            <span className="text-[#D1D5DB] text-[11px]">—</span>
                          </div>
                        )}

                        {/* 8) Sil */}
                        <button
                          onClick={() => giderSil(urunId, g.id)}
                          className="text-[#9CA3AF] hover:text-[#C97676] transition-colors flex justify-center"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Alt açıklama notu */}
              <p className="text-[10px] text-[#9CA3AF] mt-3 px-2">
                <span className="font-semibold text-[#6B7280]">D</span> = KDV dahil tutar
                {" · "}
                <span className="font-semibold text-[#6B7280]">H</span> = KDV hariç tutar
                {" · "}
                Sol toggle satırı aktifleştirir
              </p>
            </div>

            {/* Hedef marj */}
            <div className="space-y-1.5">
              <p className="label-caps">Hedef Marj</p>
              <div className="flex items-center gap-2">
                <input
                  type="text" inputMode="decimal"
                  value={hedefInput}
                  onChange={(e) => { const v = e.target.value; if (/^[0-9]*[.,]?[0-9]*$/.test(v)) handleHedefChange(v); }}
                  placeholder="25"
                  className={`${INPUT_CLS} w-20`}
                />
                <span className="text-sm text-gray-400">% hedef marj</span>
                {hedefInput && (
                  <button onClick={() => { setHedefInput(""); hedefMarjAyarla(urunId, null); }}
                    className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Temizle</button>
                )}
              </div>
            </div>

            {/* Özet */}
            <div className="rounded-xl border border-black/8 bg-white p-4 space-y-2">
              <p className="label-caps">Özet</p>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Satış (KDV dahil)</span>
                  <span className="font-number font-medium text-[#0F172A]">{tl(hesap.satisFiyati)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Satış net (KDV hariç)</span>
                  <span className="font-number text-gray-400">{tl(hesap.satisNet)}</span>
                </div>
                <div className="h-px bg-black/5 my-1" />
                {/* Mal maliyeti — stoktan, listede görünmez */}
                <div className="flex justify-between items-baseline">
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-500">Mal maliyeti (net)</span>
                    <span className="text-[10px] text-gray-300">Stok'tan</span>
                  </div>
                  <span className="font-number text-[#C97676]">−{tl(hesap.malMaliyetiNet)}</span>
                </div>
                {/* Ek giderler toplamı */}
                {hesap.directGiderler.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Ek giderler</span>
                    <span className="font-number text-[#C97676]">
                      −{tl(hesap.directGiderler.reduce((t, d) => t + d.net, 0))}
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-medium">
                  <span className="text-gray-700">Toplam direct net</span>
                  <span className="font-number text-[#C97676]">−{tl(hesap.toplamDirectNet)}</span>
                </div>
                {hesap.toplamIndirilebilirKdv > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">KDV indirimi</span>
                    <span className="font-number text-emerald-600">+{tl(hesap.toplamIndirilebilirKdv)}</span>
                  </div>
                )}
                <div className="h-px bg-black/8" />
                <div className="flex justify-between font-semibold">
                  <span style={{ color: durumRenk }}>Brüt kâr</span>
                  <span className="font-number" style={{ color: durumRenk }}>
                    {hesap.birimBrutKar >= 0 ? "+" : ""}{tl(hesap.birimBrutKar)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Brüt marj</span>
                  <span className="font-number font-semibold" style={{ color: durumRenk }}>
                    %{hesap.birimBrutMarj.toFixed(1)}
                  </span>
                </div>
                {hesap.hedefMarjYuzde != null && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Hedef</span>
                    <span className="font-number text-gray-500">%{hesap.hedefMarjYuzde}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Durum</span>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{ color: durumRenk, background: `${durumRenk}15` }}>
                    {durumEtiket}
                  </span>
                </div>
              </div>
            </div>

            {/* Maliyet kırılımı pie */}
            {hesap.satisFiyati > 0 && pieData.length > 0 && (
              <div className="space-y-2">
                <p className="label-caps">Maliyet Kırılımı</p>
                <div className="rounded-xl border border-black/8 bg-white p-4">
                  {mounted ? (
                    <div style={{ height: 200 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={pieData} dataKey="value" nameKey="name"
                            cx="50%" cy="50%" outerRadius={80} innerRadius={45}
                            paddingAngle={2} stroke="none">
                            {pieData.map((_, i) => (
                              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <ReTooltip content={<PieTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-[200px] rounded-full bg-gray-100 animate-pulse mx-auto w-[200px]" />
                  )}
                  <div className="mt-3 space-y-1.5">
                    {hesap.directGiderler.map((g, i) => {
                      const renk = PIE_COLORS[i % PIE_COLORS.length];
                      const pct  = hesap.satisFiyati > 0 ? (g.brut / hesap.satisFiyati) * 100 : 0;
                      return (
                        <div key={g.id} className="flex items-center gap-2 text-xs">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: renk }} />
                          <span className="flex-1 text-gray-500 truncate">{g.ad}</span>
                          <span className="font-number font-medium text-[#0F172A]">{tl(g.brut)}</span>
                          <span className="font-number text-gray-400 w-9 text-right">%{pct.toFixed(1)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
