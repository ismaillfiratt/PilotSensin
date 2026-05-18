"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X, Check, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { useCerez } from "@/store/cerez";

export default function CerezBanner() {
  const { tercihler, bannerAcik, kabulEt, reddet, bannerAc } = useCerez();
  const [gosteriliyor, setGosteriliyor] = useState(false);
  const [tercihModalAcik, setTercihModalAcik] = useState(false);
  const [secimler, setSecimler] = useState({
    fonksiyonel: false,
    analitik:    false,
    pazarlama:   false,
  });

  // Karar verilmemişse veya manuel açıldıysa göster
  useEffect(() => {
    if (!tercihler || bannerAcik) {
      const t = setTimeout(() => setGosteriliyor(true), 800);
      return () => clearTimeout(t);
    }
  }, [tercihler, bannerAcik]);

  const handleTumunuKabul = () => {
    kabulEt({ fonksiyonel: true, analitik: true, pazarlama: false });
    setGosteriliyor(false);
    setTercihModalAcik(false);
  };

  const handleSadeceZorunlu = () => {
    reddet();
    setGosteriliyor(false);
    setTercihModalAcik(false);
  };

  const handleTercihKaydet = () => {
    kabulEt(secimler);
    setGosteriliyor(false);
    setTercihModalAcik(false);
  };

  return (
    <>
      {/* Ana banner */}
      <AnimatePresence>
        {gosteriliyor && !tercihModalAcik && (
          <motion.div
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 120, opacity: 0 }}
            transition={{ type: "spring", damping: 24, stiffness: 260 }}
            className="fixed bottom-0 left-0 right-0 md:bottom-6 md:left-1/2 md:-translate-x-1/2 z-[180] md:max-w-2xl w-full px-3 pb-3 md:px-0 md:pb-0"
          >
            <div className="glass-card rounded-2xl md:rounded-2xl p-4 md:p-5 border border-[rgba(251,192,36,0.15)] shadow-2xl">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-[rgba(251,192,36,0.12)] border border-[rgba(251,192,36,0.2)] flex items-center justify-center shrink-0">
                  <Cookie className="w-4 h-4 text-[#fbc024]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white mb-1">Çerezler hakkında</p>
                  <p className="text-xs text-[#94a3b8] leading-relaxed">
                    Platformun düzgün çalışması için zorunlu çerezler kullanılmaktadır.
                    Analitik ve fonksiyonel çerezler için onayınızı istiyoruz.{" "}
                    <Link href="/politikalar/cerez" className="text-[#fbc024] hover:underline">
                      Çerez Politikası
                    </Link>
                  </p>
                </div>
                <button onClick={handleSadeceZorunlu}
                  className="text-[#475569] hover:text-[#94a3b8] transition-colors shrink-0 mt-0.5">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                <button
                  onClick={handleSadeceZorunlu}
                  className="flex-1 min-w-[100px] py-2 rounded-xl border border-[rgba(255,255,255,0.1)] text-[#94a3b8] text-xs font-medium hover:bg-[rgba(255,255,255,0.05)] transition-colors"
                >
                  Sadece Zorunlular
                </button>
                <button
                  onClick={() => setTercihModalAcik(true)}
                  className="flex-1 min-w-[100px] py-2 rounded-xl border border-[rgba(255,255,255,0.12)] text-[#94a3b8] text-xs font-medium hover:bg-[rgba(255,255,255,0.05)] transition-colors"
                >
                  Tercihler
                </button>
                <button
                  onClick={handleTumunuKabul}
                  className="flex-1 min-w-[100px] py-2 rounded-xl bg-[#fbc024] text-[#0e172a] text-xs font-bold hover:bg-[#d9a61f] transition-colors"
                >
                  Tümünü Kabul Et
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tercihler modali */}
      <AnimatePresence>
        {tercihModalAcik && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[181] flex items-end sm:items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setTercihModalAcik(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 32 }} transition={{ duration: 0.2 }}
              className="w-full max-w-sm glass-card rounded-2xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white">Çerez Tercihleri</h3>
                <button onClick={() => setTercihModalAcik(false)}
                  className="text-[#475569] hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                {[
                  {
                    key:         "zorunlu" as const,
                    baslik:      "Zorunlu Çerezler",
                    aciklama:    "Oturum ve güvenlik. Devre dışı bırakılamaz.",
                    aktif:       true,
                    engellenemez: true,
                  },
                  {
                    key:         "fonksiyonel" as const,
                    baslik:      "Fonksiyonel Çerezler",
                    aciklama:    "Tema, dil ve kişisel ayarlarınızı hatırlar.",
                    aktif:       secimler.fonksiyonel,
                    engellenemez: false,
                  },
                  {
                    key:         "analitik" as const,
                    baslik:      "Analitik Çerezler",
                    aciklama:    "Vercel Analytics — anonim kullanım istatistikleri.",
                    aktif:       secimler.analitik,
                    engellenemez: false,
                  },
                  {
                    key:         "pazarlama" as const,
                    baslik:      "Pazarlama Çerezleri",
                    aciklama:    "Şu an kullanılmıyor.",
                    aktif:       secimler.pazarlama,
                    engellenemez: true,
                  },
                ].map(({ key, baslik, aciklama, aktif, engellenemez }) => (
                  <div key={key}
                    className="flex items-start gap-3 p-3 rounded-xl"
                    style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <button
                      disabled={engellenemez}
                      onClick={() => key !== "zorunlu" && key !== "pazarlama" &&
                        setSecimler(s => ({ ...s, [key]: !s[key as keyof typeof s] }))}
                      className="mt-0.5 w-9 h-5 rounded-full relative transition-colors shrink-0 disabled:cursor-not-allowed"
                      style={{ backgroundColor: aktif ? "#fbc024" : "rgba(255,255,255,0.12)" }}
                    >
                      <span
                        className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow-sm"
                        style={{ left: aktif ? "calc(100% - 18px)" : "2px" }}
                      />
                    </button>
                    <div>
                      <p className="text-sm font-medium text-white">{baslik}</p>
                      <p className="text-xs text-[#64748b] mt-0.5">{aciklama}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button onClick={handleSadeceZorunlu}
                  className="flex-1 py-2.5 rounded-xl border border-[rgba(255,255,255,0.1)] text-[#94a3b8] text-xs font-medium hover:bg-[rgba(255,255,255,0.05)] transition-colors">
                  Sadece Zorunlular
                </button>
                <button onClick={handleTercihKaydet}
                  className="flex-1 py-2.5 rounded-xl bg-[#fbc024] text-[#0e172a] text-xs font-bold hover:bg-[#d9a61f] transition-colors">
                  Kaydet
                </button>
              </div>

              <p className="text-xs text-[#475569] text-center">
                <Link href="/politikalar/cerez" className="hover:text-[#fbc024] transition-colors">
                  Çerez Politikası
                </Link>
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
