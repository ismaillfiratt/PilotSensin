"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Circle, RotateCcw } from "lucide-react";
import { KATEGORI_RENK, type ChecklistItem, type ChecklistSikligi } from "@/lib/prosedur-data";

interface Props {
  items: ChecklistItem[];
  setItems: React.Dispatch<React.SetStateAction<ChecklistItem[]>>;
}

export default function ChecklistPanel({ items, setItems }: Props) {
  const [sekme, setSekme] = useState<ChecklistSikligi>("gunluk");

  const filtreli = items.filter((c) => c.sikligi === sekme);
  const tamamlanan = filtreli.filter((c) => c.tamamlandi).length;
  const oran = filtreli.length > 0 ? (tamamlanan / filtreli.length) * 100 : 0;

  const toggle = (id: string) =>
    setItems((p) => p.map((c) => c.id === id ? { ...c, tamamlandi: !c.tamamlandi } : c));

  const hepsiniSifirla = () =>
    setItems((p) => p.map((c) => c.sikligi === sekme ? { ...c, tamamlandi: false } : c));

  const oranRenk = oran === 100 ? "#22c55e" : oran >= 50 ? "#fbc024" : "#ef4444";

  return (
    <div className="glass-card rounded-2xl p-5">
      {/* Başlık + sekme */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-sm font-semibold text-white">Kontrol Listesi</h2>
          <p className="text-xs text-[#94a3b8] mt-0.5">
            {tamamlanan}/{filtreli.length} tamamlandı
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={hepsiniSifirla}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[#94a3b8] border border-[rgba(255,255,255,0.08)] hover:text-[#fbc024] hover:border-[rgba(251,192,36,0.3)] transition-all"
            title="Hepsini sıfırla">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <div className="flex gap-1 p-1 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)]">
            {(["gunluk", "haftalik"] as const).map((v) => (
              <button key={v} onClick={() => setSekme(v)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  backgroundColor: sekme === v ? "rgba(251,192,36,0.15)" : "transparent",
                  color: sekme === v ? "#fbc024" : "#94a3b8",
                  border: sekme === v ? "1px solid rgba(251,192,36,0.3)" : "1px solid transparent",
                }}>
                {v === "gunluk" ? "Günlük" : "Haftalık"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* İlerleme çubuğu */}
      <div className="mb-5">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs text-[#94a3b8]">Tamamlanma oranı</span>
          <span className="text-xs font-bold" style={{ color: oranRenk }}>%{Math.round(oran)}</span>
        </div>
        <div className="h-2 rounded-full bg-[rgba(255,255,255,0.06)]">
          <motion.div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${oran}%`, backgroundColor: oranRenk }}
          />
        </div>
      </div>

      {/* Checklist öğeleri */}
      <div className="space-y-2">
        {filtreli.length === 0 && (
          <p className="text-center text-sm text-[#94a3b8] py-8">Öğe yok.</p>
        )}
        {filtreli.map((item, i) => {
          const kRenk = KATEGORI_RENK[item.kategori];
          return (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => toggle(item.id)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left group"
              style={{
                backgroundColor: item.tamamlandi ? "rgba(34,197,94,0.06)" : "rgba(255,255,255,0.03)",
                borderColor: item.tamamlandi ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.07)",
              }}
            >
              {/* Checkbox ikonu */}
              {item.tamamlandi
                ? <CheckCircle2 className="w-5 h-5 text-[#22c55e] shrink-0" />
                : <Circle className="w-5 h-5 text-[#94a3b8] shrink-0 group-hover:text-[#fbc024] transition-colors" />
              }

              {/* İçerik */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium leading-snug ${item.tamamlandi ? "line-through text-[#94a3b8]" : "text-white"}`}>
                  {item.baslik}
                </p>
                <p className="text-xs text-[#94a3b8] mt-0.5">{item.sorumlu}</p>
              </div>

              {/* Kategori rozeti */}
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg shrink-0"
                style={{ color: kRenk.color, backgroundColor: kRenk.bg }}>
                {item.kategori.split(" ")[0]}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
