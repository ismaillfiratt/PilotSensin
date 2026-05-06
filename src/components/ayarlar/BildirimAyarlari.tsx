"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Bell, Save, CheckCircle2 } from "lucide-react";

const MODULLER = [
  { key: "nakitAkisi",  label: "Nakit Akışı"       },
  { key: "karZarar",    label: "Kar-Zarar"          },
  { key: "stok",        label: "Stok Yönetimi"      },
  { key: "gorevler",    label: "Görevler"           },
  { key: "prosedurler", label: "Prosedürler"        },
  { key: "acilFon",     label: "Acil Durum Fonu"    },
];

const KANALLAR = [
  { key: "email",    label: "E-posta"  },
  { key: "push",     label: "Web Push" },
  { key: "whatsapp", label: "WhatsApp (yakında)" },
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className="relative w-10 h-5.5 rounded-full transition-colors shrink-0"
      style={{ backgroundColor: checked ? "#fbc024" : "rgba(255,255,255,0.1)" }}
    >
      <motion.div
        animate={{ x: checked ? 20 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white shadow-sm"
        style={{ width: 18, height: 18, top: 3 }}
      />
    </button>
  );
}

export default function BildirimAyarlari() {
  const [moduller, setModuller] = useState(
    Object.fromEntries(MODULLER.map((m) => [m.key, true]))
  );
  const [kanallar, setKanallar] = useState({ email: true, push: true, whatsapp: false });
  const [basarili, setBasarili] = useState(false);

  const toggleModul = (key: string) =>
    setModuller((p) => ({ ...p, [key]: !p[key] }));

  const toggleKanal = (key: string) =>
    setKanallar((p) => ({ ...p, [key]: !p[key as keyof typeof p] }));

  const kaydet = () => {
    setBasarili(true);
    setTimeout(() => setBasarili(false), 3000);
  };

  return (
    <div className="glass-card rounded-2xl p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-[rgba(251,192,36,0.12)] border border-[rgba(251,192,36,0.2)] flex items-center justify-center">
          <Bell className="w-4 h-4 text-[#fbc024]" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white">Bildirim Tercihleri</h2>
          <p className="text-xs text-[#94a3b8]">Hangi modüllerden uyarı almak istiyorsun?</p>
        </div>
      </div>

      {/* Modül toggleları */}
      <div>
        <p className="text-xs text-[#94a3b8] font-semibold uppercase tracking-wider mb-3">Modüller</p>
        <div className="space-y-3">
          {MODULLER.map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-sm text-white">{label}</span>
              <Toggle checked={moduller[key]} onChange={() => toggleModul(key)} />
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-[rgba(255,255,255,0.06)]" />

      {/* Kanal toggleları */}
      <div>
        <p className="text-xs text-[#94a3b8] font-semibold uppercase tracking-wider mb-3">Bildirim Kanalları</p>
        <div className="space-y-3">
          {KANALLAR.map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-sm text-white">{label}</span>
              <Toggle
                checked={kanallar[key as keyof typeof kanallar]}
                onChange={() => toggleKanal(key)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        {basarili && (
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-[#22c55e] text-sm"
          >
            <CheckCircle2 className="w-4 h-4" />
            Kaydedildi
          </motion.div>
        )}
        <button
          onClick={kaydet}
          className="ml-auto flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#fbc024] text-[#0e172a] text-sm font-bold hover:bg-[#d9a61f] transition-colors"
        >
          <Save className="w-4 h-4" />
          Kaydet
        </button>
      </div>
    </div>
  );
}
