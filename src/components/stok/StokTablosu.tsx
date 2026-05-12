"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, History, Pencil, Trash2, AlertTriangle, TrendingDown } from "lucide-react";
import { stokDurumu, gunKaldi, type Urun } from "@/lib/stok-data";
import { useStok } from "@/store/stok";
import { useSirket } from "@/store/sirket";
import StokSeviyesi from "./StokSeviyesi";
import HareketiModal from "./HareketiModal";
import UrunEkleModal from "./UrunEkleModal";

type Filtre = "tumu" | "kritik" | "uyari" | "olu" | "normal";

const filtreSecenekleri: { value: Filtre; label: string; color: string }[] = [
  { value: "tumu",   label: "Tümü",     color: "#94a3b8" },
  { value: "kritik", label: "Kritik",   color: "#ef4444" },
  { value: "uyari",  label: "Uyarı",    color: "#fbc024" },
  { value: "olu",    label: "Ölü Stok", color: "#94a3b8" },
  { value: "normal", label: "Normal",   color: "#22c55e" },
];

interface Props { otomatikAcilModal?: boolean; }

export default function StokTablosu({ otomatikAcilModal }: Props) {
  const router = useRouter();
  const { urunler, ekle, guncelle, sil: storesSil } = useStok();
  const { rol } = useSirket();
  const isPilot = rol === "pilot" || !rol;
  const [arama, setArama]   = useState("");
  const [filtre, setFiltre] = useState<Filtre>("tumu");
  const [hareket, setHareket]   = useState<Urun | null>(null);
  const [duzenle, setDuzenle]   = useState<Urun | null>(null);
  const [urunEkleAcik, setUrunEkleAcik] = useState(false);
  const [silOnayi, setSilOnayi] = useState<Urun | null>(null);

  useEffect(() => {
    if (otomatikAcilModal) { setUrunEkleAcik(true); router.replace("/stok"); }
  }, [otomatikAcilModal, router]);

  const filtrelenmis = useMemo(() => urunler.filter((u) => {
    const aramaUyum = arama === "" || u.ad.toLowerCase().includes(arama.toLowerCase())
      || u.sku.toLowerCase().includes(arama.toLowerCase())
      || u.kategori.toLowerCase().includes(arama.toLowerCase());
    return aramaUyum && (filtre === "tumu" || stokDurumu(u) === filtre);
  }), [urunler, arama, filtre]);

  const toplamDeger = urunler.reduce((t, u) => t + (u.mevcutAdet * (u.birimMaliyet ?? 0)), 0);

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
          <input type="text" placeholder="Ürün, SKU veya kategori ara..." value={arama} onChange={(e) => setArama(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-white placeholder-[#94a3b8] text-sm focus:outline-none focus:border-[rgba(251,192,36,0.4)] transition-colors" />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)]">
            {filtreSecenekleri.map(({ value, label, color }) => {
              const count = value === "tumu" ? urunler.length : urunler.filter((u) => stokDurumu(u) === value).length;
              return (
                <button key={value} onClick={() => setFiltre(value)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    backgroundColor: filtre === value ? `${color}20` : "transparent",
                    color:           filtre === value ? color : "#94a3b8",
                    border:          filtre === value ? `1px solid ${color}40` : "1px solid transparent",
                  }}>
                  {label} <span className="text-[10px] opacity-70">{count}</span>
                </button>
              );
            })}
          </div>
          {isPilot && (
            <button onClick={() => setUrunEkleAcik(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#fbc024] text-[#0e172a] text-sm font-bold hover:bg-[#d9a61f] transition-colors">
              <Plus className="w-4 h-4" />Ürün Ekle
            </button>
          )}
        </div>
      </div>

      {/* Toplam stok değeri */}
      {toplamDeger > 0 && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[rgba(251,192,36,0.06)] border border-[rgba(251,192,36,0.12)]">
          <TrendingDown className="w-4 h-4 text-[#fbc024]" />
          <span className="text-sm text-[#94a3b8]">Toplam stok değeri:</span>
          <span className="text-sm font-bold text-[#fbc024]">
            {toplamDeger.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
          </span>
        </div>
      )}

      {/* Tablo */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {/* Başlıklar */}
        <div className="hidden lg:grid lg:grid-cols-[minmax(180px,2fr)_120px_minmax(160px,2fr)_100px_110px_120px] gap-x-4 px-5 py-3 border-b border-[rgba(255,255,255,0.06)] text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">
          <span>Ürün</span>
          <span>Kategori</span>
          <span>Stok Seviyesi</span>
          <span>Gün. Satış</span>
          <span>Değer</span>
          <span>İşlemler</span>
        </div>

        <div className="divide-y divide-[rgba(255,255,255,0.04)]">
          {filtrelenmis.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <p className="text-[#94a3b8] text-sm font-medium">Henüz ürün yok</p>
              <p className="text-[#64748b] text-xs">İlk ürününüzü eklemek için "Ürün Ekle" butonuna tıklayın.</p>
            </div>
          ) : filtrelenmis.map((urun, i) => {
            const gun = gunKaldi(urun);
            const deger = urun.birimMaliyet ? urun.mevcutAdet * urun.birimMaliyet : null;
            return (
              <motion.div key={urun.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                className="grid grid-cols-1 lg:grid-cols-[minmax(180px,2fr)_120px_minmax(160px,2fr)_100px_110px_120px] gap-x-4 gap-y-2 px-5 py-4 items-center hover:bg-[rgba(251,192,36,0.03)] transition-colors">

                {/* Ürün */}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{urun.ad}</p>
                  <p className="text-xs text-[#64748b]">{urun.sku || "—"}</p>
                </div>

                {/* Kategori */}
                <div className="flex items-center">
                  <span className="text-xs text-[#94a3b8] px-2 py-1 rounded-lg bg-[rgba(255,255,255,0.04)] whitespace-nowrap">
                    {urun.kategori}
                  </span>
                </div>

                {/* Stok seviyesi */}
                <div><StokSeviyesi urun={urun} /></div>

                {/* Günlük satış */}
                <div>
                  <p className="text-sm text-white font-medium">{urun.gunlukSatis} {urun.birim}</p>
                  {gun !== null && (
                    <p className={`text-xs mt-0.5 ${gun <= 3 ? "text-[#ef4444]" : gun <= 7 ? "text-[#fbc024]" : "text-[#64748b]"}`}>
                      {gun} gün
                    </p>
                  )}
                </div>

                {/* Stok değeri */}
                <div>
                  {deger !== null ? (
                    <>
                      <p className="text-sm text-white font-medium">
                        {deger.toLocaleString("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 })}
                      </p>
                      <p className="text-xs text-[#64748b]">{urun.birimMaliyet?.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}/birim</p>
                    </>
                  ) : <span className="text-xs text-[#475569]">—</span>}
                </div>

                {/* İşlemler */}
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setHareket(urun)} title="Stok Hareketi"
                    className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs text-[#94a3b8] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(251,192,36,0.4)] hover:text-[#fbc024] transition-all">
                    <History className="w-3.5 h-3.5" />
                    <span className="hidden xl:inline">Hareket</span>
                  </button>
                  {isPilot && (
                    <button onClick={() => setDuzenle(urun)} title="Düzenle"
                      className="flex items-center justify-center w-7 h-7 rounded-lg text-[#94a3b8] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(251,192,36,0.4)] hover:text-[#fbc024] transition-all">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {isPilot && (
                    <button onClick={() => setSilOnayi(urun)} title="Sil"
                      className="flex items-center justify-center w-7 h-7 rounded-lg text-[#94a3b8] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(239,68,68,0.4)] hover:text-[#ef4444] transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="px-5 py-3 border-t border-[rgba(255,255,255,0.06)] text-xs text-[#94a3b8]">
          {filtrelenmis.length} / {urunler.length} ürün
        </div>
      </div>

      <HareketiModal urun={hareket} onClose={() => setHareket(null)} />
      <UrunEkleModal open={urunEkleAcik} onClose={() => setUrunEkleAcik(false)} onKaydet={(u) => ekle(u)} />
      <UrunEkleModal open={!!duzenle} urun={duzenle} onClose={() => setDuzenle(null)} onKaydet={(u) => duzenle && guncelle(duzenle.id, u)} />

      <AnimatePresence>
        {silOnayi && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setSilOnayi(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }} transition={{ duration: 0.18 }}
              className="w-full max-w-sm glass-card rounded-2xl p-6">
              <div className="w-12 h-12 rounded-xl bg-[rgba(239,68,68,0.12)] border border-[rgba(239,68,68,0.25)] flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-[#ef4444]" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">Ürünü Sil</h3>
              <p className="text-sm text-[#94a3b8] mb-6">
                <span className="text-white font-semibold">{silOnayi.ad}</span> ürününü silmek istediğinizden emin misiniz?
              </p>
              <div className="flex gap-3">
                <button onClick={() => setSilOnayi(null)}
                  className="flex-1 py-2.5 rounded-xl border border-[rgba(255,255,255,0.1)] text-[#94a3b8] text-sm font-medium hover:bg-[rgba(255,255,255,0.05)] transition-colors">İptal</button>
                <button onClick={() => { storesSil(silOnayi.id); setSilOnayi(null); }}
                  className="flex-1 py-2.5 rounded-xl bg-[#ef4444] text-white text-sm font-bold hover:bg-[#dc2626] transition-colors">Evet, Sil</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
