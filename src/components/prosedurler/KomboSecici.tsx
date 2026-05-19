"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X } from "lucide-react";

interface Props {
  label: string;
  secili: string;
  onSecim: (v: string) => void;
  maddeler: string[];
  onEkle: (v: string) => void;
  onSil: (v: string) => void;
  /** Yalnızca bu listede olan maddeler silinebilir (X butonu gösterilir). Verilmezse tüm maddeler silinebilir. */
  ozelMaddeler?: string[];
  placeholder?: string;
}

export default function KomboSecici({
  label, secili, onSecim, maddeler, onEkle, onSil, ozelMaddeler, placeholder = "Seçin...",
}: Props) {
  const [yeni, setYeni] = useState("");
  const [acik, setAcik] = useState(false);

  const handleEkle = () => {
    const v = yeni.trim();
    if (!v) return;
    onEkle(v);
    setYeni("");
  };

  return (
    <div className="relative">
      <label className="text-xs text-gray-400 font-medium block mb-1.5">{label}</label>

      <button
        type="button"
        onClick={() => setAcik(a => !a)}
        className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 text-sm text-left flex items-center justify-between focus:outline-none hover:border-gray-200 transition-colors"
      >
        <span className="truncate">{secili || placeholder}</span>
        <span className="text-gray-400 text-xs ml-2 shrink-0">{acik ? "▴" : "▾"}</span>
      </button>

      <AnimatePresence>
        {acik && (
          <>
            {/* Şeffaf backdrop — dışarı tıklanınca kapatır, ekranı karartmaz */}
            <div
              className="fixed inset-0"
              style={{ zIndex: 9998 }}
              onClick={() => setAcik(false)}
            />

            {/* Dropdown — yalnızca kendi arkasını blur yapar */}
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.12 }}
              className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden"
              style={{
                zIndex: 9999,
                backgroundColor: "rgba(10, 18, 35, 0.88)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                border: "1px solid rgba(255,255,255,0.14)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.7)",
                maxHeight: 240,
                overflowY: "auto",
              }}
            >
              {maddeler.map(m => (
                <div
                  key={m}
                  className="flex items-center gap-2 px-3 py-2.5 cursor-pointer group transition-colors"
                  style={{
                    backgroundColor: secili === m ? "var(--mint)" : "transparent",
                  }}
                  onMouseEnter={e => {
                    if (secili !== m) (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.06)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = secili === m ? "var(--mint)" : "transparent";
                  }}
                >
                  <span
                    className="flex-1 text-sm"
                    style={{ color: secili === m ? "var(--leaf)" : "white" }}
                    onClick={() => { onSecim(m); setAcik(false); }}
                  >
                    {m}
                  </span>
                  {(!ozelMaddeler || ozelMaddeler.includes(m)) && (
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); onSil(m); }}
                      className="w-5 h-5 flex items-center justify-center rounded text-gray-500 hover:text-[#ef4444] transition-colors shrink-0"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}

              {/* Yeni ekle */}
              <div className="flex items-center gap-2 px-3 py-2.5 border-t border-gray-200">
                <input
                  value={yeni}
                  onChange={e => setYeni(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleEkle(); } }}
                  placeholder="Yeni ekle..."
                  className="flex-1 text-sm bg-transparent text-gray-800 placeholder-[#475569] outline-none"
                />
                <button
                  type="button"
                  onClick={handleEkle}
                  className="w-6 h-6 flex items-center justify-center rounded bg-[var(--mint)] text-[var(--leaf)] hover:bg-[var(--forest-200, #B3E8C8)] transition-colors shrink-0"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
