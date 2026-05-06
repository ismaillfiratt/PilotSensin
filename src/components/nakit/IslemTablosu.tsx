"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, AlertTriangle, TrendingUp, TrendingDown, Search } from "lucide-react";
import { MOCK_ISLEMLER, formatTL, type Islem } from "@/lib/nakit-data";
import IslemModal from "./IslemModal";

const odemeRenk: Record<string, string> = {
  nakit: "#22c55e",
  kart: "#fbc024",
  havale: "#94a3b8",
  cek: "#a78bfa",
};

const odemeLabel: Record<string, string> = {
  nakit: "Nakit",
  kart: "Kart",
  havale: "Havale",
  cek: "Çek",
};

interface Props {
  otomatikAcilModal?: "gelir" | "gider" | null;
}

export default function IslemTablosu({ otomatikAcilModal }: Props) {
  const router = useRouter();
  const [islemler, setIslemler] = useState<Islem[]>(MOCK_ISLEMLER);
  const [arama, setArama] = useState("");
  const [tipFiltre, setTipFiltre] = useState<"tumu" | "gelir" | "gider">("tumu");
  const [modalAcik, setModalAcik] = useState(false);
  const [otomatikTip, setOtomatikTip] = useState<"gelir" | "gider" | undefined>();
  const [duzenle, setDuzenle] = useState<Islem | null>(null);
  const [silOnayi, setSilOnayi] = useState<Islem | null>(null);

  // URL param ile otomatik modal aç
  useEffect(() => {
    if (otomatikAcilModal === "gelir" || otomatikAcilModal === "gider") {
      setOtomatikTip(otomatikAcilModal);
      setModalAcik(true);
      // URL'den parametreyi temizle
      router.replace("/nakit-akisi");
    }
  }, [otomatikAcilModal, router]);

  const filtrelenmis = useMemo(() => {
    return islemler
      .filter((i) => {
        const aramaUyum =
          arama === "" ||
          i.aciklama.toLowerCase().includes(arama.toLowerCase()) ||
          i.kategori.toLowerCase().includes(arama.toLowerCase());
        const tipUyum = tipFiltre === "tumu" || i.tip === tipFiltre;
        return aramaUyum && tipUyum;
      })
      .sort((a, b) => new Date(b.tarih).getTime() - new Date(a.tarih).getTime());
  }, [islemler, arama, tipFiltre]);

  const handleKaydet = (yeni: Omit<Islem, "id">) => {
    if (duzenle) {
      setIslemler((prev) => prev.map((i) => i.id === duzenle.id ? { ...yeni, id: duzenle.id } : i));
      setDuzenle(null);
    } else {
      setIslemler((prev) => [{ ...yeni, id: Date.now().toString() }, ...prev]);
    }
  };

  const handleSil = () => {
    if (!silOnayi) return;
    setIslemler((prev) => prev.filter((i) => i.id !== silOnayi.id));
    setSilOnayi(null);
  };

  const tarihFormat = (iso: string) =>
    new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
          <input
            type="text"
            placeholder="İşlem ara..."
            value={arama}
            onChange={(e) => setArama(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-white placeholder-[#94a3b8] text-sm focus:outline-none focus:border-[rgba(251,192,36,0.4)] transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Tip filtresi */}
          <div className="flex gap-1 p-1 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)]">
            {([
              { v: "tumu", label: "Tümü", renk: "#94a3b8" },
              { v: "gelir", label: "Gelir", renk: "#22c55e" },
              { v: "gider", label: "Gider", renk: "#ef4444" },
            ] as const).map(({ v, label, renk }) => (
              <button
                key={v}
                onClick={() => setTipFiltre(v)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  backgroundColor: tipFiltre === v ? `${renk}20` : "transparent",
                  color: tipFiltre === v ? renk : "#94a3b8",
                  border: tipFiltre === v ? `1px solid ${renk}40` : "1px solid transparent",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            onClick={() => { setDuzenle(null); setModalAcik(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#fbc024] text-[#0e172a] text-sm font-bold hover:bg-[#d9a61f] transition-colors"
          >
            <Plus className="w-4 h-4" />
            İşlem Ekle
          </button>
        </div>
      </div>

      {/* Tablo */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="grid grid-cols-[auto_2fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 border-b border-[rgba(255,255,255,0.06)] text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">
          <span>Tip</span>
          <span>Açıklama</span>
          <span>Kategori</span>
          <span>Ödeme</span>
          <span>Tutar</span>
          <span>İşlemler</span>
        </div>

        <div className="divide-y divide-[rgba(255,255,255,0.04)]">
          {filtrelenmis.length === 0 ? (
            <div className="py-16 text-center text-[#94a3b8] text-sm">İşlem bulunamadı.</div>
          ) : (
            filtrelenmis.map((islem, i) => {
              const gelirMi = islem.tip === "gelir";
              return (
                <motion.div
                  key={islem.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="grid grid-cols-[auto_2fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3.5 items-center hover:bg-[rgba(251,192,36,0.03)] transition-colors"
                >
                  {/* Tip ikonu */}
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: gelirMi ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                    }}
                  >
                    {gelirMi
                      ? <TrendingUp className="w-4 h-4 text-[#22c55e]" />
                      : <TrendingDown className="w-4 h-4 text-[#ef4444]" />
                    }
                  </div>

                  {/* Açıklama + tarih */}
                  <div className="min-w-0">
                    <p className="text-sm text-white font-medium truncate">{islem.aciklama || "—"}</p>
                    <p className="text-xs text-[#94a3b8] mt-0.5">{tarihFormat(islem.tarih)}</p>
                  </div>

                  {/* Kategori */}
                  <span className="text-xs text-[#94a3b8] px-2 py-1 rounded-lg bg-[rgba(255,255,255,0.04)] truncate">
                    {islem.kategori}
                  </span>

                  {/* Ödeme yöntemi */}
                  <span
                    className="text-xs font-medium"
                    style={{ color: odemeRenk[islem.odemeYontemi] }}
                  >
                    {odemeLabel[islem.odemeYontemi]}
                  </span>

                  {/* Tutar */}
                  <span
                    className="text-sm font-bold"
                    style={{ color: gelirMi ? "#22c55e" : "#ef4444" }}
                  >
                    {gelirMi ? "+" : "-"}{formatTL(islem.tutar)}
                  </span>

                  {/* Butonlar */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => { setDuzenle(islem); setModalAcik(true); }}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-[#94a3b8] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(251,192,36,0.4)] hover:text-[#fbc024] transition-all"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setSilOnayi(islem)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-[#94a3b8] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(239,68,68,0.4)] hover:text-[#ef4444] transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        <div className="px-5 py-3 border-t border-[rgba(255,255,255,0.06)] text-xs text-[#94a3b8]">
          {filtrelenmis.length} / {islemler.length} işlem gösteriliyor
        </div>
      </div>

      {/* İşlem modal */}
      <IslemModal
        open={modalAcik}
        onClose={() => { setModalAcik(false); setDuzenle(null); setOtomatikTip(undefined); }}
        islem={duzenle}
        onKaydet={handleKaydet}
        varsayilanTip={otomatikTip}
      />

      {/* Silme onayı */}
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
              <div className="w-12 h-12 rounded-xl bg-[rgba(239,68,68,0.12)] border border-[rgba(239,68,68,0.25)] flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-[#ef4444]" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">İşlemi Sil</h3>
              <p className="text-sm text-[#94a3b8] mb-6">
                <span className="text-white font-semibold">{formatTL(silOnayi.tutar)}</span> tutarındaki{" "}
                <span className="text-white font-semibold">{silOnayi.kategori}</span> işlemini silmek
                istediğinizden emin misiniz?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setSilOnayi(null)}
                  className="flex-1 py-2.5 rounded-xl border border-[rgba(255,255,255,0.1)] text-[#94a3b8] text-sm font-medium hover:bg-[rgba(255,255,255,0.05)] transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={handleSil}
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
