"use client";

import { motion } from "framer-motion";
import { Pencil, Trash2, ChevronLeft, ChevronRight, User, Calendar } from "lucide-react";
import {
  ONCELIK_CONFIG, DURUM_CONFIG, DURUM_SIRASI, sonTarihDurumu,
  type Gorev, type GorevDurumu,
} from "@/lib/gorev-data";

interface Props {
  gorev: Gorev;
  index: number;
  onDuzenle: () => void;
  onSil: () => void;
  onTasi: (yeniDurum: GorevDurumu) => void;
}

export default function GorevKarti({ gorev, index, onDuzenle, onSil, onTasi }: Props) {
  const oncelikCfg = ONCELIK_CONFIG[gorev.oncelik];
  const tarihDurum = sonTarihDurumu(gorev.sonTarih);
  const durumIdx   = DURUM_SIRASI.indexOf(gorev.durum);
  const solDurum   = durumIdx > 0 ? DURUM_SIRASI[durumIdx - 1] : null;
  const sagDurum   = durumIdx < DURUM_SIRASI.length - 1 ? DURUM_SIRASI[durumIdx + 1] : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.22, delay: index * 0.04 }}
      className="glass-card rounded-xl p-4 group hover:border-[rgba(251,192,36,0.3)] transition-all"
    >
      {/* Başlık + öncelik */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className={`text-sm font-semibold leading-snug ${gorev.durum === "tamamlandi" ? "line-through text-[#94a3b8]" : "text-white"}`}>
          {gorev.baslik}
        </p>
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
          style={{ color: oncelikCfg.color, backgroundColor: oncelikCfg.bg }}
        >
          {oncelikCfg.label}
        </span>
      </div>

      {/* Açıklama */}
      {gorev.aciklama && (
        <p className="text-xs text-[#94a3b8] mb-3 line-clamp-2">{gorev.aciklama}</p>
      )}

      {/* Sorumlu + tarih */}
      <div className="flex items-center justify-between text-xs mb-3">
        <div className="flex items-center gap-1.5 text-[#94a3b8]">
          <User className="w-3 h-3" />
          <span>{gorev.sorumlu}</span>
        </div>
        <div className="flex items-center gap-1" style={{ color: tarihDurum.renk }}>
          <Calendar className="w-3 h-3" />
          <span className="font-medium">{tarihDurum.etiket}</span>
        </div>
      </div>

      {/* Aksiyonlar */}
      <div className="flex items-center gap-1.5 pt-2 border-t border-[rgba(255,255,255,0.05)]">
        {/* Sol ok: önceki sütuna taşı */}
        <button
          onClick={() => solDurum && onTasi(solDurum)}
          disabled={!solDurum}
          title={solDurum ? DURUM_CONFIG[solDurum].label : ""}
          className="w-7 h-7 flex items-center justify-center rounded-lg border border-[rgba(255,255,255,0.08)] text-[#94a3b8] disabled:opacity-20 hover:enabled:border-[rgba(251,192,36,0.4)] hover:enabled:text-[#fbc024] transition-all"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {/* Sağ ok: sonraki sütuna taşı */}
        <button
          onClick={() => sagDurum && onTasi(sagDurum)}
          disabled={!sagDurum}
          title={sagDurum ? DURUM_CONFIG[sagDurum].label : ""}
          className="w-7 h-7 flex items-center justify-center rounded-lg border border-[rgba(255,255,255,0.08)] text-[#94a3b8] disabled:opacity-20 hover:enabled:border-[rgba(34,197,94,0.4)] hover:enabled:text-[#22c55e] transition-all"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        <div className="flex-1" />

        {/* Düzenle */}
        <button
          onClick={onDuzenle}
          className="w-7 h-7 flex items-center justify-center rounded-lg border border-[rgba(255,255,255,0.08)] text-[#94a3b8] hover:border-[rgba(251,192,36,0.4)] hover:text-[#fbc024] transition-all"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>

        {/* Sil */}
        <button
          onClick={onSil}
          className="w-7 h-7 flex items-center justify-center rounded-lg border border-[rgba(255,255,255,0.08)] text-[#94a3b8] hover:border-[rgba(239,68,68,0.4)] hover:text-[#ef4444] transition-all"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}
