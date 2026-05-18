"use client";

import { useMemo } from "react";
import { AlertTriangle, Zap, Shield, TrendingDown } from "lucide-react";
import { useNakit }             from "@/store/nakit";
import { useNakitAkis }          from "@/store/nakitAkis";
import { useAcilFon }            from "@/store/acilFon";
import { useIsletmeGiderleri }   from "@/store/isletmeGiderleri";
import {
  kasaBakiyesi,
  gunlukBurnRate,
  genisMimariRunway,
  kritikBorc7Gun,
  runwayDurum,
  projeksiyon30Gun,
  kritikGunVarMi,
  ilkKritikGun,
} from "@/lib/nakitAkis-engine";

const tl = (n: number) =>
  (n / 100).toLocaleString("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 });

const DURUM_CONFIG = {
  kritik: {
    renk:   "#ef4444",
    bg:     "rgba(239,68,68,0.08)",
    border: "rgba(239,68,68,0.25)",
    icon:   AlertTriangle,
    emoji:  "🔴",
    label:  "Tehlike — İşletme Batış Riskinde!",
  },
  dikkat: {
    renk:   "#fbc024",
    bg:     "rgba(251,192,36,0.08)",
    border: "rgba(251,192,36,0.25)",
    icon:   Zap,
    emoji:  "🟡",
    label:  "Dikkat — Tedarik ve Satışları İnceleyin",
  },
  iyi: {
    renk:   "#22c55e",
    bg:     "rgba(34,197,94,0.08)",
    border: "rgba(34,197,94,0.25)",
    icon:   Shield,
    emoji:  "🟢",
    label:  "Güvenli Rota",
  },
} as const;

export default function RunwayKart() {
  const { islemler }                 = useNakit();
  const { kalemler, tekrarlayanlar } = useNakitAkis();
  const { mevcut: acilFonMevcut }    = useAcilFon();
  const { giderler }                 = useIsletmeGiderleri();

  const hesap = useMemo(() => {
    const kasa            = kasaBakiyesi(islemler);
    const acilFon         = acilFonMevcut();
    const aylikSabit      = giderler.reduce((t, g) => t + g.tutarKurus, 0);
    const gunlukGider     = gunlukBurnRate(islemler, aylikSabit);
    const kritikBorc      = kritikBorc7Gun(kalemler);
    const gun          = genisMimariRunway(kasa, acilFon, kritikBorc, gunlukGider);
    const durum        = runwayDurum(gun);
    const proj         = projeksiyon30Gun(kasa, kalemler, tekrarlayanlar, aylikSabit);
    const kritikProj   = kritikGunVarMi(proj);
    const ilkKritik    = ilkKritikGun(proj);
    const toplamKaynak = kasa + acilFon;

    return { kasa, acilFon, gunlukGider, kritikBorc, gun, durum, proj, kritikProj, ilkKritik, toplamKaynak, aylikSabit };
  }, [islemler, kalemler, tekrarlayanlar, acilFonMevcut, giderler]);

  const cfg = DURUM_CONFIG[hesap.durum];
  const Icon = cfg.icon;
  const tukenme = hesap.gun === 0 && hesap.durum === "kritik";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

      {/* ── Can Suyu kartı ── */}
      <div
        className="sm:col-span-1 p-4 rounded-2xl border space-y-2"
        style={{ backgroundColor: cfg.bg, borderColor: cfg.border }}
      >
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 shrink-0" style={{ color: cfg.renk }} />
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: cfg.renk }}>
            Can Suyu (Runway)
          </p>
        </div>

        {tukenme ? (
          <p className="text-lg font-black text-[#ef4444] leading-tight">
            🚨 Kritik İrtifa Kaybı:<br />Nakit Tükendi!
          </p>
        ) : (
          <p className="text-4xl font-black" style={{ color: cfg.renk }}>
            {hesap.gun === Infinity ? "∞" : hesap.gun}
            <span className="text-base font-medium ml-1">gün</span>
          </p>
        )}

        <p className="text-[10px] font-medium" style={{ color: cfg.renk }}>
          {cfg.emoji} {cfg.label}
        </p>

        {/* Günlük harcama hızı */}
        <div className="pt-1 border-t border-[rgba(255,255,255,0.05)] space-y-0.5">
          <p className="text-[10px] text-[#64748b]">
            Günlük harcama hızınız:{" "}
            <span className="text-[#94a3b8] font-semibold">{tl(hesap.gunlukGider)}</span>
          </p>
          {hesap.aylikSabit > 0 && (
            <p className="text-[10px] text-[#475569]">
              Sabit giderler: {tl(hesap.aylikSabit)}/ay dahil
            </p>
          )}
        </div>

        {/* 7 günlük kritik borç */}
        {hesap.kritikBorc > 0 && (
          <p className="text-[10px] text-[#ef4444]">
            7 günlük yaklaşan borç: {tl(hesap.kritikBorc)}
          </p>
        )}
      </div>

      {/* ── Toplam kaynak ── */}
      <div className="glass-card p-4 rounded-2xl space-y-2">
        <p className="text-xs text-[#64748b] font-semibold uppercase tracking-wide">
          Toplam Kaynak
        </p>
        <p className={`text-3xl font-black ${hesap.toplamKaynak >= 0 ? "text-white" : "text-[#ef4444]"}`}>
          {tl(hesap.toplamKaynak)}
        </p>
        <div className="text-[10px] text-[#475569] space-y-0.5">
          <p>Kasa: <span className="text-[#94a3b8]">{tl(hesap.kasa)}</span></p>
          {hesap.acilFon > 0 && (
            <p>Acil fon: <span className="text-[#22c55e]">+{tl(hesap.acilFon)}</span></p>
          )}
        </div>
      </div>

      {/* ── 30 günlük projeksiyon ── */}
      <div className={`glass-card p-4 rounded-2xl space-y-2 ${hesap.kritikProj ? "border border-[rgba(239,68,68,0.25)] bg-[rgba(239,68,68,0.05)]" : ""}`}>
        <div className="flex items-center gap-2">
          <TrendingDown className={`w-4 h-4 ${hesap.kritikProj ? "text-[#ef4444]" : "text-[#64748b]"}`} />
          <p className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">
            30 Günlük Projeksiyon
          </p>
        </div>

        {hesap.kritikProj && hesap.ilkKritik ? (
          <>
            <p className="text-sm font-bold text-[#ef4444]">⚠ Kritik Nakit Sıkışıklığı Riski</p>
            <p className="text-[10px] text-[#94a3b8]">
              {hesap.ilkKritik.etiket} tarihinde bakiye sıfırın altına düşüyor.
              En düşük: {tl(Math.min(...hesap.proj.map((g) => g.bakiye)))}
            </p>
          </>
        ) : (
          <>
            <p className="text-sm font-bold text-[#22c55e]">30 gün boyunca pozitif</p>
            <p className="text-[10px] text-[#475569]">
              En düşük projeksiyon:{" "}
              {tl(Math.min(...hesap.proj.map((g) => g.bakiye)))}
            </p>
          </>
        )}
      </div>

    </div>
  );
}
