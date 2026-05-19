"use client";

import { useState } from "react";
import Link from "next/link";

const DAHIL = [
  "Tüm modüllere sınırsız erişim",
  "3 Co-Pilot hesabı dahil",
  "Nakit akışı · Stok · Görevler · SOP",
  "KDV mahsuplaşma ve P&L raporları",
  "Acil durum fonu modülü",
  "Gerçek zamanlı bildirimler",
  "Pilot / Co-Pilot yetki sistemi",
  "7×24 platform erişimi",
];

export default function PricingSection() {
  const [yillik, setYillik] = useState(false);

  const aylikTutar  = 499;
  const yillikTutar = 4790;
  const yillikAylik = Math.round(yillikTutar / 12);

  return (
    <section id="fiyat" className="max-w-6xl mx-auto px-6 py-24">
      {/* Başlık */}
      <div className="text-center mb-14">
        <p className="label-caps mb-3">FİYATLANDIRMA</p>
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
          Tek plan,{" "}
          <span style={{ color: "var(--forest)" }}>şeffaf fiyat</span>
        </h2>
        <p className="mt-3 text-sm text-gray-500">Gizli ücret yok. Ek modül yok. Her şey dahil.</p>

        {/* Toggle */}
        <div className="mt-8 inline-flex items-center gap-3 p-1 rounded-full border border-gray-200 bg-gray-50">
          <button
            onClick={() => setYillik(false)}
            className="px-5 py-2 rounded-full text-sm font-medium transition-all"
            style={!yillik
              ? { background: "var(--forest)", color: "#fff" }
              : { color: "#64748b" }}
          >
            Aylık
          </button>
          <button
            onClick={() => setYillik(true)}
            className="px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2"
            style={yillik
              ? { background: "var(--forest)", color: "#fff" }
              : { color: "#64748b" }}
          >
            Yıllık
            {!yillik && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                %20 indirim
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Kart */}
      <div className="max-w-sm mx-auto rounded-2xl overflow-hidden border-2" style={{ borderColor: "var(--forest)" }}>
        {/* Üst (forest bg) */}
        <div className="px-8 pt-8 pb-6" style={{ background: "var(--forest)" }}>
          <p className="text-xs uppercase tracking-widest mb-3 text-white/60 font-semibold">İşletme Paketi</p>
          <div className="flex items-end gap-2 mb-2">
            <span className="font-number font-black text-white" style={{ fontSize: "3rem", lineHeight: 1 }}>
              {yillik ? yillikAylik : aylikTutar}
            </span>
            <span className="text-white/60 mb-1">TL/ay</span>
          </div>
          {yillik && (
            <p className="text-sm text-white/70">
              {yillikTutar.toLocaleString("tr-TR")} TL/yıl — yılda{" "}
              <span className="font-semibold text-white">
                {(aylikTutar * 12 - yillikTutar).toLocaleString("tr-TR")} TL tasarruf
              </span>
            </p>
          )}
          {!yillik && (
            <p className="text-sm text-white/60">
              Veya {yillikAylik} TL/ay yıllık ödemede
            </p>
          )}
          <p className="text-xs text-white/50 mt-2">İlk 3 Co-Pilot dahil · Her ek Co-Pilot +100 TL/ay</p>
        </div>

        {/* Özellikler */}
        <div className="px-8 py-6 space-y-3 bg-white">
          {DAHIL.map((f) => (
            <div key={f} className="flex items-center gap-3 text-sm text-gray-600">
              <span className="font-bold shrink-0" style={{ color: "var(--leaf)" }}>✓</span>
              {f}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="px-8 pb-8 pt-4 bg-white border-t border-gray-100">
          <Link
            href="/kayit"
            className="w-full block text-center py-3.5 rounded-xl font-bold text-base text-white transition-opacity hover:opacity-90"
            style={{ background: "var(--forest)" }}
          >
            7 Gün Ücretsiz Başla
          </Link>
          <p className="text-center text-xs mt-3 text-gray-400">
            Kredi kartı gerekmez · İstediğiniz zaman iptal
          </p>
        </div>
      </div>
    </section>
  );
}
