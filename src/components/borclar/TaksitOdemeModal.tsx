"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2 } from "lucide-react";
import type { Borc, Taksit } from "@/lib/borc-data";

interface Props {
  open: boolean;
  borc: Borc | null;
  taksit: Taksit | null;
  onClose: () => void;
  onOnayla: (params: {
    odemeYontemi: "nakit" | "kart" | "havale" | "cek";
    tarih: string;
    not: string;
  }) => Promise<void>;
}

export default function TaksitOdemeModal({ open, borc, taksit, onClose, onOnayla }: Props) {
  const [odemeYontemi, setOdemeYontemi] = useState<"nakit" | "kart" | "havale" | "cek">("nakit");
  const [tarih, setTarih]               = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [not, setNot]                   = useState("");
  const [yukleniyor, setYukleniyor]     = useState(false);
  const [hata, setHata]                 = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setOdemeYontemi("nakit");
      setTarih(new Date().toISOString().slice(0, 10));
      setNot("");
      setHata(null);
      setYukleniyor(false);
    }
  }, [open]);

  if (!open || !borc || !taksit) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHata(null);
    setYukleniyor(true);
    try {
      await onOnayla({ odemeYontemi, tarih, not });
      onClose();
    } catch (err) {
      setHata(err instanceof Error ? err.message : "Ödeme kaydedilemedi.");
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-md modal-card overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "var(--border-subtle)" }}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                     style={{ background: "rgba(212,163,115,0.12)" }}>
                  <CheckCircle2 className="w-4 h-4" style={{ color: "var(--color-warning)" }} />
                </div>
                <div>
                  <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
                    Taksit ödemesini kaydet
                  </h3>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    {borc.aciklama} — Taksit {taksit.siraNo}/{borc.taksitler.length}
                  </p>
                </div>
              </div>
              <button type="button" onClick={onClose}
                      className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-black/5">
                <X className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              {/* Tutar — read only */}
              <div className="p-3 rounded-lg" style={{ background: "var(--bg-secondary)" }}>
                <p className="text-xs mb-1" style={{ color: "var(--text-secondary)" }}>Ödenecek tutar</p>
                <p className="text-2xl font-bold font-number" style={{ color: "var(--text-primary)" }}>
                  {(taksit.tutarKurus / 100).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
                </p>
                <p className="text-[11px] mt-1" style={{ color: "var(--text-secondary)" }}>
                  Vade tarihi: {new Date(taksit.vadeTarihi).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" })}
                </p>
              </div>

              {/* Ödeme yöntemi */}
              <div>
                <label className="text-xs block mb-1.5 font-medium" style={{ color: "var(--text-secondary)" }}>
                  Ödeme yöntemi
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {([
                    { v: "nakit",  l: "Nakit"  },
                    { v: "kart",   l: "Kart"   },
                    { v: "havale", l: "Havale" },
                    { v: "cek",    l: "Çek"    },
                  ] as const).map((opt) => {
                    const aktif = odemeYontemi === opt.v;
                    return (
                      <button
                        key={opt.v} type="button"
                        onClick={() => setOdemeYontemi(opt.v)}
                        className="py-2 px-2 rounded-lg text-xs font-medium transition-colors"
                        style={{
                          background: aktif ? "var(--mint)" : "transparent",
                          color:      aktif ? "var(--forest)" : "var(--text-secondary)",
                          border:     "0.5px solid " + (aktif ? "var(--forest)" : "var(--border-default, rgba(0,0,0,0.08))"),
                        }}
                      >
                        {opt.l}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Ödeme tarihi */}
              <div>
                <label className="text-xs block mb-1.5 font-medium" style={{ color: "var(--text-secondary)" }}>
                  Ödeme tarihi
                </label>
                <input
                  type="date" value={tarih}
                  onChange={(e) => setTarih(e.target.value)}
                  max={new Date().toISOString().slice(0, 10)}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{
                    background: "var(--bg-input, #fff)",
                    border:     "0.5px solid var(--border-default, rgba(0,0,0,0.15))",
                    color:      "var(--text-primary)",
                  }}
                />
              </div>

              {/* Not (opsiyonel) */}
              <div>
                <label className="text-xs block mb-1.5 font-medium" style={{ color: "var(--text-secondary)" }}>
                  Not <span style={{ color: "var(--text-tertiary)" }}>(opsiyonel)</span>
                </label>
                <input
                  type="text" value={not}
                  onChange={(e) => setNot(e.target.value)}
                  placeholder="Örn: EFT ile gönderildi"
                  maxLength={120}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{
                    background: "var(--bg-input, #fff)",
                    border:     "0.5px solid var(--border-default, rgba(0,0,0,0.15))",
                    color:      "var(--text-primary)",
                  }}
                />
              </div>

              {hata && (
                <div className="p-2.5 rounded-lg text-xs"
                     style={{ background: "rgba(201,118,118,0.12)", color: "var(--color-danger)" }}>
                  {hata}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-5 pt-0">
              <button type="button" onClick={onClose}
                className="flex-1 py-3 rounded-xl text-sm font-medium transition-colors"
                style={{
                  border: "0.5px solid var(--border-default)",
                  color:  "var(--text-secondary)",
                }}>
                İptal
              </button>
              <button type="submit" disabled={yukleniyor}
                className="flex-1 py-3 rounded-xl text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{
                  background: "var(--accent)",
                  color:      "var(--text-on-forest)",
                }}>
                {yukleniyor ? "Kaydediliyor..." : "Ödendi olarak işaretle"}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
