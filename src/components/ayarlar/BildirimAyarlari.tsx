"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, Lock, Volume2, VolumeX, BellRing, BellOff,
  Clock, ChevronDown, Wallet, AlertTriangle,
} from "lucide-react";
import { useBildirimAyarlari } from "@/store/bildirimAyarlari";
import { pushIzniIste }        from "@/lib/bildirimler/push";
import type { BildirimModul, BildirimTip } from "@/store/bildirimler";

const MODUL_LABEL: Record<BildirimModul, string> = {
  "stok":        "Stok Yönetimi",
  "nakit-akisi": "Nakit Akışı",
  "kar-zarar":   "Kâr-Zarar",
  "gorevler":    "Görevler",
  "prosedurler": "Prosedürler",
  "acil-fon":    "Acil Durum Fonu",
  "sistem":      "Sistem",
  "ekip":        "Ekip",
};

const TIP_LABEL: Record<BildirimTip, string> = {
  kritik: "Kritik",
  uyari:  "Uyarı",
  bilgi:  "Bilgi",
  basari: "Başarı",
};

const TIP_RENK: Record<BildirimTip, string> = {
  kritik: "#ef4444",
  uyari:  "#fbc024",
  bilgi:  "#94a3b8",
  basari: "#22c55e",
};

const MODUL_SIRA: BildirimModul[] = [
  "stok", "nakit-akisi", "kar-zarar", "gorevler",
  "prosedurler", "acil-fon", "sistem", "ekip",
];

const TIP_SIRA: BildirimTip[] = ["kritik", "uyari", "bilgi", "basari"];

function Toggle({
  checked, onChange, disabled = false,
}: {
  checked: boolean; onChange: () => void; disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onChange}
      disabled={disabled}
      className="relative shrink-0 rounded-full transition-colors"
      style={{
        width: 40, height: 22,
        backgroundColor: checked
          ? (disabled ? "#4a5568" : "#fbc024")
          : "rgba(255,255,255,0.10)",
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      <motion.div
        animate={{ x: checked ? 20 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        style={{ width: 18, height: 18, top: 2 }}
        className="absolute rounded-full bg-white shadow-sm"
      />
    </button>
  );
}

function Bolum({ label }: { label: string }) {
  return (
    <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest mb-3">
      {label}
    </p>
  );
}

function Ayrac() {
  return <div className="border-t border-[rgba(255,255,255,0.06)]" />;
}

export default function BildirimAyarlari() {
  const {
    modul, tip, ses, push, sessizSaat, kasaMinEsikKurus,
    setModul, setTip, setSes, setPush, setSessizSaat, setKasaMinEsik,
  } = useBildirimAyarlari();

  const [pushHata, setPushHata] = useState("");
  const [kasaTlStr, setKasaTlStr] = useState(
    () => kasaMinEsikKurus > 0 ? (kasaMinEsikKurus / 100).toString() : ""
  );

  const handlePushToggle = async () => {
    if (push) {
      setPush(false);
      setPushHata("");
      return;
    }
    const izinVerildi = await pushIzniIste();
    if (izinVerildi) {
      setPush(true);
      setPushHata("");
    } else {
      setPush(false);
      if (typeof Notification !== "undefined" && Notification.permission === "denied") {
        setPushHata("Tarayıcı bildirimlerini reddetmişsiniz. Tarayıcı ayarlarından açın.");
      } else {
        setPushHata("Tarayıcınız bildirimleri desteklemiyor.");
      }
    }
  };

  const handleKasaBlur = () => {
    const val = parseFloat(kasaTlStr.replace(",", "."));
    if (!isNaN(val) && val >= 0) {
      const yeniKurus = Math.round(val * 100);
      setKasaMinEsik(yeniKurus);
      setKasaTlStr(yeniKurus > 0 ? (yeniKurus / 100).toString() : "");
    } else {
      setKasaTlStr(kasaMinEsikKurus > 0 ? (kasaMinEsikKurus / 100).toString() : "");
    }
  };

  return (
    <div className="glass-card rounded-2xl p-6 space-y-6">

      {/* Başlık */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-[rgba(251,192,36,0.12)] border border-[rgba(251,192,36,0.2)] flex items-center justify-center">
          <Bell className="w-4 h-4 text-[#fbc024]" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white">Bildirim Tercihleri</h2>
          <p className="text-xs text-[#94a3b8]">Değişiklikler otomatik kaydedilir</p>
        </div>
      </div>

      <Ayrac />

      {/* Modüller */}
      <div>
        <Bolum label="Modüller" />
        <div className="space-y-3">
          {MODUL_SIRA.map((key) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-sm text-white">{MODUL_LABEL[key]}</span>
              <Toggle
                checked={modul[key]}
                onChange={() => setModul(key, !modul[key])}
              />
            </div>
          ))}
        </div>
      </div>

      <Ayrac />

      {/* Bildirim Tipleri */}
      <div>
        <Bolum label="Bildirim Tipleri" />
        <div className="space-y-3">
          {TIP_SIRA.map((key) => {
            const kilitledi = key === "kritik";
            return (
              <div key={key} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: TIP_RENK[key] }}
                  />
                  <span className="text-sm text-white">{TIP_LABEL[key]}</span>
                  {kilitledi && (
                    <Lock className="w-3 h-3 text-[#64748b]" />
                  )}
                </div>
                <Toggle
                  checked={tip[key]}
                  onChange={() => setTip(key, !tip[key])}
                  disabled={kilitledi}
                />
              </div>
            );
          })}
        </div>
      </div>

      <Ayrac />

      {/* Ses + Push */}
      <div className="space-y-4">
        <Bolum label="Kanallar" />

        {/* Bildirim Sesi */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {ses ? (
              <Volume2 className="w-4 h-4 text-[#94a3b8]" />
            ) : (
              <VolumeX className="w-4 h-4 text-[#64748b]" />
            )}
            <span className="text-sm text-white">Bildirim sesi</span>
          </div>
          <Toggle checked={ses} onChange={() => setSes(!ses)} />
        </div>

        {/* Tarayıcı Bildirimleri */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {push ? (
                <BellRing className="w-4 h-4 text-[#94a3b8]" />
              ) : (
                <BellOff className="w-4 h-4 text-[#64748b]" />
              )}
              <span className="text-sm text-white">Tarayıcı bildirimleri</span>
            </div>
            <Toggle checked={push} onChange={handlePushToggle} />
          </div>
          <AnimatePresence>
            {pushHata && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-start gap-2 px-3 py-2 rounded-lg bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)]"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-[#ef4444] shrink-0 mt-0.5" />
                <p className="text-xs text-[#ef4444]">{pushHata}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <Ayrac />

      {/* Sessiz Saat */}
      <div className="space-y-3">
        <Bolum label="Sessiz Saat" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#94a3b8]" />
            <span className="text-sm text-white">Sessiz saati etkinleştir</span>
          </div>
          <Toggle
            checked={sessizSaat.aktif}
            onChange={() => setSessizSaat({ aktif: !sessizSaat.aktif })}
          />
        </div>

        <AnimatePresence>
          {sessizSaat.aktif && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: "hidden" }}
            >
              <div className="flex items-center gap-3 pt-1">
                <div className="flex-1">
                  <label className="text-xs text-[#64748b] block mb-1">Başlangıç</label>
                  <input
                    type="time"
                    value={sessizSaat.baslangic}
                    onChange={(e) => setSessizSaat({ baslangic: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm text-white border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.05)] focus:outline-none focus:border-[rgba(251,192,36,0.4)] scheme-dark"
                  />
                </div>
                <ChevronDown className="w-4 h-4 text-[#475569] mt-4 shrink-0 -rotate-90" />
                <div className="flex-1">
                  <label className="text-xs text-[#64748b] block mb-1">Bitiş</label>
                  <input
                    type="time"
                    value={sessizSaat.bitis}
                    onChange={(e) => setSessizSaat({ bitis: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm text-white border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.05)] focus:outline-none focus:border-[rgba(251,192,36,0.4)] scheme-dark"
                  />
                </div>
              </div>
              <p className="text-xs text-[#475569] mt-2">
                Bu aralıkta bildirimler sessiz eklenir — ses ve push devre dışı kalır.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Ayrac />

      {/* Kasa Minimum Eşiği */}
      <div>
        <Bolum label="Kritik Eşikler" />
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-[#94a3b8]" />
              <span className="text-sm text-white">Kasa minimum eşiği</span>
            </div>
          </div>
          <div className="relative">
            <input
              type="number"
              min="0"
              step="1"
              value={kasaTlStr}
              onChange={(e) => setKasaTlStr(e.target.value)}
              onBlur={handleKasaBlur}
              placeholder="0 — devre dışı"
              className="w-full pr-10 px-3 py-2.5 rounded-xl text-sm text-white border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.05)] focus:outline-none focus:border-[rgba(251,192,36,0.4)] placeholder-[#475569] transition-colors"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#64748b] pointer-events-none">
              TL
            </span>
          </div>
          <p className="text-xs text-[#475569]">
            Kasa bakiyesi bu değerin altına düşünce bildirim gönderilir. 0 = kapalı.
          </p>
        </div>
      </div>

    </div>
  );
}
