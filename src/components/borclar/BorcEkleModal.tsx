"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CreditCard, Plus } from "lucide-react";
import { useBorclar } from "@/store/borclar";
import { useBorcAyarlar } from "@/store/borcAyarlar";
import { tekTaksit, esitTaksitler } from "@/lib/borc-data";
import type { BorcKaynak } from "@/lib/borc-data";
import { toast } from "@/store/toast";

interface Props {
  open: boolean;
  onClose: () => void;
}

type OdemeYontemi = "vadeli" | "taksitli";

const bugun = () => new Date().toISOString().slice(0, 10);

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-xs block mb-1.5 font-medium" style={{ color: "var(--text-secondary)" }}>
      {children}
    </label>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full px-3 py-2 rounded-lg text-sm"
      style={{
        background: "var(--bg-input, #fff)",
        border: "0.5px solid var(--border-default, rgba(0,0,0,0.15))",
        color: "var(--text-primary)",
      }}
    />
  );
}

export default function BorcEkleModal({ open, onClose }: Props) {
  const { turler, turEkle, turSil } = useBorcAyarlar();

  const [aciklama,      setAciklama]      = useState("");
  const [secilenTur,    setSecilenTur]    = useState("");
  const [tutarTL,       setTutarTL]       = useState("");
  const [odemeYontemi,  setOdemeYontemi]  = useState<OdemeYontemi>("vadeli");
  const [vadeTarihi,    setVadeTarihi]    = useState("");
  const [taksitSayisi,  setTaksitSayisi]  = useState("3");
  const [ilkVadeTarihi, setIlkVadeTarihi] = useState("");
  const [yukleniyor,    setYukleniyor]    = useState(false);
  const [hata,          setHata]          = useState<string | null>(null);

  // Tür düzenleme modu
  const [turDuzenle, setTurDuzenle] = useState(false);
  const [yeniTur,    setYeniTur]    = useState("");

  useEffect(() => {
    if (open) {
      setAciklama("");
      setSecilenTur(turler[0] ?? "");
      setTutarTL("");
      setOdemeYontemi("vadeli");
      setVadeTarihi("");
      setTaksitSayisi("3");
      setIlkVadeTarihi("");
      setHata(null);
      setYukleniyor(false);
      setTurDuzenle(false);
      setYeniTur("");
    }
  }, [open, turler]);

  // turler değişince seçili tür hâlâ listede yoksa ilkini seç
  useEffect(() => {
    if (!turler.includes(secilenTur)) setSecilenTur(turler[0] ?? "");
  }, [turler, secilenTur]);

  if (!open) return null;

  const handleTurEkle = () => {
    const temiz = yeniTur.trim();
    if (!temiz || turler.includes(temiz)) return;
    turEkle(temiz);
    setSecilenTur(temiz);
    setYeniTur("");
  };

  const handleTurSil = (tur: string) => {
    if (turler.length <= 1) return; // en az bir tür kalmalı
    turSil(tur);
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setHata(null);

    const toplamKurus = Math.round(parseFloat(tutarTL.replace(",", ".")) * 100);

    if (!aciklama.trim()) { setHata("Açıklama boş bırakılamaz."); return; }
    if (!toplamKurus || toplamKurus <= 0) { setHata("Geçerli bir tutar girin."); return; }
    if (!secilenTur) { setHata("Bir tür seçin."); return; }

    if (odemeYontemi === "vadeli") {
      if (!vadeTarihi) { setHata("Vade tarihi seçin."); return; }
      if (vadeTarihi < bugun()) { setHata("Vade tarihi geçmiş olamaz."); return; }
    } else {
      const n = parseInt(taksitSayisi, 10);
      if (!n || n < 1 || n > 36) { setHata("Taksit sayısı 1–36 arasında olmalı."); return; }
      if (!ilkVadeTarihi) { setHata("İlk taksit tarihi seçin."); return; }
      if (ilkVadeTarihi < bugun()) { setHata("İlk taksit tarihi geçmiş olamaz."); return; }
    }

    setYukleniyor(true);
    try {
      const taksitler =
        odemeYontemi === "vadeli"
          ? tekTaksit(toplamKurus, vadeTarihi)
          : esitTaksitler(toplamKurus, parseInt(taksitSayisi, 10), ilkVadeTarihi);

      await useBorclar.getState().ekle({
        kaynak:           secilenTur as BorcKaynak,
        kaynakId:         undefined,
        aciklama:         aciklama.trim(),
        toplamTutarKurus: toplamKurus,
        paraBirimi:       "TRY",
        taksitler,
      });

      toast.basari("Borç eklendi.");
      onClose();
    } catch {
      setHata("Borç kaydedilemedi. Tekrar deneyin.");
    } finally {
      setYukleniyor(false);
    }
  };

  const tabBtn = (aktif: boolean) => ({
    flex: 1, padding: "8px 0", fontSize: 13, fontWeight: 500, cursor: "pointer" as const,
    borderRadius: 8, border: "none",
    background: aktif ? "#1F5C44" : "transparent",
    color: aktif ? "#FFFFFF" : "var(--text-secondary)",
    WebkitTextFillColor: aktif ? "#FFFFFF" : "var(--text-secondary)",
    transition: "all 0.15s",
  });

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
                     style={{ background: "rgba(31,92,68,0.10)" }}>
                  <CreditCard className="w-4 h-4" style={{ color: "#1F5C44" }} />
                </div>
                <div>
                  <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
                    Borç Ekle
                  </h3>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    Manuel vadeli veya taksitli borç oluştur
                  </p>
                </div>
              </div>
              <button type="button" onClick={onClose}
                      className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-black/5">
                <X className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">

              {/* Açıklama */}
              <div>
                <Label>Açıklama</Label>
                <Input
                  type="text" value={aciklama} maxLength={120}
                  onChange={(e) => setAciklama(e.target.value)}
                  placeholder="Örn: Tedarikçi ödemesi"
                  required
                />
              </div>

              {/* Tür — dinamik liste */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Tür</span>
                  <button
                    type="button"
                    onClick={() => setTurDuzenle((p) => !p)}
                    className="text-[10px] hover:underline"
                    style={{ color: "var(--leaf, #1F5C44)" }}
                  >
                    {turDuzenle ? "Kapat" : "Düzenle"}
                  </button>
                </div>

                {turDuzenle ? (
                  /* ── Düzenleme modu ── */
                  <div className="space-y-2 p-3 rounded-xl" style={{ background: "var(--bg-secondary)", border: "0.5px solid var(--border-default, rgba(0,0,0,0.10))" }}>
                    {/* Mevcut türler — chip'ler */}
                    <div className="flex flex-wrap gap-1.5">
                      {turler.map((tur) => (
                        <span
                          key={tur}
                          className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs"
                          style={{ background: "var(--bg-card, #fff)", border: "0.5px solid var(--border-default, rgba(0,0,0,0.10))", color: "var(--text-primary)" }}
                        >
                          {tur}
                          {turler.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleTurSil(tur)}
                              className="transition-colors hover:opacity-70"
                              style={{ color: "var(--text-tertiary)", lineHeight: 0 }}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </span>
                      ))}
                    </div>

                    {/* Yeni tür ekle */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={yeniTur}
                        onChange={(e) => setYeniTur(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleTurEkle())}
                        placeholder="Yeni tür..."
                        maxLength={40}
                        className="flex-1 px-2.5 py-1.5 rounded-lg text-xs"
                        style={{
                          background: "var(--bg-card, #fff)",
                          border: "0.5px solid var(--border-default, rgba(0,0,0,0.12))",
                          color: "var(--text-primary)",
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleTurEkle}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-bold transition-opacity hover:opacity-80"
                        style={{ background: "var(--bg-card, #fff)", border: "0.5px solid var(--border-default, rgba(0,0,0,0.12))", color: "var(--text-primary)" }}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ── Normal mod — select ── */
                  <select
                    value={secilenTur}
                    onChange={(e) => setSecilenTur(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm"
                    style={{
                      background: "var(--bg-input, #fff)",
                      border: "0.5px solid var(--border-default, rgba(0,0,0,0.15))",
                      color: "var(--text-primary)",
                    }}
                  >
                    {turler.map((tur) => (
                      <option key={tur} value={tur}>{tur}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Toplam tutar */}
              <div>
                <Label>Toplam tutar (₺)</Label>
                <Input
                  type="number" value={tutarTL} min="0.01" step="0.01"
                  onChange={(e) => setTutarTL(e.target.value)}
                  placeholder="0,00"
                  required
                />
              </div>

              {/* Ödeme şekli */}
              <div>
                <Label>Ödeme şekli</Label>
                <div className="flex gap-1 p-1 rounded-xl" style={{ background: "var(--bg-secondary)" }}>
                  <button type="button" style={tabBtn(odemeYontemi === "vadeli")}
                          onClick={() => setOdemeYontemi("vadeli")}>
                    Vadeli (tek ödeme)
                  </button>
                  <button type="button" style={tabBtn(odemeYontemi === "taksitli")}
                          onClick={() => setOdemeYontemi("taksitli")}>
                    Taksitli
                  </button>
                </div>
              </div>

              {/* Vadeli */}
              {odemeYontemi === "vadeli" && (
                <div>
                  <Label>Vade tarihi</Label>
                  <Input
                    type="date" value={vadeTarihi} min={bugun()}
                    onChange={(e) => setVadeTarihi(e.target.value)}
                    required
                  />
                </div>
              )}

              {/* Taksitli */}
              {odemeYontemi === "taksitli" && (
                <div className="space-y-3">
                  <div>
                    <Label>Taksit sayısı (1–36)</Label>
                    <Input
                      type="number" value={taksitSayisi} min="1" max="36" step="1"
                      onChange={(e) => setTaksitSayisi(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label>İlk taksit tarihi</Label>
                    <Input
                      type="date" value={ilkVadeTarihi} min={bugun()}
                      onChange={(e) => setIlkVadeTarihi(e.target.value)}
                      required
                    />
                    <p className="text-[11px] mt-1" style={{ color: "var(--text-tertiary)" }}>
                      Sonraki taksitler birer ay arayla otomatik oluşturulur.
                    </p>
                  </div>
                </div>
              )}

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
                style={{ border: "0.5px solid var(--border-default)", color: "var(--text-secondary)" }}>
                İptal
              </button>
              <button type="submit" disabled={yukleniyor}
                className="flex-1 py-3 rounded-xl text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ background: "#1F5C44", color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>
                {yukleniyor ? "Kaydediliyor..." : "Borç Ekle"}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
