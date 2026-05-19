"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  PieChart, Pie, Cell, Tooltip as ReTooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  TrendingUp, TrendingDown, DollarSign, Target, Percent,
  Plus, Trash2, Pencil, Check, X, CalendarRange, ChevronDown, ChevronUp,
} from "lucide-react";
import { useSatislar } from "@/store/satislar";
import { useIsletmeGiderleri } from "@/store/isletmeGiderleri";
import { useSirket } from "@/store/sirket";
import { kurus } from "@/lib/para";
import { plTablosu } from "@/lib/selectors/pl";
import { onaylaSil } from "@/lib/onay";
import { useGeriAl } from "@/store/geriAl";
import dynamic from "next/dynamic";
const SatisGecmisi    = dynamic(() => import("@/components/kar-zarar/SatisGecmisi"),    { ssr: false });
const MarjGrafik      = dynamic(() => import("@/components/kar-zarar/MarjGrafik"),      { ssr: false });
const UrunMarjTablosu = dynamic(() => import("@/components/kar-zarar/UrunMarjTablosu"), { ssr: false });

const tl = (n: number) =>
  (n / 100).toLocaleString("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 });
const tlx = (n: number) =>
  (n / 100).toLocaleString("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 2 });

function yerelTarih(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function bugunIso() { return yerelTarih(new Date()); }
function ayBasiIso() { const d = new Date(); d.setDate(1); return yerelTarih(d); }

const PIE_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4",
  "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6", "#f43f5e",
];

/* ─── Özel Tooltip (Pie) ─── */
function PieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="card rounded-xl px-3 py-2 text-xs">
      <p className="text-gray-800 font-semibold">{d.name}</p>
      <p style={{ color: d.payload.fill }}>{tlx(d.value)}</p>
    </div>
  );
}

/* ─── P&L satır bileşeni ─── */
function PLSatir({
  label, deger, renk, bold, indent, bg, yuzde, separator,
}: {
  label: string; deger: number; renk?: string; bold?: boolean;
  indent?: boolean; bg?: string; yuzde?: number; separator?: boolean;
}) {
  return (
    <>
      {separator && <div className="h-px bg-gray-50 mx-5 my-0.5" />}
      <div
        className={`flex items-center justify-between px-5 py-2.5 rounded-lg transition-colors ${indent ? "ml-2" : ""}`}
        style={{ backgroundColor: bg }}
      >
        <span className={`text-sm ${bold ? "font-bold text-gray-800" : "text-gray-400"}`}>
          {indent && <span className="mr-2 text-gray-500">–</span>}
          {label}
        </span>
        <div className="flex items-center gap-3">
          {yuzde !== undefined && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-50 text-gray-500">
              %{yuzde.toFixed(1)}
            </span>
          )}
          <span
            className={`text-sm ${bold ? "font-bold" : "font-medium"} tabular-nums`}
            style={{ color: renk ?? (bold ? "#fff" : "#94a3b8") }}
          >
            {tlx(deger)}
          </span>
        </div>
      </div>
    </>
  );
}

export default function KarZararPage() {
  const router    = useRouter();
  const { rol, yuklendi } = useSirket();

  /* RBAC */
  useEffect(() => {
    if (yuklendi && rol !== "pilot") router.replace("/");
  }, [yuklendi, rol, router]);

  const { kayitlar }   = useSatislar();
  const { giderler, ekle: giderEkle, guncelle: giderGuncelle, sil: giderSil } = useIsletmeGiderleri();

  /* ─── Tarih aralığı ─── */
  const [baslangic, setBaslangic] = useState(ayBasiIso);
  const [bitis,     setBitis]     = useState(bugunIso);
  const [tarihAcik, setTarihAcik] = useState(false);

  /* ─── Gider formu ─── */
  const [yeniKategori, setYeniKategori] = useState("");
  const [yeniTutar,    setYeniTutar]    = useState("");
  const [duzenleId,    setDuzenleId]    = useState<string | null>(null);
  const [duzenleAd,    setDuzenleAd]    = useState("");
  const [duzenleTutar, setDuzenleTutar] = useState("");
  const [giderAcik,    setGiderAcik]    = useState(false);

  /* ─── Hesaplamalar (plTablosu selector'ından) ─── */
  const pl = useMemo(
    () => plTablosu(kayitlar, giderler, baslangic, bitis),
    [kayitlar, giderler, baslangic, bitis]
  );
  const satisHasilati = pl.ciroKurus;
  const smm           = pl.smmKurus;
  const brutKarKurus       = pl.brutKarKurus;
  const brutMarj      = pl.brutMarj;
  const toplamGider   = pl.toplamGiderKurus;
  const netKar        = pl.netKarKurus;
  const netMarj       = pl.netMarj;
  const basaBazCiro   = pl.basaBazCiroKurus;

  /* Pie chart verisi */
  const pieData = useMemo(() => {
    const veri: { name: string; value: number }[] = [];
    if (smm > 0) veri.push({ name: "SMM (Mal Maliyeti)", value: smm });
    giderler.forEach((g) => {
      if (g.tutarKurus > 0) veri.push({ name: g.kategori, value: g.tutarKurus });
    });
    return veri;
  }, [smm, giderler]);

  /* Tarih filtresi aktif mi */
  const tarihFiltreAktif = baslangic !== ayBasiIso() || bitis !== bugunIso();

  /* Hızlı tarih kısayolları */
  const kisayollar = [
    { label: "Bugün",    fn: () => { const t = bugunIso(); setBaslangic(t); setBitis(t); } },
    { label: "Bu Ay",    fn: () => { setBaslangic(ayBasiIso()); setBitis(bugunIso()); } },
    { label: "Son 7 Gün", fn: () => { const d = new Date(); d.setDate(d.getDate() - 7); setBaslangic(yerelTarih(d)); setBitis(bugunIso()); } },
    { label: "Son 30 Gün", fn: () => { const d = new Date(); d.setDate(d.getDate() - 30); setBaslangic(yerelTarih(d)); setBitis(bugunIso()); } },
  ];

  /* Gider ekleme */
  const handleGiderEkle = () => {
    const tutar = Number(yeniTutar);
    if (!yeniKategori.trim() || !tutar || tutar <= 0) return;
    giderEkle({ kategori: yeniKategori.trim(), tutarKurus: kurus(tutar) });
    setYeniKategori(""); setYeniTutar("");
  };

  /* Gider silme */
  const handleGiderSil = async (g: { id: string; kategori: string }) => {
    const { onaylandi } = await onaylaSil({ tip: "isletmeGideri", isim: g.kategori });
    if (!onaylandi) return;
    await giderSil(g.id);
    useGeriAl.getState().goster({
      mesaj: `"${g.kategori}" gideri silindi.`,
      sureMs: 10000,
      geriAlFn: async () => useIsletmeGiderleri.getState().geriAl(g.id),
    });
  };

  /* Gider düzenleme kaydet */
  const handleGiderKaydet = () => {
    if (!duzenleId) return;
    const tutar = Number(duzenleTutar);
    if (tutar <= 0) return;
    const upd: Parameters<typeof giderGuncelle>[1] = { tutarKurus: kurus(tutar) };
    if (duzenleAd.trim()) upd.kategori = duzenleAd.trim();
    giderGuncelle(duzenleId, upd);
    setDuzenleId(null);
  };

  if (!yuklendi) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-[#22c55e] animate-spin" />
      </div>
    );
  }

  if (rol !== "pilot") return null;

  const ay = new Date().toLocaleDateString("tr-TR", { month: "long", year: "numeric" }).toUpperCase();

  return (
    <div className="max-w-6xl mx-auto px-2">

      {/* Hero */}
      <section className="space-y-2 py-6">
        <p className="label-caps">KÂR-ZARAR · {ay}</p>
        <div className="flex items-baseline gap-3">
          <span
            className="hero-number"
            style={{ color: netKar >= 0 ? "var(--forest)" : "var(--color-danger)" }}
          >
            {tl(netKar)}
          </span>
        </div>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Net kâr
          {brutMarj > 0 && <> · Brüt marj %{brutMarj.toFixed(1)}</>}
          {netMarj !== 0 && <> · Net marj %{netMarj.toFixed(1)}</>}
        </p>
      </section>

      <hr className="section-rule" />

      {/* Tarih Filtresi */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div />
        <div className="flex flex-col items-end gap-2">
          <button
            onClick={() => setTarihAcik((p) => !p)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all"
            style={{
              borderColor:     tarihFiltreAktif ? "rgba(34,197,94,0.4)" : "rgba(255,255,255,0.1)",
              color:           tarihFiltreAktif ? "#22c55e" : "#94a3b8",
              backgroundColor: tarihFiltreAktif ? "rgba(34,197,94,0.08)" : "rgba(255,255,255,0.04)",
            }}
          >
            <CalendarRange className="w-4 h-4" />
            {new Date(baslangic).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}
            {" – "}
            {new Date(bitis).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })}
            {tarihAcik ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {tarihFiltreAktif && (
              <span
                onClick={(e) => { e.stopPropagation(); setBaslangic(ayBasiIso()); setBitis(bugunIso()); }}
                className="hover:text-gray-800 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tarih seçici paneli */}
      <AnimatePresence>
        {tarihAcik && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
            style={{ overflow: "hidden" }}
          >
            <div className="flex flex-wrap items-center gap-3 p-4 rounded-2xl border border-[rgba(34,197,94,0.2)] bg-[rgba(34,197,94,0.04)]">
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-400 font-medium whitespace-nowrap">Başlangıç</label>
                <input type="date" value={baslangic} max={bitis}
                  onChange={(e) => setBaslangic(e.target.value)}
                  className="px-3 py-1.5 rounded-lg text-xs text-gray-800 border border-gray-200 bg-gray-50 focus:outline-none focus:border-[rgba(34,197,94,0.4)] scheme-dark" />
              </div>
              <span className="text-gray-400 text-xs">—</span>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-400 font-medium whitespace-nowrap">Bitiş</label>
                <input type="date" value={bitis} min={baslangic} max={bugunIso()}
                  onChange={(e) => setBitis(e.target.value)}
                  className="px-3 py-1.5 rounded-lg text-xs text-gray-800 border border-gray-200 bg-gray-50 focus:outline-none focus:border-[rgba(34,197,94,0.4)] scheme-dark" />
              </div>
              <div className="flex gap-2 ml-auto">
                {kisayollar.map(({ label, fn }) => (
                  <button key={label} onClick={fn}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium border border-[rgba(34,197,94,0.2)] text-[#22c55e] hover:bg-[rgba(34,197,94,0.1)] transition-colors">
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── KPI Kartlar ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: "Net Kâr",
            deger: netKar,
            alt: `${netKar >= 0 ? "Kâr" : "Zarar"} durumu`,
            icon: DollarSign,
            renk: netKar >= 0 ? "#22c55e" : "#ef4444",
            bg: netKar >= 0 ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
            border: netKar >= 0 ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)",
            degerStr: (netKar < 0 ? "–" : "+") + tl(Math.abs(netKar)),
          },
          {
            label: "Net Kâr Marjı",
            deger: netMarj * 100,
            alt: netMarj >= 0.15 ? "Sağlıklı marj" : netMarj >= 0 ? "Düşük marj" : "Zarar",
            icon: Percent,
            renk: netMarj >= 0.15 ? "#22c55e" : netMarj >= 0 ? "var(--leaf)" : "#ef4444",
            bg: netMarj >= 0.15 ? "rgba(34,197,94,0.1)" : netMarj >= 0 ? "var(--mint)" : "rgba(239,68,68,0.1)",
            border: netMarj >= 0.15 ? "rgba(34,197,94,0.2)" : netMarj >= 0 ? "var(--forest-100, #D9F2E4)" : "rgba(239,68,68,0.2)",
            degerStr: `%${(netMarj * 100).toFixed(1)}`,
          },
          {
            label: "Başa Baş Ciro",
            deger: basaBazCiro,
            alt: satisHasilati > 0
              ? satisHasilati >= basaBazCiro
                ? `Ciro başa baş noktasının ${tl(satisHasilati - basaBazCiro)} üzerinde`
                : `Başa baş için ${tl(basaBazCiro - satisHasilati)} daha gerekli`
              : "Satış verisi yok",
            icon: Target,
            renk: satisHasilati >= basaBazCiro && basaBazCiro > 0 ? "#22c55e" : "var(--leaf)",
            bg: satisHasilati >= basaBazCiro && basaBazCiro > 0 ? "rgba(34,197,94,0.1)" : "var(--mint)",
            border: satisHasilati >= basaBazCiro && basaBazCiro > 0 ? "rgba(34,197,94,0.2)" : "var(--forest-100, #D9F2E4)",
            degerStr: basaBazCiro > 0 ? tl(basaBazCiro) : "—",
          },
        ].map(({ label, alt, icon: Icon, renk, bg, border, degerStr }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }} className="card rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-400 font-medium">{label}</span>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: bg, border: `1px solid ${border}` }}>
                <Icon className="w-4 h-4" style={{ color: renk }} />
              </div>
            </div>
            <p className="text-xl font-bold" style={{ color: renk }}>{degerStr}</p>
            <p className="text-xs mt-1 text-gray-500 truncate">{alt}</p>
          </motion.div>
        ))}
      </div>

      {/* ─── P&L Tablosu + Pie Chart ─── */}
      <div className="flex flex-col lg:flex-row gap-6">

        {/* P&L hiyerarşi */}
        <div className="card rounded-2xl py-4 flex-1">
          <div className="px-5 pb-3 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-800">Gelir Tablosu</h2>
            <p className="text-xs text-gray-400 mt-0.5">KDV hariç, seçili dönem</p>
          </div>
          <div className="py-3 space-y-0.5">

            {/* Hasılat */}
            <div className="flex items-center gap-2 px-5 pt-2 pb-1">
              <TrendingUp className="w-3 h-3 text-[#22c55e]" />
              <span className="text-[10px] font-bold text-[#22c55e] uppercase tracking-widest">Hasılat</span>
              <div className="flex-1 h-px bg-gray-50" />
            </div>
            <PLSatir label="Satış Hasılatı" deger={satisHasilati} renk="#22c55e" bold />

            {/* SMM */}
            <div className="flex items-center gap-2 px-5 pt-3 pb-1">
              <TrendingDown className="w-3 h-3 text-[#ef4444]" />
              <span className="text-[10px] font-bold text-[#ef4444] uppercase tracking-widest">Satılan Mal Maliyeti</span>
              <div className="flex-1 h-px bg-gray-50" />
            </div>
            <PLSatir label="SMM" deger={-smm} renk="#ef4444" indent
              yuzde={satisHasilati > 0 ? (smm / satisHasilati) * 100 : 0} />

            {/* BRÜT KÂR */}
            <PLSatir label="BRÜT KÂR" deger={brutKarKurus}
              renk={brutKarKurus >= 0 ? "#22c55e" : "#ef4444"} bold separator
              bg={brutKarKurus >= 0 ? "rgba(34,197,94,0.06)" : "rgba(239,68,68,0.06)"}
              yuzde={brutMarj * 100} />

            {/* Sabit Giderler */}
            {giderler.length > 0 && (
              <>
                <div className="flex items-center gap-2 px-5 pt-3 pb-1">
                  <TrendingDown className="w-3 h-3 text-[#f97316]" />
                  <span className="text-[10px] font-bold text-[#f97316] uppercase tracking-widest">Sabit Giderler</span>
                  <div className="flex-1 h-px bg-gray-50" />
                </div>
                {giderler.map((g) => (
                  <PLSatir key={g.id} label={g.kategori} deger={-g.tutarKurus} renk="#f97316" indent
                    yuzde={satisHasilati > 0 ? (g.tutarKurus / satisHasilati) * 100 : 0} />
                ))}
                <PLSatir label="Toplam Sabit Gider" deger={-toplamGider} renk="#ef4444" bold />
              </>
            )}

            {/* NET KÂR */}
            <PLSatir label="NET KÂR" deger={netKar}
              renk={netKar >= 0 ? "#22c55e" : "#ef4444"} bold separator
              bg={netKar >= 0 ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)"}
              yuzde={satisHasilati > 0 ? Math.abs(netMarj) * 100 : 0} />
          </div>
        </div>

        {/* Pie chart */}
        <div className="card rounded-2xl p-5 w-full lg:w-80 shrink-0">
          <h2 className="text-sm font-semibold text-gray-800 mb-1">Gider Dağılımı</h2>
          <p className="text-xs text-gray-400 mb-4">SMM + sabit giderler</p>
          {pieData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-sm text-gray-500">
              Veri yok
            </div>
          ) : (
            <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name"
                  cx="50%" cy="50%" outerRadius={90} innerRadius={50}
                  paddingAngle={2} stroke="none">
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} fillOpacity={0.85} />
                  ))}
                </Pie>
                <ReTooltip content={<PieTooltip />} />
                <Legend
                  formatter={(value) => (
                    <span style={{ color: "#94a3b8", fontSize: 10 }}>{value}</span>
                  )}
                  iconSize={8}
                  iconType="circle"
                />
              </PieChart>
            </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* ─── Sabit Gider Yönetimi ─── */}
      <div className="card rounded-2xl overflow-hidden">
        <button
          onClick={() => setGiderAcik((p) => !p)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[rgba(249,115,22,0.12)] border border-[rgba(249,115,22,0.2)] flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-[#f97316]" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-gray-800">Sabit Giderler</p>
              <p className="text-xs text-gray-500">
                {giderler.length} kalem · Toplam {tl(toplamGider)}/ay
              </p>
            </div>
          </div>
          {giderAcik ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
        </button>

        <AnimatePresence>
          {giderAcik && (
            <motion.div
              initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
              style={{ overflow: "hidden" }}
            >
              <div className="border-t border-gray-200">
                {/* Gider listesi */}
                {giderler.length > 0 && (
                  <div className="divide-y divide-gray-100">
                    {giderler.map((g) => (
                      <div key={g.id} className="flex items-center gap-3 px-5 py-3">
                        {duzenleId === g.id ? (
                          <>
                            <input value={duzenleAd}
                              onChange={(e) => setDuzenleAd(e.target.value)}
                              className="flex-1 px-3 py-1.5 rounded-lg text-sm text-gray-800 bg-gray-50 border border-gray-200 focus:outline-none focus:border-[rgba(249,115,22,0.4)]"
                            />
                            <input type="number" min="0" step="0.01" value={duzenleTutar}
                              onChange={(e) => setDuzenleTutar(e.target.value)}
                              className="w-28 px-3 py-1.5 rounded-lg text-sm text-gray-800 bg-gray-50 border border-gray-200 focus:outline-none focus:border-[rgba(249,115,22,0.4)] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <button onClick={handleGiderKaydet}
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-[rgba(34,197,94,0.12)] text-[#22c55e] hover:bg-[rgba(34,197,94,0.2)] transition-colors">
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setDuzenleId(null)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-400 transition-colors">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <>
                            <span className="flex-1 text-sm text-gray-400">{g.kategori}</span>
                            <span className="text-sm font-semibold text-gray-800">{tl(g.tutarKurus)}<span className="text-gray-500 text-xs">/ay</span></span>
                            <button
                              onClick={() => { setDuzenleId(g.id); setDuzenleAd(g.kategori); setDuzenleTutar(String(g.tutarKurus)); }}
                              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:text-[var(--leaf)] transition-colors">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleGiderSil(g)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:text-[#ef4444] transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Yeni gider ekleme */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 px-5 py-4 border-t border-gray-200 bg-gray-50">
                  <input
                    type="text"
                    placeholder="Gider adı (örn. Kira)"
                    value={yeniKategori}
                    onChange={(e) => setYeniKategori(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleGiderEkle()}
                    className="flex-1 min-h-11 px-3 py-2 rounded-xl text-sm text-gray-800 bg-gray-50 border border-gray-200 placeholder-[#475569] focus:outline-none focus:border-[rgba(249,115,22,0.4)] transition-colors"
                  />
                  <div className="flex gap-2">
                    <input
                      type="number" min="0" step="0.01"
                      placeholder="Tutar ₺"
                      value={yeniTutar}
                      onChange={(e) => setYeniTutar(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleGiderEkle()}
                      className="flex-1 sm:w-32 min-h-11 px-3 py-2 rounded-xl text-sm text-gray-800 bg-gray-50 border border-gray-200 placeholder-[#475569] focus:outline-none focus:border-[rgba(249,115,22,0.4)] transition-colors [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button
                      onClick={handleGiderEkle}
                      disabled={!yeniKategori.trim() || !Number(yeniTutar)}
                      className="shrink-0 flex items-center gap-1.5 px-3 py-2 min-h-11 rounded-xl bg-[#f97316] text-gray-800 text-sm font-semibold hover:bg-[#ea6c0a] transition-colors disabled:opacity-40"
                    >
                      <Plus className="w-4 h-4" />
                      Ekle
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Ürün Marj Analizi ─── */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">
          Ürün Bazlı Marj Analizi
        </h2>
        <div className="flex flex-col lg:flex-row gap-6">
          <MarjGrafik />
          <div className="flex-1">
            <UrunMarjTablosu />
          </div>
        </div>
      </div>

      {/* ─── Satış Geçmişi ─── */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">
          Satış Geçmişi
        </h2>
        <SatisGecmisi />
      </div>
    </div>
  );
}
