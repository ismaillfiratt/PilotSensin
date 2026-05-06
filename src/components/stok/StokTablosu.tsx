"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, History, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { MOCK_URUNLER, stokDurumu, gunKaldi, type Urun } from "@/lib/stok-data";
import StokSeviyesi from "./StokSeviyesi";
import HareketiModal from "./HareketiModal";
import UrunEkleModal from "./UrunEkleModal";

type Filtre = "tumu" | "kritik" | "uyari" | "olu" | "normal";

const filtreSecenekleri: { value: Filtre; label: string; color: string }[] = [
  { value: "tumu", label: "Tümü", color: "#94a3b8" },
  { value: "kritik", label: "Kritik", color: "#ef4444" },
  { value: "uyari", label: "Uyarı", color: "#fbc024" },
  { value: "olu", label: "Ölü Stok", color: "#94a3b8" },
  { value: "normal", label: "Normal", color: "#22c55e" },
];

interface Props {
  otomatikAcilModal?: boolean;
}

export default function StokTablosu({ otomatikAcilModal }: Props) {
  const router = useRouter();
  const [urunler, setUrunler] = useState<Urun[]>(MOCK_URUNLER);
  const [arama, setArama] = useState("");
  const [filtre, setFiltre] = useState<Filtre>("tumu");

  // Modal state'leri
  const [hareket, setHareket] = useState<Urun | null>(null);
  const [duzenle, setDuzenle] = useState<Urun | null>(null);
  const [urunEkleAcik, setUrunEkleAcik] = useState(false);
  const [silOnayi, setSilOnayi] = useState<Urun | null>(null);

  // URL param ile otomatik modal aç
  useEffect(() => {
    if (otomatikAcilModal) {
      setUrunEkleAcik(true);
      router.replace("/stok");
    }
  }, [otomatikAcilModal, router]);

  const filtrelenmis = useMemo(() => {
    return urunler.filter((u) => {
      const aramaUyum =
        arama === "" ||
        u.ad.toLowerCase().includes(arama.toLowerCase()) ||
        u.sku.toLowerCase().includes(arama.toLowerCase()) ||
        u.kategori.toLowerCase().includes(arama.toLowerCase());
      const filtreUyum = filtre === "tumu" || stokDurumu(u) === filtre;
      return aramaUyum && filtreUyum;
    });
  }, [arama, filtre]);

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
          <input
            type="text"
            placeholder="Ürün, SKU veya kategori ara..."
            value={arama}
            onChange={(e) => setArama(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-white placeholder-[#94a3b8] text-sm focus:outline-none focus:border-[rgba(251,192,36,0.4)] transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Filtre butonları */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)]">
            {filtreSecenekleri.map(({ value, label, color }) => {
              const count =
                value === "tumu"
                  ? urunler.length
                  : urunler.filter((u) => stokDurumu(u) === value).length;
              return (
                <button
                  key={value}
                  onClick={() => setFiltre(value)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    backgroundColor: filtre === value ? `${color}20` : "transparent",
                    color: filtre === value ? color : "#94a3b8",
                    border: filtre === value ? `1px solid ${color}40` : "1px solid transparent",
                  }}
                >
                  {label}
                  <span className="text-[10px] opacity-70">{count}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setUrunEkleAcik(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#fbc024] text-[#0e172a] text-sm font-bold hover:bg-[#d9a61f] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Ürün Ekle
          </button>
        </div>
      </div>

      {/* Tablo */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {/* Başlıklar */}
        <div className="grid grid-cols-[2fr_1fr_2fr_1fr_auto] gap-4 px-5 py-3 border-b border-[rgba(255,255,255,0.06)] text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">
          <span>Ürün</span>
          <span>Kategori</span>
          <span>Stok Seviyesi</span>
          <span>Günlük Satış</span>
          <span>İşlemler</span>
        </div>

        {/* Satırlar */}
        <div className="divide-y divide-[rgba(255,255,255,0.04)]">
          {filtrelenmis.length === 0 ? (
            <div className="py-16 text-center text-[#94a3b8] text-sm">
              Ürün bulunamadı.
            </div>
          ) : (
            filtrelenmis.map((urun, i) => {
              const gun = gunKaldi(urun);
              return (
                <motion.div
                  key={urun.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="grid grid-cols-[2fr_1fr_2fr_1fr_auto] gap-4 px-5 py-4 items-center hover:bg-[rgba(251,192,36,0.04)] transition-colors"
                >
                  {/* Ürün */}
                  <div>
                    <p className="text-sm font-semibold text-white">{urun.ad}</p>
                    <p className="text-xs text-[#94a3b8] mt-0.5">{urun.sku}</p>
                  </div>

                  {/* Kategori */}
                  <span className="text-xs text-[#94a3b8] px-2 py-1 rounded-lg bg-[rgba(255,255,255,0.04)] w-fit">
                    {urun.kategori}
                  </span>

                  {/* Stok seviyesi */}
                  <StokSeviyesi urun={urun} />

                  {/* Günlük satış */}
                  <div>
                    <p className="text-sm text-white font-medium">
                      {urun.gunlukSatis} {urun.birim}
                    </p>
                    {gun !== null && (
                      <p
                        className={`text-xs mt-0.5 ${
                          gun <= 3
                            ? "text-[#ef4444]"
                            : gun <= 7
                            ? "text-[#fbc024]"
                            : "text-[#94a3b8]"
                        }`}
                      >
                        {gun} gün
                      </p>
                    )}
                  </div>

                  {/* İşlem butonları */}
                  <div className="flex items-center gap-1.5">
                    {/* Stok Hareketi */}
                    <button
                      onClick={() => setHareket(urun)}
                      title="Stok Hareketi"
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#94a3b8] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(251,192,36,0.4)] hover:text-[#fbc024] transition-all"
                    >
                      <History className="w-3.5 h-3.5" />
                      <span className="hidden lg:inline">Hareket</span>
                    </button>

                    {/* Düzenle */}
                    <button
                      onClick={() => setDuzenle(urun)}
                      title="Düzenle"
                      className="flex items-center justify-center w-8 h-8 rounded-lg text-[#94a3b8] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(251,192,36,0.4)] hover:text-[#fbc024] transition-all"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>

                    {/* Sil */}
                    <button
                      onClick={() => setSilOnayi(urun)}
                      title="Sil"
                      className="flex items-center justify-center w-8 h-8 rounded-lg text-[#94a3b8] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(239,68,68,0.4)] hover:text-[#ef4444] transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[rgba(255,255,255,0.06)] text-xs text-[#94a3b8]">
          {filtrelenmis.length} / {urunler.length} ürün gösteriliyor
        </div>
      </div>

      {/* Stok hareketi modal */}
      <HareketiModal urun={hareket} onClose={() => setHareket(null)} />

      {/* Ürün ekle modal */}
      <UrunEkleModal
        open={urunEkleAcik}
        onClose={() => setUrunEkleAcik(false)}
      />

      {/* Ürün düzenle modal */}
      <UrunEkleModal
        open={!!duzenle}
        urun={duzenle}
        onClose={() => setDuzenle(null)}
      />

      {/* Silme onay modal */}
      <AnimatePresence>
        {silOnayi && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setSilOnayi(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.18 }}
              className="w-full max-w-sm glass-card rounded-2xl p-6"
            >
              {/* İkon */}
              <div className="w-12 h-12 rounded-xl bg-[rgba(239,68,68,0.12)] border border-[rgba(239,68,68,0.25)] flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-[#ef4444]" />
              </div>

              <h3 className="text-base font-bold text-white mb-1">Ürünü Sil</h3>
              <p className="text-sm text-[#94a3b8] mb-6">
                <span className="text-white font-semibold">{silOnayi.ad}</span> ürününü
                silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setSilOnayi(null)}
                  className="flex-1 py-2.5 rounded-xl border border-[rgba(255,255,255,0.1)] text-[#94a3b8] text-sm font-medium hover:bg-[rgba(255,255,255,0.05)] transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={() => {
                    setUrunler((prev) => prev.filter((u) => u.id !== silOnayi.id));
                    setSilOnayi(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-[#ef4444] text-white text-sm font-bold hover:bg-[#dc2626] transition-colors"
                >
                  Evet, Sil
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
