"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Search, X, CalendarRange, ChevronDown, Check } from "lucide-react";
import { useGorevler } from "@/store/gorevler";
import { ONCELIK_CONFIG, DURUM_CONFIG, type Oncelik } from "@/lib/gorev-data";
import { trBugun, trOncekiGun, trGunBaslangici, trGunSonu, trGoster } from "@/lib/tarih";

type Mod   = "bugun" | "dun" | "hafta" | "ay" | "ozel";
type Sekme = "toplam" | "yapilacak" | "devam" | "tamamlandi" | "geciken";

/* ────────────────────────────────────────── */
export default function GorevTarihselPanel() {
  const { gorevler } = useGorevler();

  /* Tarih dropdown */
  const dropdownRef               = useRef<HTMLDivElement>(null);
  const [tarihAcik, setTarihAcik] = useState(false);
  const [ozelFormAcik, setOzelFormAcik] = useState(false);
  const [mod, setMod]             = useState<Mod>("bugun");
  const [ozelBas, setOzelBas]     = useState(trOncekiGun(6));
  const [ozelBit, setOzelBit]     = useState(trBugun());

  /* Sekme & filtreler */
  const [sekme, setSekme]       = useState<Sekme>("toplam");
  const [arama, setArama]       = useState("");
  const [sorumluF, setSorumluF] = useState("");
  const [oncelikF, setOncelikF] = useState<"" | Oncelik>("");

  /* Click-outside dropdown */
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setTarihAcik(false);
    }
    if (tarihAcik) document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [tarihAcik]);

  /* Dönem aralığı */
  const { baslangic, bitis } = useMemo<{ baslangic: string; bitis: string }>(() => {
    const bg = trBugun();
    switch (mod) {
      case "bugun": return { baslangic: bg,              bitis: bg             };
      case "dun":   return { baslangic: trOncekiGun(1),  bitis: trOncekiGun(1) };
      case "hafta": return { baslangic: trOncekiGun(6),  bitis: bg             };
      case "ay":    return { baslangic: trOncekiGun(29), bitis: bg             };
      case "ozel":  return { baslangic: ozelBas,         bitis: ozelBit        };
    }
  }, [mod, ozelBas, ozelBit]);

  const basT   = trGunBaslangici(baslangic);
  const bitisT = trGunSonu(bitis);
  const simdi  = new Date();

  /* Dönem görevleri */
  const aralikGorevler = useMemo(
    () => gorevler.filter((g) => { const t = new Date(g.olusturmaTarih); return t >= basT && t <= bitisT; }),
    [gorevler, basT, bitisT]
  );

  /* İstatistikler */
  const stats = useMemo(() => ({
    toplam:     aralikGorevler.length,
    yapilacak:  aralikGorevler.filter((g) => g.durum === "yapilacak").length,
    devam:      aralikGorevler.filter((g) => g.durum === "devam").length,
    tamamlandi: aralikGorevler.filter((g) => g.durum === "tamamlandi").length,
    geciken:    aralikGorevler.filter((g) => g.durum !== "tamamlandi" && new Date(g.sonTarih) < simdi).length,
  }), [aralikGorevler, simdi]);

  /* Önceki dönem delta */
  const oncekiStats = useMemo(() => {
    const gunFark     = Math.max(1, Math.round((bitisT.getTime() - basT.getTime()) / 86400000) + 1);
    const oncekiBitis = new Date(basT.getTime() - 1);
    const oncekiBas   = new Date(oncekiBitis.getTime() - (gunFark - 1) * 86400000);
    oncekiBas.setHours(0, 0, 0, 0);
    const onceki      = gorevler.filter((g) => { const t = new Date(g.olusturmaTarih); return t >= oncekiBas && t <= oncekiBitis; });
    const tamamOnceki = onceki.filter((g) => g.durum === "tamamlandi").length;
    return { toplam: onceki.length, oran: onceki.length > 0 ? Math.round((tamamOnceki / onceki.length) * 100) : 0 };
  }, [gorevler, basT, bitisT]);

  const tamamlanmaOrani = stats.toplam > 0 ? Math.round((stats.tamamlandi / stats.toplam) * 100) : 0;
  const oranDelta       = tamamlanmaOrani - oncekiStats.oran;

  /* Ortalama tamamlanma süresi */
  const ortSure = useMemo(() => {
    const tamam = aralikGorevler.filter((g) => g.durum === "tamamlandi" && g.tamamlanmaTarihi);
    if (tamam.length === 0) return null;
    const toplamMs = tamam.reduce((s, g) => {
      return s + (new Date(g.tamamlanmaTarihi!).getTime() - new Date(g.olusturmaTarih).getTime());
    }, 0);
    return +(toplamMs / tamam.length / 86400000).toFixed(1);
  }, [aralikGorevler]);

  /* Günlük bar chart verisi */
  const trendData = useMemo(() => {
    const gunFark   = Math.max(1, Math.round((bitisT.getTime() - basT.getTime()) / 86400000) + 1);
    const completed = new Array<number>(gunFark).fill(0);
    const overdue   = new Array<number>(gunFark).fill(0);
    aralikGorevler.forEach((g) => {
      if (g.durum === "tamamlandi" && g.tamamlanmaTarihi) {
        const idx = Math.floor((new Date(g.tamamlanmaTarihi).getTime() - basT.getTime()) / 86400000);
        if (idx >= 0 && idx < gunFark) completed[idx]++;
      }
      if (g.durum !== "tamamlandi" && new Date(g.sonTarih) < simdi) {
        const idx = Math.floor((new Date(g.sonTarih).getTime() - basT.getTime()) / 86400000);
        if (idx >= 0 && idx < gunFark) overdue[idx]++;
      }
    });
    return { completed, overdue, gunFark };
  }, [aralikGorevler, basT, bitisT, simdi]);

  /* Trend insight'ları */
  const trendInsights = useMemo(() => {
    const { completed, gunFark } = trendData;
    const maxVal     = Math.max(...completed);
    const maxIdx     = maxVal > 0 ? completed.indexOf(maxVal) : -1;
    const enVerimli  = maxIdx >= 0
      ? { tarih: new Date(basT.getTime() + maxIdx * 86400000 + 43200000).toISOString(), sayi: maxVal }
      : null;
    let maxSeri = 0, seri = 0;
    completed.forEach((c) => { seri = c > 0 ? seri + 1 : 0; maxSeri = Math.max(maxSeri, seri); });
    const toplamTamamlandi = completed.reduce((a, b) => a + b, 0);
    return { enVerimli, aktifSeri: maxSeri, gunlukOrt: +(toplamTamamlandi / gunFark).toFixed(1) };
  }, [trendData, basT]);

  /* Ekip performansı */
  const ekipPerformans = useMemo(() => {
    const map = new Map<string, { tamamlandi: number; geciken: number }>();
    aralikGorevler.forEach((g) => {
      if (!map.has(g.sorumlu)) map.set(g.sorumlu, { tamamlandi: 0, geciken: 0 });
      const s = map.get(g.sorumlu)!;
      if (g.durum === "tamamlandi") s.tamamlandi++;
      else if (new Date(g.sonTarih) < simdi) s.geciken++;
    });
    return [...map.entries()]
      .map(([ad, s]) => {
        const toplam          = s.tamamlandi + s.geciken;
        const tamamlanmaYuzde = toplam > 0 ? Math.round((s.tamamlandi / toplam) * 100) : 0;
        const puan            = Math.max(0, Math.min(100, s.tamamlandi * 5 - s.geciken * 8));
        return { ad, tamamlandi: s.tamamlandi, geciken: s.geciken, tamamlanmaYuzde, puan };
      })
      .sort((a, b) => b.puan - a.puan);
  }, [aralikGorevler, simdi]);

  /* Gösterilecek görev listesi — sekme + filtreler */
  const gosterilecek = useMemo(() => {
    let liste = [...aralikGorevler].sort(
      (a, b) => new Date(b.olusturmaTarih).getTime() - new Date(a.olusturmaTarih).getTime()
    );
    switch (sekme) {
      case "yapilacak":  liste = liste.filter((g) => g.durum === "yapilacak"); break;
      case "devam":      liste = liste.filter((g) => g.durum === "devam"); break;
      case "tamamlandi": liste = liste.filter((g) => g.durum === "tamamlandi"); break;
      case "geciken":    liste = liste.filter((g) => g.durum !== "tamamlandi" && new Date(g.sonTarih) < simdi); break;
    }
    if (sorumluF) liste = liste.filter((g) => g.sorumlu === sorumluF);
    if (oncelikF) liste = liste.filter((g) => g.oncelik === oncelikF);
    if (arama.trim()) {
      const q = arama.trim().toLowerCase();
      liste = liste.filter((g) =>
        g.baslik.toLowerCase().includes(q) ||
        g.aciklama?.toLowerCase().includes(q) ||
        g.sorumlu.toLowerCase().includes(q)
      );
    }
    return liste;
  }, [sekme, aralikGorevler, sorumluF, oncelikF, arama, simdi]);

  const donemSorumlular = useMemo(
    () => [...new Set(aralikGorevler.map((g) => g.sorumlu))].sort(),
    [aralikGorevler]
  );

  const herhangiFiltre  = !!(arama || sorumluF || oncelikF);
  const tarihFiltreAktif = mod !== "bugun";

  const donemEtiket = mod === "bugun" ? "Bugün"
    : mod === "dun"   ? "Dün"
    : mod === "hafta" ? "Son 1 Hafta"
    : mod === "ay"    ? "Son 1 Ay"
    : `${trGoster(baslangic + "T12:00:00", "tarih")} — ${trGoster(bitis + "T12:00:00", "tarih")}`;

  const modButonlar: { key: Mod; label: string }[] = [
    { key: "bugun", label: "Bugün"       },
    { key: "dun",   label: "Dün"         },
    { key: "hafta", label: "Son 1 Hafta" },
    { key: "ay",    label: "Son 1 Ay"    },
  ];

  const sekmeler: { key: Sekme; label: string; sayi: number }[] = [
    { key: "toplam",     label: "Tümü",       sayi: stats.toplam     },
    { key: "yapilacak",  label: "Yapılacak",  sayi: stats.yapilacak  },
    { key: "devam",      label: "Devam",      sayi: stats.devam      },
    { key: "tamamlandi", label: "Tamamlandı", sayi: stats.tamamlandi },
    { key: "geciken",    label: "Geciken",    sayi: stats.geciken    },
  ];

  /* ─── Render ──────────────────────────────────── */
  return (
    <div className="space-y-4">

      {/* ── 1. Tarih dropdown (sağa yaslı) ── */}
      <div ref={dropdownRef} className="flex justify-end relative">
        <button
          onClick={() => setTarihAcik((p) => !p)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all"
          style={{
            borderColor:     tarihFiltreAktif ? "rgba(15,61,46,0.3)"  : "rgba(0,0,0,0.10)",
            color:           tarihFiltreAktif ? "var(--forest)"        : "var(--text-secondary)",
            backgroundColor: tarihFiltreAktif ? "rgba(15,61,46,0.05)" : "transparent",
          }}
        >
          <CalendarRange className="w-4 h-4" />
          {donemEtiket}
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${tarihAcik ? "rotate-180" : ""}`} />
        </button>

        {tarihAcik && (
          <div className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-xl border border-black/10 shadow-lg z-30 py-1 overflow-hidden">
            {modButonlar.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => { setMod(key); setOzelFormAcik(false); setTarihAcik(false); }}
                className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-left hover:bg-gray-50 transition-colors"
                style={{ color: mod === key ? "var(--forest)" : "#374151" }}
              >
                {label}
                {mod === key && <Check className="w-3.5 h-3.5" style={{ color: "var(--forest)" }} />}
              </button>
            ))}

            {/* Özel Tarih */}
            <button
              onClick={() => setOzelFormAcik((p) => !p)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-left hover:bg-gray-50 transition-colors border-t border-black/5 mt-1"
              style={{ color: mod === "ozel" ? "var(--forest)" : "#374151" }}
            >
              Özel Tarih
              {mod === "ozel"
                ? <Check className="w-3.5 h-3.5" style={{ color: "var(--forest)" }} />
                : <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${ozelFormAcik ? "rotate-180" : ""}`} />
              }
            </button>

            {ozelFormAcik && (
              <div className="px-4 py-3 border-t border-black/5 bg-gray-50 space-y-2.5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">Başlangıç</label>
                  <input
                    type="date"
                    value={ozelBas}
                    max={ozelBit}
                    onChange={(e) => setOzelBas(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg text-xs text-[#0F172A] border border-black/10 bg-white focus:outline-none focus:border-[var(--forest)]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">Bitiş</label>
                  <input
                    type="date"
                    value={ozelBit}
                    min={ozelBas}
                    max={trBugun()}
                    onChange={(e) => setOzelBit(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg text-xs text-[#0F172A] border border-black/10 bg-white focus:outline-none focus:border-[var(--forest)]"
                  />
                </div>
                <button
                  onClick={() => { setMod("ozel"); setTarihAcik(false); setOzelFormAcik(false); }}
                  className="w-full py-2 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ background: "var(--forest)" }}
                >
                  Uygula
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── 2. Hero KPI ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
        {/* Tamamlanma oranı */}
        <div className="rounded-2xl border border-black/8 bg-white p-5">
          <p className="label-caps mb-2">Tamamlanma oranı · {donemEtiket}</p>
          <div className="flex items-baseline gap-3 mb-1">
            <span className="font-number font-semibold tabular-nums"
              style={{ fontSize: 36, letterSpacing: "-0.02em", color: "var(--forest)" }}>
              %{tamamlanmaOrani}
            </span>
            {oncekiStats.toplam > 0 && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full tabular-nums"
                style={{
                  background: oranDelta >= 0 ? "rgba(16,185,129,0.12)" : "rgba(201,118,118,0.12)",
                  color:      oranDelta >= 0 ? "#047857"               : "#C97676",
                }}>
                {oranDelta >= 0 ? "+" : ""}{oranDelta} puan
              </span>
            )}
          </div>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            {stats.tamamlandi} / {stats.toplam} görev
            {oncekiStats.toplam > 0 && (oranDelta >= 0 ? " · iyileşme" : " · gerileme")}
          </p>

          {/* Segmentli bar */}
          <div className="flex h-1.5 rounded-full overflow-hidden mt-4 bg-gray-100">
            {stats.tamamlandi > 0 && <div style={{ flex: stats.tamamlandi, background: "#10B981" }} />}
            {stats.devam      > 0 && <div style={{ flex: stats.devam,      background: "#F59E0B" }} />}
            {stats.yapilacak  > 0 && <div style={{ flex: stats.yapilacak,  background: "#94A3B8" }} />}
            {stats.geciken    > 0 && <div style={{ flex: stats.geciken,    background: "#C97676" }} />}
          </div>

          {/* Lejant */}
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 text-[11px]" style={{ color: "var(--text-secondary)" }}>
            {[
              { label: "Tamamlandı", deger: stats.tamamlandi, renk: "#10B981" },
              { label: "Devam",      deger: stats.devam,      renk: "#F59E0B" },
              { label: "Bekliyor",   deger: stats.yapilacak,  renk: "#94A3B8" },
              { label: "Geciken",    deger: stats.geciken,    renk: "#C97676" },
            ].map((s) => (
              <span key={s.label} className="inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.renk }} />
                {s.label} <span className="font-number tabular-nums">{s.deger}</span>
              </span>
            ))}
          </div>
        </div>

        {/* 2 mini KPI */}
        <div className="grid grid-rows-2 gap-2.5">
          <div className="rounded-2xl border border-black/8 bg-white px-4 py-3">
            <p className="label-caps mb-1">Ort. tamamlanma süresi</p>
            <p className="font-number font-semibold tabular-nums" style={{ fontSize: 22 }}>
              {ortSure !== null ? ortSure : "—"}
              {ortSure !== null && <span className="text-xs text-gray-400 font-normal"> gün</span>}
            </p>
          </div>
          <div className="rounded-2xl border border-black/8 bg-white px-4 py-3 flex items-center justify-between">
            <div>
              <p className="label-caps mb-1">Geciken görev</p>
              <p className="font-number font-semibold tabular-nums"
                style={{ fontSize: 22, color: stats.geciken > 0 ? "#C97676" : "#0F172A" }}>
                {stats.geciken}
              </p>
            </div>
            {stats.geciken > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full"
                style={{ background: "rgba(201,118,118,0.1)", color: "#C97676" }}>
                İlgi bekliyor
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── 3. Sekme bar + Görev listesi ── */}
      <div className="rounded-xl border border-black/8 bg-white overflow-hidden">
        {/* Sekmeler */}
        <div className="flex items-stretch border-b border-black/8 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {sekmeler.map(({ key, label, sayi }) => (
            <button
              key={key}
              onClick={() => setSekme(key)}
              className="flex items-center gap-1.5 px-4 py-3 text-xs font-medium whitespace-nowrap border-b-2 transition-all shrink-0"
              style={{
                borderBottomColor: sekme === key ? "var(--forest)"       : "transparent",
                color:             sekme === key ? "var(--forest)"       : "#64748B",
                backgroundColor:   sekme === key ? "rgba(15,61,46,0.03)" : "transparent",
              }}
            >
              {label}
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold tabular-nums"
                style={{
                  background: sekme === key ? "rgba(15,61,46,0.1)" : "rgba(0,0,0,0.05)",
                  color:      sekme === key ? "var(--forest)"       : "#94A3B8",
                }}>
                {sayi}
              </span>
            </button>
          ))}
        </div>

        {/* Filtre çubuğu */}
        <div className="flex flex-wrap gap-2 px-4 py-3 border-b border-black/5 bg-[#F9FAFB]">
          <div className="flex items-center gap-1.5 flex-1 min-w-40 px-2.5 py-1.5 rounded-lg bg-white border border-black/10">
            <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <input
              value={arama}
              onChange={(e) => setArama(e.target.value)}
              placeholder="Görev ara…"
              className="flex-1 text-xs text-[#0F172A] bg-transparent outline-none placeholder-gray-400"
            />
            {arama && (
              <button onClick={() => setArama("")} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <select
            value={sorumluF}
            onChange={(e) => setSorumluF(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-white border border-black/10 text-xs text-[#0F172A] focus:outline-none focus:border-[var(--forest)] transition-colors"
          >
            <option value="">Tüm Sorumlular</option>
            {donemSorumlular.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>

          <select
            value={oncelikF}
            onChange={(e) => setOncelikF(e.target.value as "" | Oncelik)}
            className="px-2.5 py-1.5 rounded-lg bg-white border border-black/10 text-xs text-[#0F172A] focus:outline-none focus:border-[var(--forest)] transition-colors"
          >
            <option value="">Tüm Öncelikler</option>
            <option value="acil">Acil</option>
            <option value="yuksek">Yüksek</option>
            <option value="normal">Normal</option>
            <option value="dusuk">Düşük</option>
          </select>

          {herhangiFiltre && (
            <button
              onClick={() => { setArama(""); setSorumluF(""); setOncelikF(""); }}
              className="px-2.5 py-1.5 rounded-lg border border-black/10 text-gray-500 text-xs hover:bg-gray-50 transition-colors flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Temizle
            </button>
          )}
        </div>

        {/* Sonuç satırı */}
        <div className="px-5 py-2 border-b border-black/5">
          <p className="text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
            {gosterilecek.length} görev
            {herhangiFiltre && <span className="normal-case font-normal ml-1">(filtrelenmiş)</span>}
          </p>
        </div>

        {/* Liste */}
        {stats.toplam === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-gray-400">Bu dönemde henüz görev oluşturulmamış</p>
          </div>
        ) : gosterilecek.length === 0 ? (
          <p className="text-center text-xs text-gray-400 py-8">
            {herhangiFiltre ? "Bu filtrelerle eşleşen görev bulunamadı" : "Bu kategoride görev yok"}
          </p>
        ) : (
          <div className="max-h-80 overflow-y-auto divide-y divide-black/4">
            {gosterilecek.map((g) => {
              const cfg     = DURUM_CONFIG[g.durum];
              const oncelik = ONCELIK_CONFIG[g.oncelik];
              const gecikti = g.durum !== "tamamlandi" && new Date(g.sonTarih) < simdi;
              return (
                <div key={g.id} className="flex items-center gap-3 px-5 py-3 hover:bg-[#F9FAFB] transition-colors">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: gecikti ? "#ef4444" : cfg.color }} />
                  <p className={`flex-1 text-sm truncate ${g.durum === "tamamlandi" ? "line-through text-gray-400" : "text-[#0F172A]"}`}>
                    {g.baslik}
                  </p>
                  <span className="text-[10px] text-gray-400 shrink-0 hidden sm:block">
                    {trGoster(g.olusturmaTarih, "kisa")}
                  </span>
                  <span className="text-[10px] font-semibold shrink-0" style={{ color: oncelik.color }}>
                    {oncelik.label}
                  </span>
                  <span className="text-[10px] text-gray-400 shrink-0">{g.sorumlu}</span>
                  <span className="text-[10px] shrink-0 font-medium px-1.5 py-0.5 rounded-md whitespace-nowrap"
                    style={{
                      color:           gecikti ? "#ef4444" : cfg.color,
                      backgroundColor: gecikti ? "rgba(239,68,68,0.08)" : `${cfg.color}12`,
                    }}>
                    {gecikti ? "Gecikti" : cfg.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 5. Ekip performansı tablosu ── */}
      {stats.toplam > 0 && (
        <div className="rounded-2xl border border-black/8 bg-white p-4">
          <p className="text-sm font-semibold mb-4">Ekip Performansı</p>

          {ekipPerformans.length === 0 ? (
            <p className="text-xs text-gray-400">Dönemde görev atanmış kişi yok</p>
          ) : (
            <>
              {/* Desktop tablo */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-black/6">
                      <th className="text-left pb-2.5 text-[10px] font-semibold tracking-wider text-gray-400 uppercase">Çalışan</th>
                      <th className="text-right pb-2.5 text-[10px] font-semibold tracking-wider text-gray-400 uppercase">Tamamlanan</th>
                      <th className="text-right pb-2.5 text-[10px] font-semibold tracking-wider text-gray-400 uppercase">Geciken</th>
                      <th className="text-right pb-2.5 text-[10px] font-semibold tracking-wider text-gray-400 uppercase">Tamamlama %</th>
                      <th className="text-right pb-2.5 text-[10px] font-semibold tracking-wider text-gray-400 uppercase">Puan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ekipPerformans.map((s, i) => {
                      const initials      = s.ad.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
                      const madalyaColor  = i === 0 ? "#FFD700" : i === 1 ? "#C0C0C0" : i === 2 ? "#CD7F32" : null;
                      const madalyaTxt    = i === 0 ? "#7A4F00" : "#fff";
                      const puanRenk      = s.puan >= 80 ? "#047857" : s.puan >= 50 ? "var(--forest)" : "#C97676";
                      const puanBg        = s.puan >= 80 ? "rgba(4,120,87,0.12)" : s.puan >= 50 ? "rgba(15,61,46,0.08)" : "rgba(201,118,118,0.12)";
                      return (
                        <tr key={s.ad} className="border-b border-black/4 last:border-0">
                          <td className="py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="relative shrink-0">
                                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-medium"
                                  style={{ background: "rgba(15,61,46,0.08)", color: "var(--forest)" }}>
                                  {initials}
                                </div>
                                {madalyaColor && (
                                  <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold"
                                    style={{ background: madalyaColor, color: madalyaTxt }}>
                                    {i + 1}
                                  </div>
                                )}
                              </div>
                              <span className="text-sm font-medium text-[#0F172A]">{s.ad}</span>
                            </div>
                          </td>
                          <td className="text-right py-3">
                            <span className="font-number tabular-nums font-semibold text-sm"
                              style={{ color: s.tamamlandi > 0 ? "#047857" : "#94a3b8" }}>
                              {s.tamamlandi}
                            </span>
                          </td>
                          <td className="text-right py-3">
                            <span className="font-number tabular-nums font-semibold text-sm"
                              style={{ color: s.geciken > 0 ? "#C97676" : "#94a3b8" }}>
                              {s.geciken}
                            </span>
                          </td>
                          <td className="text-right py-3">
                            <div className="flex flex-col items-end gap-1">
                              <span className="font-number tabular-nums text-sm text-[#0F172A]">%{s.tamamlanmaYuzde}</span>
                              <div className="w-16 h-0.5 rounded-full bg-gray-100 overflow-hidden">
                                <div className="h-full rounded-full"
                                  style={{ width: `${s.tamamlanmaYuzde}%`, background: s.tamamlanmaYuzde >= 70 ? "#047857" : "#C97676" }} />
                              </div>
                            </div>
                          </td>
                          <td className="text-right py-3">
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                              style={{ color: puanRenk, background: puanBg }}>
                              {s.puan}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile liste */}
              <div className="md:hidden divide-y divide-black/4 -mx-1">
                {ekipPerformans.map((s, i) => {
                  const initials     = s.ad.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
                  const madalyaColor = i === 0 ? "#FFD700" : i === 1 ? "#C0C0C0" : i === 2 ? "#CD7F32" : null;
                  const madalyaTxt   = i === 0 ? "#7A4F00" : "#fff";
                  const puanRenk     = s.puan >= 80 ? "#047857" : s.puan >= 50 ? "var(--forest)" : "#C97676";
                  const puanBg       = s.puan >= 80 ? "rgba(4,120,87,0.12)" : s.puan >= 50 ? "rgba(15,61,46,0.08)" : "rgba(201,118,118,0.12)";
                  return (
                    <div key={s.ad} className="flex items-center gap-3 px-1 py-3">
                      <div className="relative shrink-0">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-medium"
                          style={{ background: "rgba(15,61,46,0.08)", color: "var(--forest)" }}>
                          {initials}
                        </div>
                        {madalyaColor && (
                          <div className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold"
                            style={{ background: madalyaColor, color: madalyaTxt }}>
                            {i + 1}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#0F172A] truncate">{s.ad}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          <span style={{ color: s.tamamlandi > 0 ? "#047857" : "#94a3b8" }}>{s.tamamlandi} tam.</span>
                          {" · "}
                          <span style={{ color: s.geciken > 0 ? "#C97676" : "#94a3b8" }}>{s.geciken} gec.</span>
                          {" · "}%{s.tamamlanmaYuzde}
                        </p>
                      </div>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                        style={{ color: puanRenk, background: puanBg }}>
                        {s.puan}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <p className="text-[10px] text-gray-400 mt-3 pt-2.5 border-t border-black/5">
                Puan formülü: Tamamlanan × 5 − Geciken × 8 (0–100). Renk: ≥80 yeşil · 50–79 forest · &lt;50 kırmızı
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
