"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, ShoppingCart, Trash2, CalendarRange, X } from "lucide-react";
import { useSatislar } from "@/store/satislar";

const tl = (n: number) =>
  (n / 100).toLocaleString("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 2 });

function zaman(iso: string) {
  return new Date(iso).toLocaleString("tr-TR", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function yerelTarih(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function bugunIso() { return yerelTarih(new Date()); }

type Donem = "bugun" | "hafta" | "ay" | "ozel";

export default function SatisGecmisi() {
  const { kayitlar, sil } = useSatislar();
  const [donem, setDonem] = useState<Donem>("ay");
  const [ozelAcik, setOzelAcik] = useState(false);
  const [baslangic, setBaslangic] = useState(() => {
    const d = new Date(); d.setDate(1); return yerelTarih(d);
  });
  const [bitis, setBitis] = useState(bugunIso);

  const filtrelenmis = useMemo(() => {
    const simdi = new Date();
    let bas: Date;
    let bit: Date;

    if (donem === "bugun") {
      bas = new Date(simdi.getFullYear(), simdi.getMonth(), simdi.getDate(), 0, 0, 0, 0);
      bit = new Date(simdi.getFullYear(), simdi.getMonth(), simdi.getDate(), 23, 59, 59, 999);
    } else if (donem === "hafta") {
      bas = new Date(simdi); bas.setDate(simdi.getDate() - 7); bas.setHours(0, 0, 0, 0);
      bit = new Date(simdi); bit.setHours(23, 59, 59, 999);
    } else if (donem === "ay") {
      bas = new Date(simdi); bas.setDate(simdi.getDate() - 30); bas.setHours(0, 0, 0, 0);
      bit = new Date(simdi); bit.setHours(23, 59, 59, 999);
    } else {
      bas = new Date(baslangic); bas.setHours(0, 0, 0, 0);
      bit = new Date(bitis);     bit.setHours(23, 59, 59, 999);
    }

    return kayitlar.filter((k) => {
      const t = new Date(k.tarih);
      return t >= bas && t <= bit;
    });
  }, [kayitlar, donem, baslangic, bitis]);

  const toplamCiroKurus = filtrelenmis.reduce((t, k) => t + k.toplamCiroKurus, 0);
  const toplamBrut = filtrelenmis.reduce((t, k) => t + k.brutKarKurus, 0);
  const toplamKasa = filtrelenmis.reduce((t, k) => t + k.kasaGirisKurus, 0);

  const donemler: { v: Donem; label: string }[] = [
    { v: "bugun", label: "Bugün" },
    { v: "hafta",  label: "Son 1 Hafta" },
    { v: "ay",     label: "Son 1 Ay" },
    { v: "ozel",   label: "Özel Tarih" },
  ];

  if (kayitlar.length === 0) {
    return (
      <div className="glass-card rounded-2xl py-12 text-center space-y-2">
        <ShoppingCart className="w-8 h-8 mx-auto text-[#334155] opacity-50" />
        <p className="text-sm text-[#64748b]">Henüz satış kaydı yok</p>
        <p className="text-xs text-[#475569]">
          Stok sayfasındaki "Sat" butonunu kullanarak satış yapın
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Dönem filtresi */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          {/* Yatay kaydırmalı chip'ler */}
          <div className="overflow-x-auto scrollbar-none -mx-1 px-1 w-full sm:w-auto">
            <div className="flex gap-1 p-1 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] w-max">
            {donemler.map(({ v, label }) => (
              <button
                key={v}
                onClick={() => { setDonem(v); if (v === "ozel") setOzelAcik(true); else setOzelAcik(false); }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap"
                style={{
                  backgroundColor: donem === v ? "rgba(34,197,94,0.15)" : "transparent",
                  color:           donem === v ? "#22c55e" : "#64748b",
                  border:          donem === v ? "1px solid rgba(34,197,94,0.3)" : "1px solid transparent",
                }}
              >
                {v === "ozel" ? (
                  <span className="flex items-center gap-1">
                    <CalendarRange className="w-3 h-3" />
                    {label}
                  </span>
                ) : label}
              </button>
            ))}
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 text-xs text-[#64748b] flex-wrap">
            <span>Ciro: <span className="text-white font-semibold">{tl(toplamCiroKurus)}</span></span>
            <span>Brüt Kâr: <span className="font-semibold" style={{ color: toplamBrut >= 0 ? "#22c55e" : "#ef4444" }}>{tl(toplamBrut)}</span></span>
            <span>Kasaya: <span className="text-[#fbc024] font-semibold">{tl(toplamKasa)}</span></span>
          </div>
        </div>

        {/* Özel tarih seçici */}
        <AnimatePresence>
          {donem === "ozel" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ overflow: "hidden" }}
            >
              <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl border border-[rgba(34,197,94,0.2)] bg-[rgba(34,197,94,0.04)]">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-[#94a3b8] font-medium whitespace-nowrap">Başlangıç</label>
                  <input
                    type="date"
                    value={baslangic}
                    max={bitis}
                    onChange={(e) => setBaslangic(e.target.value)}
                    className="px-3 py-1.5 rounded-lg text-xs text-white border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.05)] focus:outline-none focus:border-[rgba(34,197,94,0.4)] transition-colors [color-scheme:dark]"
                  />
                </div>
                <span className="text-[#94a3b8] text-xs">—</span>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-[#94a3b8] font-medium whitespace-nowrap">Bitiş</label>
                  <input
                    type="date"
                    value={bitis}
                    min={baslangic}
                    max={bugunIso()}
                    onChange={(e) => setBitis(e.target.value)}
                    className="px-3 py-1.5 rounded-lg text-xs text-white border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.05)] focus:outline-none focus:border-[rgba(34,197,94,0.4)] transition-colors [color-scheme:dark]"
                  />
                </div>
                <button
                  onClick={() => { setBaslangic(() => { const d = new Date(); d.setDate(1); return yerelTarih(d); }); setBitis(bugunIso()); }}
                  className="ml-auto flex items-center gap-1 text-xs text-[#64748b] hover:text-[#94a3b8] transition-colors"
                >
                  <X className="w-3 h-3" /> Sıfırla
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Tablo */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="hidden md:grid md:grid-cols-[1fr_80px_80px_90px_90px_90px_36px] gap-3 px-5 py-3 text-[10px] font-semibold text-[#475569] uppercase tracking-wider border-b border-[rgba(255,255,255,0.05)]">
          <span>Ürün / Tarih</span>
          <span className="text-right">Adet</span>
          <span className="text-right">B. Fiyat</span>
          <span className="text-right">Ciro</span>
          <span className="text-right">SMM</span>
          <span className="text-right">Brüt Kâr</span>
          <span />
        </div>
        <div className="divide-y divide-[rgba(255,255,255,0.04)] max-h-[32rem] overflow-y-auto">
          {filtrelenmis.length === 0 ? (
            <div className="py-8 text-center text-sm text-[#64748b]">Bu dönemde satış yok</div>
          ) : filtrelenmis.map((k, i) => (
            <motion.div key={k.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}>
              {/* Mobile kart */}
              <div className="md:hidden px-4 py-3 space-y-2 hover:bg-[rgba(34,197,94,0.03)] transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-[#22c55e] shrink-0" />
                      <p className="text-sm text-white font-medium truncate">{k.urunAd}</p>
                    </div>
                    <p className="text-[10px] text-[#475569] mt-0.5">{zaman(k.tarih)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[rgba(34,197,94,0.1)] text-[#22c55e]">
                      {k.tip === "urun" ? "Ürün" : "Hizmet"}
                    </span>
                    <button onClick={() => sil(k.id)} className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-[#475569] active:text-[#ef4444] transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div><p className="text-[#64748b]">Adet × Fiyat</p><p className="text-white font-medium">{k.adet} × {tl(k.birimSatisFiyatiKurus)}</p></div>
                  <div><p className="text-[#64748b]">Ciro</p><p className="text-white font-medium">{tl(k.toplamCiroKurus)}</p></div>
                  <div className="text-right"><p className="text-[#64748b]">Brüt Kâr</p>
                    <p className="font-bold" style={{ color: k.brutKarKurus >= 0 ? "#22c55e" : "#ef4444" }}>
                      {k.brutKarKurus >= 0 ? "+" : ""}{tl(k.brutKarKurus)}
                    </p>
                  </div>
                </div>
              </div>
              {/* Desktop satır */}
              <div className="hidden md:grid md:grid-cols-[1fr_80px_80px_90px_90px_90px_36px] gap-3 px-5 py-3.5 items-center hover:bg-[rgba(34,197,94,0.03)] transition-colors">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-3.5 h-3.5 text-[#22c55e] shrink-0" />
                    <p className="text-sm text-white font-medium truncate">{k.urunAd}</p>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[rgba(34,197,94,0.1)] text-[#22c55e] shrink-0">
                      {k.tip === "urun" ? "Ürün" : "Hizmet"}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#475569] mt-0.5">{zaman(k.tarih)}</p>
                </div>
                <span className="text-sm text-[#94a3b8] text-right">{k.adet}</span>
                <span className="text-sm text-[#94a3b8] text-right">{tl(k.birimSatisFiyatiKurus)}</span>
                <span className="text-sm text-white text-right font-medium">{tl(k.toplamCiroKurus)}</span>
                <span className="text-sm text-[#ef4444] text-right">{tl(k.birimAlisFiyatiKurus * k.adet)}</span>
                <span className="text-sm font-bold text-right" style={{ color: k.brutKarKurus >= 0 ? "#22c55e" : "#ef4444" }}>
                  {k.brutKarKurus >= 0 ? "+" : ""}{tl(k.brutKarKurus)}
                </span>
                <button onClick={() => sil(k.id)} className="w-7 h-7 flex items-center justify-center rounded-lg text-[#475569] hover:text-[#ef4444] transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
        {filtrelenmis.length > 0 && (
          <div className="px-5 py-3 border-t border-[rgba(255,255,255,0.05)] text-[10px] text-[#475569]">
            {filtrelenmis.length} satış kaydı
          </div>
        )}
      </div>
    </div>
  );
}
