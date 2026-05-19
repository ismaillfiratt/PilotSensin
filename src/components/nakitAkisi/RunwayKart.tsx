"use client";

import { useMemo } from "react";
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
} from "@/lib/nakitAkis-engine";
import { formatTL } from "@/lib/para";

export default function RunwayKart() {
  const { islemler }                 = useNakit();
  const { kalemler, tekrarlayanlar } = useNakitAkis();
  const { mevcut: acilFonMevcut }    = useAcilFon();
  const { giderler }                 = useIsletmeGiderleri();

  const hesap = useMemo(() => {
    const kasa        = kasaBakiyesi(islemler);
    const acilFon     = acilFonMevcut();
    const aylikSabit  = giderler.reduce((t, g) => t + g.tutarKurus, 0);
    const gunlukGider = gunlukBurnRate(islemler, aylikSabit);
    const kritikBorc  = kritikBorc7Gun(kalemler);
    const gun         = genisMimariRunway(kasa, acilFon, kritikBorc, gunlukGider);
    const durum       = runwayDurum(gun);
    const proj        = projeksiyon30Gun(kasa, kalemler, tekrarlayanlar, aylikSabit);
    const kritikProj  = kritikGunVarMi(proj);
    const toplamKaynak = kasa + acilFon;
    const enDusuk     = proj.length ? Math.min(...proj.map((g) => g.bakiye)) : 0;

    return { kasa, acilFon, gunlukGider, kritikBorc, gun, durum, kritikProj, toplamKaynak, aylikSabit, enDusuk };
  }, [islemler, kalemler, tekrarlayanlar, acilFonMevcut, giderler]);

  const risk = hesap.durum === "kritik";

  const kritikTarih = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + (hesap.gun === Infinity ? 999 : hesap.gun));
    return hesap.gun === Infinity ? "—" : d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
  }, [hesap.gun]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

      {/* ── Can Suyu ── */}
      <div className="rounded-xl border border-black/8 bg-white p-5 space-y-3">
        <div className="flex items-center justify-between">
          <p className="label-caps">CAN SUYU</p>
          {risk && (
            <span className="text-[10px] px-2 py-1 rounded-full bg-[#C97676]/10 text-[#C97676] font-medium">
              Tehlike — Batış riski
            </span>
          )}
        </div>

        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="font-number font-semibold text-3xl text-[#0F172A]">
            {hesap.gun === Infinity ? "∞" : hesap.gun}
          </span>
          <span className="text-sm" style={{ color: "var(--text-secondary)" }}>gün</span>
        </div>
        <p className="text-xs font-medium" style={{ color: hesap.durum === "kritik" ? "#C97676" : hesap.durum === "dikkat" ? "#F59E0B" : "var(--color-success)" }}>
          {hesap.gun === Infinity
            ? "Yeterli nakit rezervi var"
            : hesap.gun === 0
            ? "Nakit tükendi — acil önlem gerekli"
            : hesap.durum === "kritik"
            ? `${hesap.gun} gün içinde nakit kritik seviyeye düşebilir`
            : hesap.durum === "dikkat"
            ? `${hesap.gun} gün yeterli — giderleri izle`
            : `${hesap.gun} gün yeterli nakit`}
        </p>

        <div className="pt-3 border-t border-black/5 grid grid-cols-3 gap-3 text-xs">
          <div>
            <p className="mb-1" style={{ color: "var(--text-secondary)" }}>Kasa</p>
            <p className="font-number font-medium">{formatTL(hesap.kasa)}</p>
          </div>
          <div>
            <p className="mb-1" style={{ color: "var(--text-secondary)" }}>Aylık gider</p>
            <p className="font-number font-medium">{formatTL(hesap.aylikSabit)}</p>
          </div>
          <div>
            <p className="mb-1" style={{ color: "var(--text-secondary)" }}>Kritik gün</p>
            <p className="font-number font-medium">{kritikTarih}</p>
          </div>
        </div>
      </div>

      {/* ── Toplam kaynak ── */}
      <div className="rounded-xl border border-black/8 bg-white p-5 space-y-3">
        <p className="label-caps">TOPLAM KAYNAK</p>
        <div className="flex items-baseline gap-2">
          <span className={`font-number font-semibold text-3xl ${hesap.toplamKaynak >= 0 ? "text-[#0F172A]" : "text-[#C97676]"}`}>
            {formatTL(hesap.toplamKaynak)}
          </span>
        </div>
        <div className="pt-3 border-t border-black/5 space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span style={{ color: "var(--text-secondary)" }}>Kasa</span>
            <span className="font-number font-medium">{formatTL(hesap.kasa)}</span>
          </div>
          {hesap.acilFon > 0 && (
            <div className="flex justify-between">
              <span style={{ color: "var(--text-secondary)" }}>Acil fon</span>
              <span className="font-number font-medium" style={{ color: "var(--color-success)" }}>
                +{formatTL(hesap.acilFon)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Projeksiyon özeti ── */}
      <div className={`rounded-xl border bg-white p-5 space-y-3 ${
        hesap.kritikProj
          ? "border-[#C97676]/20 bg-[#C97676]/5"
          : "border-black/8"
      }`}>
        <div className="flex items-center justify-between">
          <p className="label-caps">30 GÜN PROJEKSİYON</p>
          {hesap.kritikProj && (
            <span className="text-[10px] px-2 py-1 rounded-full bg-[#C97676]/10 text-[#C97676] font-medium">
              Risk
            </span>
          )}
        </div>

        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span style={{ color: "var(--text-secondary)" }}>En düşük bakiye</span>
            <span className={`font-number font-medium ${hesap.enDusuk < 0 ? "text-[#C97676]" : "text-[#0F172A]"}`}>
              {formatTL(hesap.enDusuk)}
            </span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: "var(--text-secondary)" }}>Günlük hız</span>
            <span className="font-number font-medium">{formatTL(hesap.gunlukGider)}/gün</span>
          </div>
          {hesap.kritikBorc > 0 && (
            <div className="flex justify-between">
              <span style={{ color: "var(--text-secondary)" }}>7 günlük borç</span>
              <span className="font-number font-medium text-[#C97676]">{formatTL(hesap.kritikBorc)}</span>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
