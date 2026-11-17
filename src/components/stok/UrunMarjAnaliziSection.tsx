"use client";

import { useState, useMemo } from "react";
import { ChevronRight } from "lucide-react";
import { useStok } from "@/store/stok";
import { useUrunMarjAnalizi } from "@/store/urunMarjAnalizi";
import { tumUrunMarjlari, type UrunMarjHesap } from "@/lib/selectors/urun-marj";
import UrunMarjDetayPanel from "./UrunMarjDetayPanel";

const tl = (n: number) =>
  n.toLocaleString("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 });

function DurumPill({ durumu }: { durumu: UrunMarjHesap["durumu"] }) {
  const map = {
    kar:     { label: "Kâr",      bg: "bg-emerald-50 text-emerald-700" },
    zarar:   { label: "Zarar",    bg: "bg-[#C97676]/10 text-[#C97676]" },
    basabas: { label: "Başabaş",  bg: "bg-gray-100 text-gray-500"      },
    alarm:   { label: "Hedef altı", bg: "bg-amber-50 text-amber-700"   },
  };
  const { label, bg } = map[durumu];
  return (
    <span className={`inline-flex items-center justify-center text-[10px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${bg}`}>
      {label}
    </span>
  );
}

export default function UrunMarjAnaliziSection() {
  const { urunler }  = useStok();
  const { kayitlar } = useUrunMarjAnalizi();
  const [secili, setSecili] = useState<string | null>(null);

  const marjlar = useMemo(
    () => tumUrunMarjlari(urunler.filter((u) => !u.silindi), kayitlar),
    [urunler, kayitlar]
  );

  const alarmCount = marjlar.filter((m) => m.alarmAktif || m.durumu === "zarar").length;

  if (marjlar.length === 0) {
    return (
      <section className="py-2">
        <h2 className="text-sm font-semibold mb-1">Ürün marj analizi</h2>
        <p className="text-xs mb-4" style={{ color: "var(--text-secondary)" }}>
          Her ürünün gerçek kârlılığı — kargo, reklam, paketleme dahil
        </p>
        <div className="rounded-xl border border-black/8 bg-white p-8 text-center">
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Ürün ekleyin ve satış fiyatı girin — marj analizi otomatik oluşur.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-2">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold">Ürün marj analizi</h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
            Her ürünün gerçek kârlılığı — kargo, reklam, paketleme dahil
          </p>
        </div>
        {alarmCount > 0 && (
          <span className="text-[10px] px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-medium shrink-0">
            {alarmCount} ürün hedef altında
          </span>
        )}
      </div>

      {/* Desktop tablo */}
      <div className="hidden md:block rounded-xl border border-black/8 bg-white overflow-hidden">
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_90px_80px_28px] gap-3 px-5 py-3 text-[10px] font-semibold uppercase tracking-wider border-b border-black/5 bg-[#F9FAFB]"
          style={{ color: "var(--text-secondary)" }}>
          <span>Ürün</span>
          <span className="text-right">Satış Fiyatı</span>
          <span className="text-right">Toplam Gider</span>
          <span className="text-right">Net Kâr</span>
          <span className="text-right">Marj %</span>
          <span className="text-center">Durum</span>
          <span />
        </div>

        <div className="divide-y divide-black/4">
          {marjlar.map((m) => {
            const marjRenk = m.durumu === "kar"
              ? "var(--color-success)"
              : m.durumu === "alarm" ? "#F59E0B"
              : m.durumu === "zarar" ? "var(--color-danger)"
              : "var(--text-secondary)";
            return (
              <button key={m.urunId}
                onClick={() => setSecili(m.urunId)}
                className="w-full grid grid-cols-[2fr_1fr_1fr_1fr_90px_80px_28px] gap-3 px-5 py-3.5 items-center hover:bg-[#F9FAFB] transition-colors text-left">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#0F172A] truncate">{m.urunAd}</p>
                  {m.satisFiyati === 0 && (
                    <p className="text-[10px] text-amber-600 mt-0.5">Satış fiyatı girilmemiş</p>
                  )}
                </div>
                <span className="font-number text-sm text-right text-gray-500">
                  {m.satisFiyati > 0 ? tl(m.satisFiyati) : "—"}
                </span>
                <span className="font-number text-sm text-right text-gray-500">
                  {m.satisFiyati > 0 ? tl(m.toplamDirectNet) : "—"}
                </span>
                <span className="font-number text-sm text-right font-medium"
                  style={{ color: m.satisFiyati > 0 ? marjRenk : "var(--text-secondary)" }}>
                  {m.satisFiyati > 0 ? `${m.birimBrutKar >= 0 ? "+" : ""}${tl(m.birimBrutKar)}` : "—"}
                </span>
                <span className="font-number text-sm text-right font-semibold"
                  style={{ color: m.satisFiyati > 0 ? marjRenk : "var(--text-secondary)" }}>
                  {m.satisFiyati > 0 ? `%${m.birimBrutMarj.toFixed(1)}` : "—"}
                </span>
                <div className="flex justify-center">
                  {m.satisFiyati > 0 ? <DurumPill durumu={m.durumu} /> : <span className="text-gray-300 text-xs">—</span>}
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </button>
            );
          })}
        </div>

        <div className="px-5 py-3 border-t border-black/5 text-[10px]" style={{ color: "var(--text-secondary)" }}>
          {marjlar.length} ürün · Direct costs: mal maliyeti, kargo, paketleme, Shopify komisyonu
        </div>
      </div>

      {/* Mobile kartlar */}
      <div className="md:hidden space-y-2">
        {marjlar.map((m) => {
          const marjRenk = m.durumu === "kar"
            ? "var(--color-success)"
            : m.durumu === "alarm" ? "#F59E0B"
            : m.durumu === "zarar" ? "var(--color-danger)"
            : "var(--text-secondary)";
          return (
            <button key={m.urunId}
              onClick={() => setSecili(m.urunId)}
              className="w-full rounded-xl border border-black/8 bg-white p-4 text-left hover:bg-[#F9FAFB] transition-colors">
              <div className="flex items-start justify-between gap-2 mb-3">
                <p className="text-sm font-medium text-[#0F172A] truncate flex-1">{m.urunAd}</p>
                {m.satisFiyati > 0
                  ? <DurumPill durumu={m.durumu} />
                  : <span className="text-[10px] text-amber-600">Fiyat girilmemiş</span>}
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p style={{ color: "var(--text-secondary)" }}>Satış</p>
                  <p className="font-number font-medium text-[#0F172A] mt-0.5">
                    {m.satisFiyati > 0 ? tl(m.satisFiyati) : "—"}
                  </p>
                </div>
                <div>
                  <p style={{ color: "var(--text-secondary)" }}>Net kâr</p>
                  <p className="font-number font-medium mt-0.5" style={{ color: marjRenk }}>
                    {m.satisFiyati > 0 ? `${m.birimBrutKar >= 0 ? "+" : ""}${tl(m.birimBrutKar)}` : "—"}
                  </p>
                </div>
                <div className="text-right">
                  <p style={{ color: "var(--text-secondary)" }}>Marj</p>
                  <p className="font-number font-semibold mt-0.5" style={{ color: marjRenk }}>
                    {m.satisFiyati > 0 ? `%${m.birimBrutMarj.toFixed(1)}` : "—"}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Detay paneli */}
      {secili && (
        <UrunMarjDetayPanel urunId={secili} onClose={() => setSecili(null)} />
      )}
    </section>
  );
}
