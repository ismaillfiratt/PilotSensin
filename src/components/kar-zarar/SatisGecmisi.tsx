"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, ShoppingCart, Trash2, CalendarRange, X, Loader2 } from "lucide-react";
import { useSatislar } from "@/store/satislar";
import { satisIade } from "@/lib/islemler";

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

const COL = "md:grid-cols-[1fr_52px_106px_106px_106px_112px_36px]";

export default function SatisGecmisi() {
  const { kayitlar, sil } = useSatislar();
  const [donem, setDonem] = useState<Donem>("ay");
  const [baslangic, setBaslangic] = useState(() => {
    const d = new Date(); d.setDate(1); return yerelTarih(d);
  });
  const [bitis, setBitis] = useState(bugunIso);
  const [siliniyor, setSiliniyor] = useState<string | null>(null);

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
      if (k.silindi || k.iadeEdildi) return false;
      const t = new Date(k.tarih);
      return t >= bas && t <= bit;
    });
  }, [kayitlar, donem, baslangic, bitis]);

  const toplamCiroKurus = filtrelenmis.reduce((t, k) => t + k.toplamCiroKurus, 0);
  const toplamBrut      = filtrelenmis.reduce((t, k) => t + k.brutKarKurus, 0);
  const toplamKasa      = filtrelenmis.reduce((t, k) => t + k.kasaGirisKurus, 0);

  const donemler: { v: Donem; label: string }[] = [
    { v: "bugun", label: "Bugün" },
    { v: "hafta",  label: "Son 1 Hafta" },
    { v: "ay",     label: "Son 1 Ay" },
    { v: "ozel",   label: "Özel Tarih" },
  ];

  const handleSil = async (id: string, islemId?: string) => {
    if (siliniyor) return;
    setSiliniyor(id);
    try {
      if (islemId) {
        await satisIade(islemId);
      } else {
        await sil(id);
      }
    } finally {
      setSiliniyor(null);
    }
  };

  if (kayitlar.filter((k) => !k.silindi && !k.iadeEdildi).length === 0) {
    return (
      <div className="rounded-xl border border-black/8 bg-white py-12 text-center space-y-2">
        <ShoppingCart className="w-8 h-8 mx-auto" style={{ color: "var(--text-secondary)" }} />
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Henüz satış kaydı yok</p>
        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
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
          <div className="overflow-x-auto scrollbar-none -mx-1 px-1 w-full sm:w-auto">
            <div className="flex gap-1 p-1 rounded-xl bg-[#F3F4F6] border border-black/5 w-max">
              {donemler.map(({ v, label }) => (
                <button
                  key={v}
                  onClick={() => setDonem(v)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap"
                  style={{
                    backgroundColor: donem === v ? "var(--bg-tertiary)" : "transparent",
                    color:           donem === v ? "var(--text-primary)" : "var(--text-secondary)",
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
          <div className="flex items-center gap-4 text-xs flex-wrap">
            <span style={{ color: "var(--text-secondary)" }}>
              Ciro: <span className="font-number font-semibold text-[#0F172A]">{tl(toplamCiroKurus)}</span>
            </span>
            <span style={{ color: "var(--text-secondary)" }}>
              Brüt Kâr: <span className="font-number font-semibold" style={{ color: toplamBrut >= 0 ? "var(--color-success)" : "var(--color-danger)" }}>{tl(toplamBrut)}</span>
            </span>
            <span style={{ color: "var(--text-secondary)" }}>
              Kasaya: <span className="font-number font-semibold" style={{ color: "var(--text-primary)" }}>{tl(toplamKasa)}</span>
            </span>
          </div>
        </div>

        {/* Özel tarih seçici */}
        <AnimatePresence>
          {donem === "ozel" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
              style={{ overflow: "hidden" }}
            >
              <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl border border-black/8 bg-[#F3F4F6]">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium whitespace-nowrap" style={{ color: "var(--text-secondary)" }}>Başlangıç</label>
                  <input type="date" value={baslangic} max={bitis}
                    onChange={(e) => setBaslangic(e.target.value)}
                    className="px-3 py-1.5 rounded-lg text-xs text-[#0F172A] border border-black/10 bg-white focus:outline-none focus:border-[var(--border-medium)] transition-colors"
                  />
                </div>
                <span className="text-gray-400 text-xs">—</span>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium whitespace-nowrap" style={{ color: "var(--text-secondary)" }}>Bitiş</label>
                  <input type="date" value={bitis} min={baslangic} max={bugunIso()}
                    onChange={(e) => setBitis(e.target.value)}
                    className="px-3 py-1.5 rounded-lg text-xs text-[#0F172A] border border-black/10 bg-white focus:outline-none focus:border-[var(--border-medium)] transition-colors"
                  />
                </div>
                <button
                  onClick={() => { setBaslangic(() => { const d = new Date(); d.setDate(1); return yerelTarih(d); }); setBitis(bugunIso()); }}
                  className="ml-auto flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <X className="w-3 h-3" /> Sıfırla
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Tablo — header + satırlar aynı scroll container'da → hizalama garantili */}
      <div className="rounded-xl border border-black/8 bg-white overflow-hidden">
        <div className="max-h-[32rem] overflow-y-auto">
          {/* Yapışkan başlık */}
          <div className={`hidden md:grid ${COL} gap-4 px-5 py-3 text-[10px] font-semibold uppercase tracking-wider border-b border-black/5 bg-white sticky top-0 z-10`}
            style={{ color: "var(--text-secondary)" }}>
            <span>Ürün / Tarih</span>
            <span className="text-right">Adet</span>
            <span className="text-right">B. Fiyat</span>
            <span className="text-right">Ciro</span>
            <span className="text-right">SMM</span>
            <span className="text-right">Brüt Kâr</span>
            <span />
          </div>

          <div className="divide-y divide-black/4">
            {filtrelenmis.length === 0 ? (
              <div className="py-8 text-center text-sm" style={{ color: "var(--text-secondary)" }}>
                Bu dönemde satış yok
              </div>
            ) : filtrelenmis.map((k, i) => (
              <motion.div key={k.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}>
                {/* Mobile kart */}
                <div className="md:hidden px-4 py-3 space-y-2 hover:bg-[#F9FAFB] transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--color-success)" }} />
                        <p className="text-sm text-[#0F172A] font-medium truncate">{k.urunAd}</p>
                      </div>
                      <p className="text-[10px] mt-0.5" style={{ color: "var(--text-secondary)" }}>{zaman(k.tarih)}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                        {k.tip === "urun" ? "Ürün" : "Hizmet"}
                      </span>
                      <button
                        onClick={() => handleSil(k.id, k.islemId)}
                        disabled={siliniyor === k.id}
                        className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-gray-400 active:text-[#C97676] transition-colors disabled:opacity-40"
                      >
                        {siliniyor === k.id
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <Trash2 className="w-3.5 h-3.5" />
                        }
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p style={{ color: "var(--text-secondary)" }}>Adet × Fiyat</p>
                      <p className="text-[#0F172A] font-medium">{k.adet} × {tl(k.birimSatisFiyatiKurus)}</p>
                    </div>
                    <div>
                      <p style={{ color: "var(--text-secondary)" }}>Ciro</p>
                      <p className="text-[#0F172A] font-medium">{tl(k.toplamCiroKurus)}</p>
                    </div>
                    <div className="text-right">
                      <p style={{ color: "var(--text-secondary)" }}>Brüt Kâr</p>
                      <p className="font-bold" style={{ color: k.brutKarKurus >= 0 ? "var(--color-success)" : "var(--color-danger)" }}>
                        {k.brutKarKurus >= 0 ? "+" : ""}{tl(k.brutKarKurus)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Desktop satır — aynı COL şablonu */}
                <div className={`hidden md:grid ${COL} gap-4 px-5 py-4 items-center hover:bg-[#F9FAFB] transition-colors`}>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--color-success)" }} />
                      <p className="text-sm text-[#0F172A] font-medium truncate">{k.urunAd}</p>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 shrink-0">
                        {k.tip === "urun" ? "Ürün" : "Hizmet"}
                      </span>
                    </div>
                    <p className="text-[10px] mt-0.5" style={{ color: "var(--text-secondary)" }}>{zaman(k.tarih)}</p>
                  </div>
                  <span className="font-number text-sm text-gray-400 text-right">{k.adet}</span>
                  <span className="font-number text-sm text-gray-400 text-right">{tl(k.birimSatisFiyatiKurus)}</span>
                  <span className="font-number text-sm text-[#0F172A] text-right font-medium">{tl(k.toplamCiroKurus)}</span>
                  <span className="font-number text-sm text-right" style={{ color: "var(--color-danger)" }}>{tl(k.birimAlisFiyatiKurus * k.adet)}</span>
                  <span className="font-number text-sm font-bold text-right"
                    style={{ color: k.brutKarKurus >= 0 ? "var(--color-success)" : "var(--color-danger)" }}>
                    {k.brutKarKurus >= 0 ? "+" : ""}{tl(k.brutKarKurus)}
                  </span>
                  <button
                    onClick={() => handleSil(k.id, k.islemId)}
                    disabled={siliniyor === k.id}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-[#C97676] hover:bg-[#C97676]/8 transition-colors disabled:opacity-40"
                  >
                    {siliniyor === k.id
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Trash2 className="w-3.5 h-3.5" />
                    }
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {filtrelenmis.length > 0 && (
          <div className="px-5 py-3 border-t border-black/5 text-[10px]" style={{ color: "var(--text-secondary)" }}>
            {filtrelenmis.length} satış kaydı
          </div>
        )}
      </div>
    </div>
  );
}
