"use client";

import { useState }        from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Lock, Volume2, VolumeX, BellRing, BellOff,
  Clock, ChevronDown, Wallet, AlertTriangle,
} from "lucide-react";
import { useBildirimAyarlari } from "@/store/bildirimAyarlari";
import { pushIzniIste }        from "@/lib/bildirimler/push";
import type { BildirimModul, BildirimTip } from "@/store/bildirimler";
import Toggle from "@/components/ayarlar/Toggle";

// ── Sabitler ────────────────────────────────────────────────────────────────
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
  uyari:  "var(--leaf)",
  bilgi:  "#94a3b8",
  basari: "#22c55e",
};

const MODUL_SIRA: BildirimModul[] = [
  "stok", "nakit-akisi", "kar-zarar", "gorevler",
  "prosedurler", "acil-fon", "sistem", "ekip",
];

const TIP_SIRA: BildirimTip[] = ["kritik", "uyari", "bilgi", "basari"];

const KART = "bg-white rounded-xl p-5 space-y-3";
const KART_STIL = { border: "0.5px solid rgba(0,0,0,0.08)" };

// ── Ana bileşen ──────────────────────────────────────────────────────────────
export default function BildirimPanel() {
  const {
    modul, tip, ses, push, sessizSaat, kasaMinEsikKurus,
    setModul, setTip, setSes, setPush, setSessizSaat, setKasaMinEsik,
  } = useBildirimAyarlari();

  const [pushHata,   setPushHata]   = useState("");
  const [kasaTlStr,  setKasaTlStr]  = useState(
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
    <div className="space-y-4">

      {/* Panel başlık */}
      <div>
        <p className="label-caps">TERCİHLER</p>
        <h2 className="text-xl font-medium text-gray-900 mt-1">Bildirimler</h2>
        <p className="text-sm text-gray-500 mt-1">
          Email, push ve uyarı tercihlerini yönet — değişiklikler otomatik kaydedilir
        </p>
      </div>

      {/* ── KART 1 — Modüller ── */}
      <div className={KART} style={KART_STIL}>
        <div>
          <p className="text-sm font-medium text-gray-800">Modüller</p>
          <p className="text-xs text-gray-500 mt-0.5">Hangi modüllerin bildirimi gelsin</p>
        </div>
        <div>
          {MODUL_SIRA.map((key, i) => (
            <div
              key={key}
              className="flex items-center justify-between py-2.5"
              style={i > 0 ? { borderTop: "0.5px solid rgba(0,0,0,0.06)" } : undefined}
            >
              <span className="text-sm text-gray-700">{MODUL_LABEL[key]}</span>
              <Toggle
                checked={modul[key]}
                onChange={() => setModul(key, !modul[key])}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ── KART 2 — Bildirim Tipleri ── */}
      <div className={KART} style={KART_STIL}>
        <div>
          <p className="text-sm font-medium text-gray-800">Bildirim Tipleri</p>
          <p className="text-xs text-gray-500 mt-0.5">Kritik bildirimler her zaman açık kalır</p>
        </div>
        <div>
          {TIP_SIRA.map((key, i) => {
            const kilitledi = key === "kritik";
            return (
              <div
                key={key}
                className="flex items-center justify-between py-2.5"
                style={i > 0 ? { borderTop: "0.5px solid rgba(0,0,0,0.06)" } : undefined}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: TIP_RENK[key] }}
                  />
                  <span className="text-sm text-gray-700">{TIP_LABEL[key]}</span>
                  {kilitledi && <Lock className="w-3 h-3 text-gray-400" />}
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

      {/* ── KART 3 — Kanallar ── */}
      <div className={KART} style={KART_STIL}>
        <div>
          <p className="text-sm font-medium text-gray-800">Kanallar</p>
          <p className="text-xs text-gray-500 mt-0.5">Bildirim ses ve tarayıcı izinleri</p>
        </div>

        {/* Bildirim Sesi */}
        <div className="flex items-center justify-between py-2.5" style={{ borderTop: "0.5px solid rgba(0,0,0,0.06)" }}>
          <div className="flex items-center gap-2">
            {ses
              ? <Volume2 className="w-4 h-4 text-gray-400" />
              : <VolumeX className="w-4 h-4 text-gray-500" />}
            <span className="text-sm text-gray-700">Bildirim sesi</span>
          </div>
          <Toggle checked={ses} onChange={() => setSes(!ses)} />
        </div>

        {/* Tarayıcı Bildirimleri */}
        <div className="space-y-2" style={{ borderTop: "0.5px solid rgba(0,0,0,0.06)" }}>
          <div className="flex items-center justify-between py-2.5">
            <div className="flex items-center gap-2">
              {push
                ? <BellRing className="w-4 h-4 text-gray-400" />
                : <BellOff  className="w-4 h-4 text-gray-500" />}
              <span className="text-sm text-gray-700">Tarayıcı bildirimleri</span>
            </div>
            <Toggle checked={push} onChange={handlePushToggle} />
          </div>
          <AnimatePresence>
            {pushHata && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: "hidden" }}
              >
                <div className="flex items-start gap-2 px-3 py-2 rounded-lg"
                  style={{ background: "rgba(201,118,118,0.08)", color: "#C97676" }}>
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <p className="text-xs">{pushHata}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── KART 4 — Sessiz Saat ── */}
      <div className={KART} style={KART_STIL}>
        <div>
          <p className="text-sm font-medium text-gray-800">Sessiz Saat</p>
          <p className="text-xs text-gray-500 mt-0.5">Belirlediğin saat aralığında sessiz mod</p>
        </div>

        <div className="flex items-center justify-between py-2.5" style={{ borderTop: "0.5px solid rgba(0,0,0,0.06)" }}>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-700">Sessiz saati etkinleştir</span>
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
                  <label className="text-xs text-gray-500 block mb-1">Başlangıç</label>
                  <input
                    type="time"
                    value={sessizSaat.baslangic}
                    onChange={(e) => setSessizSaat({ baslangic: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm text-gray-800 border border-gray-200 bg-gray-50 focus:outline-none focus:border-[var(--leaf)]"
                  />
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400 mt-4 shrink-0 -rotate-90" />
                <div className="flex-1">
                  <label className="text-xs text-gray-500 block mb-1">Bitiş</label>
                  <input
                    type="time"
                    value={sessizSaat.bitis}
                    onChange={(e) => setSessizSaat({ bitis: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm text-gray-800 border border-gray-200 bg-gray-50 focus:outline-none focus:border-[var(--leaf)]"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Bu aralıkta bildirimler sessiz eklenir — ses ve push devre dışı kalır.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── KART 5 — Kritik Eşikler ── */}
      <div className={KART} style={KART_STIL}>
        <div>
          <p className="text-sm font-medium text-gray-800">Kritik Eşikler</p>
          <p className="text-xs text-gray-500 mt-0.5">Otomatik uyarı tetikleyici değerler</p>
        </div>

        <div className="space-y-2 pt-1" style={{ borderTop: "0.5px solid rgba(0,0,0,0.06)" }}>
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-700">Kasa minimum eşiği</span>
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
              className="w-full pr-10 px-3 py-2.5 rounded-xl text-sm text-gray-800 border border-gray-200 bg-gray-50 focus:outline-none focus:border-[var(--leaf)] placeholder-gray-400 transition-colors"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 pointer-events-none">
              TL
            </span>
          </div>
          <p className="text-xs text-gray-500">
            Kasa bakiyesi bu değerin altına düşünce bildirim gönderilir. 0 = kapalı.
          </p>
        </div>
      </div>

    </div>
  );
}
