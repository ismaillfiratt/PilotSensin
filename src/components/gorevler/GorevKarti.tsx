"use client";

import { motion } from "framer-motion";
import { Pencil, Trash2, ChevronLeft, ChevronRight, User, Calendar, GripVertical, CheckCircle2 } from "lucide-react";
import { useDraggable } from "@dnd-kit/core";
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

function tamamlanmaEtiketi(gorev: Gorev): { etiket: string; renk: string } {
  if (!gorev.tamamlanmaTarihi) return { etiket: "Tamamlandı", renk: "#22c55e" };
  const gecikmeMs = new Date(gorev.tamamlanmaTarihi).getTime() - new Date(gorev.sonTarih).getTime();
  const gun = Math.round(gecikmeMs / 86400000);
  if (gun <= 0) return { etiket: "Zamanında tamamlandı", renk: "#22c55e" };
  return { etiket: `${gun} gün gecikmeli tamamlandı`, renk: "#f97316" };
}

export default function GorevKarti({ gorev, index, onDuzenle, onSil, onTasi }: Props) {
  const oncelikCfg = ONCELIK_CONFIG[gorev.oncelik];
  const durumIdx   = DURUM_SIRASI.indexOf(gorev.durum);
  const solDurum   = durumIdx > 0 ? DURUM_SIRASI[durumIdx - 1] : null;
  const sagDurum   = durumIdx < DURUM_SIRASI.length - 1 ? DURUM_SIRASI[durumIdx + 1] : null;
  const tamamlandi = gorev.durum === "tamamlandi";

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: gorev.id,
    data: { durum: gorev.durum },
  });

  const tarihBilgi = tamamlandi ? tamamlanmaEtiketi(gorev) : sonTarihDurumu(gorev.sonTarih);

  return (
    <motion.div
      ref={setNodeRef}
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: isDragging ? 0.35 : 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.22, delay: index * 0.04 }}
      style={transform ? { transform: `translate3d(${transform.x}px,${transform.y}px,0)`, zIndex: 50 } : undefined}
      className="glass-card rounded-xl p-4 group hover:border-[rgba(251,192,36,0.3)] transition-all"
    >
      {/* Başlık satırı */}
      <div className="flex items-start gap-2 mb-2">
        <button {...listeners} {...attributes}
          className="mt-0.5 shrink-0 text-[#475569] hover:text-[#94a3b8] cursor-grab active:cursor-grabbing transition-colors touch-none">
          <GripVertical className="w-4 h-4" />
        </button>
        <p className={`flex-1 text-sm font-semibold leading-snug ${tamamlandi ? "line-through text-[#94a3b8]" : "text-white"}`}>
          {gorev.baslik}
        </p>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
          style={{ color: oncelikCfg.color, backgroundColor: oncelikCfg.bg }}>
          {oncelikCfg.label}
        </span>
      </div>

      {gorev.aciklama && (
        <p className="text-xs text-[#94a3b8] mb-3 line-clamp-2 ml-6">{gorev.aciklama}</p>
      )}

      {/* Sorumlu + tarih */}
      <div className="flex items-center justify-between text-xs mb-3 ml-6">
        <div className="flex items-center gap-1.5 text-[#94a3b8]">
          <User className="w-3 h-3" />
          <span>{gorev.sorumlu}</span>
        </div>
        <div className="flex items-center gap-1" style={{ color: tarihBilgi.renk }}>
          {tamamlandi ? <CheckCircle2 className="w-3 h-3" /> : <Calendar className="w-3 h-3" />}
          <span className="font-medium text-[11px]">{tarihBilgi.etiket}</span>
        </div>
      </div>

      {/* Aksiyonlar */}
      <div className="flex items-center gap-1.5 pt-2 border-t border-[rgba(255,255,255,0.05)]">
        <button onClick={() => solDurum && onTasi(solDurum)} disabled={!solDurum}
          title={solDurum ? DURUM_CONFIG[solDurum].label : ""}
          className="w-7 h-7 flex items-center justify-center rounded-lg border border-[rgba(255,255,255,0.08)] text-[#94a3b8] disabled:opacity-20 hover:enabled:border-[rgba(251,192,36,0.4)] hover:enabled:text-[#fbc024] transition-all">
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => sagDurum && onTasi(sagDurum)} disabled={!sagDurum}
          title={sagDurum ? DURUM_CONFIG[sagDurum].label : ""}
          className="w-7 h-7 flex items-center justify-center rounded-lg border border-[rgba(255,255,255,0.08)] text-[#94a3b8] disabled:opacity-20 hover:enabled:border-[rgba(34,197,94,0.4)] hover:enabled:text-[#22c55e] transition-all">
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
        <div className="flex-1" />
        <button onClick={onDuzenle}
          className="w-7 h-7 flex items-center justify-center rounded-lg border border-[rgba(255,255,255,0.08)] text-[#94a3b8] hover:border-[rgba(251,192,36,0.4)] hover:text-[#fbc024] transition-all">
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button onClick={onSil}
          className="w-7 h-7 flex items-center justify-center rounded-lg border border-[rgba(255,255,255,0.08)] text-[#94a3b8] hover:border-[rgba(239,68,68,0.4)] hover:text-[#ef4444] transition-all">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}
