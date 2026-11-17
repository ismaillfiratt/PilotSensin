"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  PieChart, Pie, Cell, Tooltip as ReTooltip, ResponsiveContainer,
} from "recharts";
import {
  Plus, Trash2, Pencil, Check, X, CalendarRange, ChevronDown, ChevronUp,
} from "lucide-react";
import { useSatislar } from "@/store/satislar";
import { useIsletmeGiderleri } from "@/store/isletmeGiderleri";
import { useSirket } from "@/store/sirket";
import { useKdvHavuzu, toplamGirdiKdv, toplamCiktiKdv } from "@/store/kdvHavuzu";
import { kurus } from "@/lib/para";
import { plTablosu } from "@/lib/selectors/pl";
import { karZararSkoru } from "@/lib/pilot-score";
import { onaylaSil } from "@/lib/onay";
import { useGeriAl } from "@/store/geriAl";
import dynamic from "next/dynamic";

const SatisGecmisi    = dynamic(() => import("@/components/kar-zarar/SatisGecmisi"),    { ssr: false });
const MarjGrafik      = dynamic(() => import("@/components/kar-zarar/MarjGrafik"),      { ssr: false });
const UrunMarjTablosu = dynamic(() => import("@/components/kar-zarar/UrunMarjTablosu"), { ssr: false });

const tl = (n: number) =>
  (n / 100).toLocaleString("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 });

function yerelTarih(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function bugunIso() { return yerelTarih(new Date()); }
function ayBasiIso() { const d = new Date(); d.setDate(1); return yerelTarih(d); }

const PIE_COLORS = [
  "#525252", // koyu gri
  "#E07A5F", // terrakota
  "#3D5A80", // lacivert
  "#E9C46A", // altın sarısı
  "#C77DFF", // lavanta moru
  "#F4845F", // turuncu
  "#06D6A0", // teal
  "#EF476F", // pembe kırmızı
  "#118AB2", // çelik mavisi
  "#073B4C", // koyu deniz
  "#8338EC", // derin mor
  "#FB5607", // yanık turuncu
];

/* ── Kâr-Zarar Skor Badge (circular gauge) ── */
function KarZararSkorBadge({ skor, durum }: { skor: number; durum: "ok" | "warning" | "critical" }) {
  const renk   = durum === "ok" ? "#10B981" : durum === "warning" ? "#F59E0B" : "#EF4444";
  const etiket = durum === "ok" ? "İyi"     : durum === "warning" ? "Dikkat"  : "Kritik";
  const radius = 30;
  const circ   = 2 * Math.PI * radius;
  const offset = circ - (skor / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-1.5 shrink-0">
      <div className="relative w-20 h-20">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 70 70">
          <circle cx="35" cy="35" r={radius} fill="none" stroke="#F3F4F6" strokeWidth="6" />
          <motion.circle
            cx="35" cy="35" r={radius} fill="none"
            stroke={renk} strokeWidth="6" strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-number font-bold text-base" style={{ color: renk }}>%{skor}</span>
        </div>
      </div>
      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full"
        style={{ color: renk, background: `${renk}15`, border: `1px solid ${renk}30` }}>
        {etiket}
      </span>
    </div>
  );
}

/* ── Stat card (matches NakitAkisiContent StatCard) ── */
function StatCard({ etiket, deger, altDeger, altRenk }: {
  etiket: string; deger: string; altDeger?: string; altRenk?: string;
}) {
  return (
    <div className="stat-card">
      <p className="label-caps mb-2">{etiket}</p>
      <p className="font-number font-semibold text-xl text-[#0F172A]">{deger}</p>
      {altDeger && (
        <p className="text-xs mt-1 font-medium" style={{ color: altRenk ?? "var(--text-secondary)" }}>
          {altDeger}
        </p>
      )}
    </div>
  );
}

/* ── P&L satır bileşeni (yeni sade tasarım) ── */
function PLSatir({
  label, deger, renk, bold, indent, bg, yuzde, separator,
}: {
  label: string; deger: number; renk?: string; bold?: boolean;
  indent?: boolean; bg?: string; yuzde?: number; separator?: boolean;
}) {
  return (
    <>
      {separator && <div className="h-px bg-black/5" />}
      <div
        className={`flex items-center justify-between px-5 py-2.5 ${indent ? "pl-9" : ""}`}
        style={{ backgroundColor: bg }}
      >
        <span className={`text-sm ${bold ? "font-semibold text-[#0F172A]" : "text-gray-500"}`}>
          {label}
        </span>
        <div className="flex items-center gap-3">
          {yuzde !== undefined && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/4 text-gray-400">
              %{yuzde.toFixed(1)}
            </span>
          )}
          <span
            className={`font-number text-sm tabular-nums ${bold ? "font-semibold" : "font-medium"}`}
            style={{ color: renk ?? (bold ? "#0F172A" : "#94a3b8") }}
          >
            {tl(deger)}
          </span>
        </div>
      </div>
    </>
  );
}

/* ── Pie tooltip ── */
function PieTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { fill: string } }> }) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-white border border-black/8 rounded-xl px-3 py-2 text-xs shadow-sm">
      <p className="text-[#0F172A] font-semibold">{d.name}</p>
      <p style={{ color: d.payload.fill }}>{tl(d.value)}</p>
    </div>
  );
}

export default function KarZararPage() {
  const router = useRouter();
  const { rol, yuklendi } = useSirket();

  useEffect(() => {
    if (yuklendi && rol !== "pilot") router.replace("/");
  }, [yuklendi, rol, router]);

  const { kayitlar }   = useSatislar();
  const { giderler, ekle: giderEkle, guncelle: giderGuncelle, sil: giderSil } = useIsletmeGiderleri();
  const { kayitlar: kdvKayitlar } = useKdvHavuzu();

  const [mounted,    setMounted]    = useState(false);
  const [baslangic,  setBaslangic]  = useState(ayBasiIso);
  const [bitis,      setBitis]      = useState(bugunIso);
  const [tarihAcik,  setTarihAcik]  = useState(false);
  const [yeniKategori, setYeniKategori] = useState("");
  const [yeniTutar,    setYeniTutar]    = useState("");
  const [duzenleId,    setDuzenleId]    = useState<string | null>(null);
  const [duzenleAd,    setDuzenleAd]    = useState("");
  const [duzenleTutar, setDuzenleTutar] = useState("");
  const [giderAcik,    setGiderAcik]    = useState(false);

  useEffect(() => setMounted(true), []);

  const pl = useMemo(
    () => plTablosu(kayitlar, giderler, baslangic, bitis),
    [kayitlar, giderler, baslangic, bitis]
  );

  const satisHasilati = pl.ciroKurus;
  const directMaliyet = pl.directMaliyetKurus;
  const brutKarKurus  = pl.brutKarKurus;
  const brutMarj      = pl.brutMarj;
  const toplamGider   = pl.toplamGiderKurus;
  const netKar        = pl.netKarKurus;
  const netMarj       = pl.netMarj;
  const basaBazCiro   = pl.basaBazCiroKurus;

  // KDV: useKdvHavuzu'ndan seçili dönem için filtrele (stok sayfasıyla aynı kaynak)
  const donemKdvKayitlar = useMemo(() => {
    const basTs = new Date(baslangic).setHours(0, 0, 0, 0);
    const bitTs = new Date(bitis).setHours(23, 59, 59, 999);
    return kdvKayitlar.filter((k) => {
      if (k.silindi) return false;
      const t = new Date(k.tarih).getTime();
      return t >= basTs && t <= bitTs;
    });
  }, [kdvKayitlar, baslangic, bitis]);

  const satisKdv  = toplamCiktiKdv(donemKdvKayitlar);
  const indirimKdv = toplamGirdiKdv(donemKdvKayitlar);
  const netKdvBorc = Math.max(0, satisKdv - indirimKdv);

  const skor = useMemo(() => karZararSkoru(kayitlar, giderler), [kayitlar, giderler]);

  const pieData = useMemo(() => {
    const veri: { name: string; value: number }[] = [];
    if (directMaliyet > 0) veri.push({ name: "Direct Maliyetler", value: directMaliyet });
    giderler.forEach((g) => {
      if (g.tutarKurus > 0) veri.push({ name: g.kategori, value: g.tutarKurus });
    });
    return veri;
  }, [directMaliyet, giderler]);

  const toplamPie = useMemo(() => pieData.reduce((t, d) => t + d.value, 0), [pieData]);

  const tarihFiltreAktif = baslangic !== ayBasiIso() || bitis !== bugunIso();

  const kisayollar = [
    { label: "Bugün",      fn: () => { const t = bugunIso(); setBaslangic(t); setBitis(t); } },
    { label: "Bu Ay",      fn: () => { setBaslangic(ayBasiIso()); setBitis(bugunIso()); } },
    { label: "Son 7 Gün",  fn: () => { const d = new Date(); d.setDate(d.getDate() - 7);  setBaslangic(yerelTarih(d)); setBitis(bugunIso()); } },
    { label: "Son 30 Gün", fn: () => { const d = new Date(); d.setDate(d.getDate() - 30); setBaslangic(yerelTarih(d)); setBitis(bugunIso()); } },
  ];

  const handleGiderEkle = () => {
    const tutar = Number(yeniTutar.replace(",", "."));
    if (!yeniKategori.trim() || !tutar || tutar <= 0) return;
    giderEkle({ kategori: yeniKategori.trim(), tutarKurus: kurus(tutar) });
    setYeniKategori(""); setYeniTutar("");
  };

  const handleGiderSil = async (g: { id: string; kategori: string }) => {
    const { onaylandi } = await onaylaSil({ tip: "isletmeGideri", isim: g.kategori });
    if (!onaylandi) return;
    await giderSil(g.id);
    useGeriAl.getState().goster({
      mesaj:    `"${g.kategori}" gideri silindi.`,
      sureMs:   10000,
      geriAlFn: async () => useIsletmeGiderleri.getState().geriAl(g.id),
    });
  };

  const handleGiderKaydet = () => {
    if (!duzenleId) return;
    const tutar = Number(duzenleTutar.replace(",", "."));
    if (tutar <= 0) return;
    const upd: Parameters<typeof giderGuncelle>[1] = { tutarKurus: kurus(tutar) };
    if (duzenleAd.trim()) upd.kategori = duzenleAd.trim();
    giderGuncelle(duzenleId, upd);
    setDuzenleId(null);
  };

  if (!yuklendi) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-[var(--accent)] animate-spin" />
      </div>
    );
  }

  if (rol !== "pilot") return null;

  const ay = new Date().toLocaleDateString("tr-TR", { month: "long", year: "numeric" }).toUpperCase();

  return (
    <div className="max-w-6xl mx-auto px-2">

      {/* ── 1. Hero ── */}
      <section className="py-6">
        <div className="flex items-start justify-between gap-6">
          <div className="space-y-2">
            <p className="label-caps">KÂR-ZARAR · {ay}</p>
            <div className="flex items-baseline gap-3">
              <span className="hero-number"
                style={{ color: netKar >= 0 ? "var(--text-primary)" : "var(--color-danger)" }}>
                {tl(netKar)}
              </span>
            </div>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Net kâr
              {brutMarj > 0 && <> · Brüt marj %{brutMarj.toFixed(1)}</>}
              {netMarj !== 0 && <> · Net marj %{netMarj.toFixed(1)}</>}
            </p>
          </div>
          <KarZararSkorBadge skor={skor.skor} durum={skor.durum} />
        </div>
      </section>

      <hr className="section-rule" />

      {/* ── 2. Tarih filtresi ── */}
      <div className="flex justify-end pb-3">
        <button
          onClick={() => setTarihAcik((p) => !p)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all"
          style={{
            borderColor:     tarihFiltreAktif ? "rgba(250,250,250,0.15)"  : "rgba(0,0,0,0.10)",
            color:           tarihFiltreAktif ? "var(--text-primary)"      : "var(--text-secondary)",
            backgroundColor: tarihFiltreAktif ? "rgba(250,250,250,0.05)" : "transparent",
          }}
        >
          <CalendarRange className="w-4 h-4" />
          {new Date(baslangic).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}
          {" – "}
          {new Date(bitis).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })}
          {tarihAcik ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {tarihFiltreAktif && (
            <span onClick={(e) => { e.stopPropagation(); setBaslangic(ayBasiIso()); setBitis(bugunIso()); }}
              className="hover:text-gray-800 transition-colors">
              <X className="w-3.5 h-3.5" />
            </span>
          )}
        </button>
      </div>

      <AnimatePresence>
        {tarihAcik && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
            style={{ overflow: "hidden" }}
          >
            <div className="flex flex-wrap items-center gap-3 p-4 rounded-2xl border border-black/8 bg-[#F3F4F6] mb-4">
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium whitespace-nowrap" style={{ color: "var(--text-secondary)" }}>Başlangıç</label>
                <input type="date" value={baslangic} max={bitis}
                  onChange={(e) => setBaslangic(e.target.value)}
                  className="px-3 py-1.5 rounded-lg text-xs text-[#0F172A] border border-black/10 bg-white focus:outline-none focus:border-[var(--border-medium)]" />
              </div>
              <span className="text-gray-400 text-xs">—</span>
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium whitespace-nowrap" style={{ color: "var(--text-secondary)" }}>Bitiş</label>
                <input type="date" value={bitis} min={baslangic} max={bugunIso()}
                  onChange={(e) => setBitis(e.target.value)}
                  className="px-3 py-1.5 rounded-lg text-xs text-[#0F172A] border border-black/10 bg-white focus:outline-none focus:border-[var(--border-medium)]" />
              </div>
              <div className="flex gap-2 ml-auto">
                {kisayollar.map(({ label, fn }) => (
                  <button key={label} onClick={fn}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium border border-black/10 text-gray-500 hover:border-[var(--border-medium)] hover:text-[var(--text-primary)] transition-colors">
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 3. KPI kartlar (sade, ikonsuz) ── */}
      <section className="py-2">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            etiket="Satış Hasılatı"
            deger={tl(satisHasilati)}
            altDeger={satisHasilati > 0 ? `Brüt kâr: ${tl(brutKarKurus)}` : "Satış verisi yok"}
            altRenk={brutKarKurus >= 0 ? "var(--color-success)" : "var(--color-danger)"}
          />
          <StatCard
            etiket="Net Kâr"
            deger={tl(netKar)}
            altDeger={netKar >= 0 ? "Kâr durumu" : "Zarar durumu"}
            altRenk={netKar >= 0 ? "var(--color-success)" : "var(--color-danger)"}
          />
          <StatCard
            etiket="Net Kâr Marjı"
            deger={`%${(netMarj * 100).toFixed(1)}`}
            altDeger={netMarj >= 0.15 ? "Sağlıklı marj" : netMarj >= 0 ? "Düşük marj" : "Zarar marjı"}
            altRenk={netMarj >= 0.15 ? "var(--color-success)" : netMarj >= 0 ? "#F59E0B" : "var(--color-danger)"}
          />
          <StatCard
            etiket="Başa Baş Ciro"
            deger={basaBazCiro > 0 ? tl(basaBazCiro) : "—"}
            altDeger={
              satisHasilati > 0
                ? satisHasilati >= basaBazCiro
                  ? `₺${((satisHasilati - basaBazCiro) / 100).toLocaleString("tr-TR", { maximumFractionDigits: 0 })} üzerinde`
                  : `₺${((basaBazCiro - satisHasilati) / 100).toLocaleString("tr-TR", { maximumFractionDigits: 0 })} eksik`
                : "Satış verisi yok"
            }
            altRenk={
              satisHasilati >= basaBazCiro && basaBazCiro > 0
                ? "var(--color-success)"
                : basaBazCiro > 0 ? "var(--color-danger)" : "var(--text-secondary)"
            }
          />
        </div>
      </section>

      <hr className="section-rule" />

      {/* ── 4. Gelir Tablosu (yeni sade tasarım) ── */}
      <section className="py-2">
        <h2 className="text-sm font-semibold mb-4">Gelir Tablosu</h2>

        <div className="rounded-xl border border-black/8 bg-white overflow-hidden">
          {/* Hasılat */}
          <div className="px-5 py-2.5 bg-[#F9FAFB]">
            <p className="label-caps" style={{ color: "var(--text-primary)" }}>Hasılat</p>
          </div>
          <PLSatir label="Satış Hasılatı" deger={satisHasilati} bold renk="var(--text-primary)" />

          {/* Direct Maliyetler */}
          <div className="h-px bg-black/5" />
          <div className="px-5 py-2.5 bg-[#F9FAFB]">
            <p className="label-caps" style={{ color: "#C97676" }}>Direct Maliyetler</p>
          </div>
          <PLSatir label="Toplam Direct Maliyet" deger={-directMaliyet} renk="#C97676" indent
            yuzde={satisHasilati > 0 ? (directMaliyet / satisHasilati) * 100 : 0} />

          {/* Brüt Kâr */}
          <PLSatir label="Brüt Kâr" deger={brutKarKurus}
            renk={brutKarKurus >= 0 ? "var(--text-primary)" : "var(--color-danger)"} bold separator
            bg={brutKarKurus >= 0 ? "rgba(250,250,250,0.04)" : "rgba(201,118,118,0.06)"}
            yuzde={brutMarj * 100} />

          {/* Sabit Giderler */}
          {giderler.length > 0 && (
            <>
              <div className="h-px bg-black/5" />
              <div className="px-5 py-2.5 bg-[#F9FAFB]">
                <p className="label-caps" style={{ color: "#D97706" }}>Sabit Giderler</p>
              </div>
              {giderler.map((g) => (
                <PLSatir key={g.id} label={g.kategori} deger={-g.tutarKurus} renk="#D97706" indent
                  yuzde={satisHasilati > 0 ? (g.tutarKurus / satisHasilati) * 100 : 0} />
              ))}
              <PLSatir label="Toplam Sabit Gider" deger={-toplamGider} bold
                renk={toplamGider > 0 ? "#C97676" : "#94a3b8"} />
            </>
          )}

          {/* Net Kâr */}
          <PLSatir label="Net Kâr" deger={netKar}
            renk={netKar >= 0 ? "var(--text-primary)" : "var(--color-danger)"} bold separator
            bg={netKar >= 0 ? "rgba(250,250,250,0.05)" : "rgba(201,118,118,0.08)"}
            yuzde={satisHasilati > 0 ? Math.abs(netMarj) * 100 : 0} />
        </div>
      </section>

      <hr className="section-rule" />

      {/* ── 5. Sabit Gider Yönetimi ── */}
      <section className="py-2">
        <div className="rounded-xl border border-black/8 bg-white overflow-hidden">
          <button
            onClick={() => setGiderAcik((p) => !p)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#F9FAFB] transition-colors"
          >
            <div className="text-left">
              <p className="text-sm font-semibold text-[#0F172A]">Sabit Giderler</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                {giderler.length} kalem · Toplam {tl(toplamGider)}/ay
              </p>
            </div>
            {giderAcik
              ? <ChevronUp className="w-4 h-4 text-gray-400" />
              : <ChevronDown className="w-4 h-4 text-gray-400" />
            }
          </button>

          <AnimatePresence>
            {giderAcik && (
              <motion.div
                initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                style={{ overflow: "hidden" }}
              >
                <div className="border-t border-black/5">
                  {giderler.length > 0 && (
                    <div className="divide-y divide-black/4">
                      {giderler.map((g) => (
                        <div key={g.id} className="flex items-center gap-3 px-5 py-3">
                          {duzenleId === g.id ? (
                            <>
                              <input value={duzenleAd}
                                onChange={(e) => setDuzenleAd(e.target.value)}
                                className="flex-1 px-3 py-1.5 rounded-lg text-sm text-[#0F172A] bg-[#F9FAFB] border border-black/10 focus:outline-none focus:border-[var(--border-medium)] focus:outline-none"
                              />
                              <input
                                type="text" inputMode="decimal"
                                value={duzenleTutar}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  if (/^[0-9]*[.,]?[0-9]*$/.test(v)) setDuzenleTutar(v);
                                }}
                                placeholder="Tutar ₺"
                                className="w-28 px-3 py-1.5 rounded-lg text-sm text-[#0F172A] bg-[#F9FAFB] border border-black/10 focus:outline-none focus:border-[var(--border-medium)]"
                              />
                              <button onClick={handleGiderKaydet}
                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors">
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => setDuzenleId(null)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-[#F3F4F6] transition-colors">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <>
                              <span className="flex-1 text-sm text-gray-500">{g.kategori}</span>
                              <span className="font-number text-sm font-semibold text-[#0F172A]">
                                {(g.tutarKurus / 100).toLocaleString("tr-TR", { maximumFractionDigits: 0 })} ₺
                                <span className="text-gray-400 text-xs font-normal">/ay</span>
                              </span>
                              <button
                                onClick={() => {
                                  setDuzenleId(g.id);
                                  setDuzenleAd(g.kategori);
                                  setDuzenleTutar(String(g.tutarKurus / 100));
                                }}
                                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-[var(--text-primary)] hover:bg-[#F3F4F6] transition-colors">
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => handleGiderSil(g)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-[#C97676] hover:bg-[#C97676]/8 transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Yeni gider ekleme */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 px-5 py-4 border-t border-black/5 bg-[#F9FAFB]">
                    <input
                      type="text"
                      placeholder="Gider adı (örn. Kira)"
                      value={yeniKategori}
                      onChange={(e) => setYeniKategori(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleGiderEkle()}
                      className="flex-1 min-h-10 px-3 py-2 rounded-lg text-sm text-[#0F172A] bg-white border border-black/10 placeholder-gray-400 focus:outline-none focus:border-[var(--border-medium)] transition-colors"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text" inputMode="decimal"
                        placeholder="5.000"
                        value={yeniTutar}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (/^[0-9]*[.,]?[0-9]*$/.test(v)) setYeniTutar(v);
                        }}
                        onKeyDown={(e) => e.key === "Enter" && handleGiderEkle()}
                        className="flex-1 sm:w-28 min-h-10 px-3 py-2 rounded-lg text-sm text-[#0F172A] bg-white border border-black/10 placeholder-gray-400 focus:outline-none focus:border-[var(--border-medium)] transition-colors"
                      />
                      <button
                        onClick={handleGiderEkle}
                        disabled={!yeniKategori.trim() || !Number(yeniTutar.replace(",", "."))}
                        className="shrink-0 flex items-center gap-1.5 px-3 py-2 min-h-10 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-40"
                        style={{ background: "var(--accent)", color: "#0a0a0a" }}
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
      </section>

      <hr className="section-rule" />

      {/* ── 5b. KDV Pozisyonu ── */}
      {satisKdv > 0 && (
        <section className="py-2">
          <h2 className="text-sm font-semibold mb-4">KDV Pozisyonu</h2>
          <div className="rounded-xl border border-black/8 bg-white overflow-hidden">
            <PLSatir label="Hesaplanan KDV (satışlar)" deger={satisKdv} renk="var(--text-primary)" bold />
            {indirimKdv > 0 && (
              <PLSatir label="İndirilecek KDV (alışlar)" deger={-indirimKdv} renk="#D97706" indent />
            )}
            <PLSatir label="Ödenecek Net KDV" deger={-netKdvBorc}
              renk={netKdvBorc > 0 ? "#C97676" : "var(--text-secondary)"} bold separator
              bg="rgba(0,0,0,0.02)" />
          </div>
        </section>
      )}

      <hr className="section-rule" />

      {/* ── 6. Gider Dağılımı ── */}
      <section className="py-2">
        <h2 className="text-sm font-semibold mb-4">Gider Dağılımı</h2>

        {pieData.length === 0 ? (
          <div className="rounded-xl border border-black/8 bg-white p-10 text-center">
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Gider verisi yok</p>
          </div>
        ) : (
          <div className="rounded-xl border border-black/8 bg-white p-5">
            {/* Donut chart */}
            <div className="flex justify-center">
              {mounted ? (
                <div style={{ width: 220, height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name"
                        cx="50%" cy="50%" outerRadius={95} innerRadius={55}
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
                <div className="w-[220px] h-[220px] rounded-full bg-gray-100 animate-pulse" />
              )}
            </div>

            {/* Liste — yüzdelik, renk noktaları ile */}
            <div className="mt-5 space-y-2">
              {[...pieData]
                .sort((a, b) => b.value - a.value)
                .map((d) => {
                  const pct = toplamPie > 0 ? (d.value / toplamPie) * 100 : 0;
                  const renk = PIE_COLORS[pieData.indexOf(d) % PIE_COLORS.length];
                  return (
                    <div key={d.name} className="flex items-center gap-3">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: renk }} />
                      <span className="flex-1 text-sm text-[#0F172A] truncate">{d.name}</span>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="w-20 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                          <div className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, backgroundColor: renk }} />
                        </div>
                        <span className="font-number text-xs font-medium text-gray-500 w-10 text-right">
                          %{pct.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  );
              })}
            </div>

            <p className="mt-4 text-xs border-t border-black/5 pt-3" style={{ color: "var(--text-secondary)" }}>
              Toplam {tl(toplamPie)} · SMM + sabit giderler
            </p>
          </div>
        )}
      </section>

      <hr className="section-rule" />

      {/* ── 7. Ürün Bazlı Marj Analizi ── */}
      <section className="py-2">
        <h2 className="text-sm font-semibold mb-4">Ürün Bazlı Marj Analizi</h2>
        <div className="flex flex-col lg:flex-row gap-6">
          <MarjGrafik />
          <div className="flex-1">
            <UrunMarjTablosu />
          </div>
        </div>
      </section>

      <hr className="section-rule" />

      {/* ── 8. Satış Geçmişi ── */}
      <section className="py-2">
        <h2 className="text-sm font-semibold mb-4">Satış Geçmişi</h2>
        <SatisGecmisi />
      </section>

    </div>
  );
}
