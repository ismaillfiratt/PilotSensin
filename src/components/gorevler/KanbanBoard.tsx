"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, AlertTriangle } from "lucide-react";
import {
  DndContext, DragEndEvent, DragStartEvent, DragOverEvent,
  DragOverlay, PointerSensor, TouchSensor, useSensor, useSensors,
} from "@dnd-kit/core";
import { useDroppable } from "@dnd-kit/core";
import {
  DURUM_CONFIG, DURUM_SIRASI,
  type Gorev, type GorevDurumu,
} from "@/lib/gorev-data";
import { useGorevler } from "@/store/gorevler";
import GorevKarti from "./GorevKarti";
import GorevModal from "./GorevModal";

/* ── Tarihe göre sırala (en yeni üstte) ── */
function sirala(liste: Gorev[]) {
  return [...liste].sort(
    (a, b) => new Date(b.olusturmaTarih).getTime() - new Date(a.olusturmaTarih).getTime()
  );
}

/* ── Droppable sütun ── */
interface SutunProps {
  durum: GorevDurumu;
  liste: Gorev[];
  aktifId: string | null;
  onEkle: () => void;
  onDuzenle: (g: Gorev) => void;
  onSil: (g: Gorev) => void;
  onTasi: (id: string, yeni: GorevDurumu) => void;
}

function KanbanSutun({ durum, liste, aktifId, onEkle, onDuzenle, onSil, onTasi }: SutunProps) {
  const cfg = DURUM_CONFIG[durum];
  const { setNodeRef, isOver } = useDroppable({ id: durum });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between px-4 py-2.5 rounded-xl border"
        style={{ backgroundColor: cfg.bg, borderColor: cfg.border }}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.color }} />
          <span className="text-sm font-semibold" style={{ color: cfg.color }}>{cfg.label}</span>
          <span className="text-xs font-bold px-1.5 py-0.5 rounded-full"
            style={{ backgroundColor: `${cfg.color}20`, color: cfg.color }}>
            {liste.length}
          </span>
        </div>
        <button onClick={onEkle}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-[#94a3b8] hover:text-white hover:bg-[rgba(255,255,255,0.08)] transition-colors"
          title="Görev ekle">
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div ref={setNodeRef}
        className="flex flex-col gap-2 min-h-20 rounded-xl transition-all duration-150 p-1"
        style={isOver ? { backgroundColor: `${cfg.color}12`, outline: `2px dashed ${cfg.color}60` } : {}}>
        <AnimatePresence mode="popLayout">
          {liste.length === 0 ? (
            <motion.div key="bos" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="py-8 text-center text-xs border border-dashed rounded-xl transition-colors"
              style={{
                color: isOver ? cfg.color : "#94a3b8",
                borderColor: isOver ? `${cfg.color}60` : "rgba(255,255,255,0.06)",
              }}>
              {isOver ? "Buraya bırak" : "Görev eklenmedi"}
            </motion.div>
          ) : (
            sirala(liste).map((g, i) => (
              <GorevKarti key={g.id} gorev={g} index={i}
                onDuzenle={() => onDuzenle(g)}
                onSil={() => onSil(g)}
                onTasi={(yeni) => onTasi(g.id, yeni)}
              />
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

interface Props { otomatikAcilModal?: boolean; }

export default function KanbanBoard({ otomatikAcilModal }: Props) {
  const router = useRouter();
  const { gorevler, durumDegis, ekle, guncelle, sil: storesSil } = useGorevler();
  const [modalAcik, setModalAcik] = useState(false);
  const [duzenle, setDuzenle]     = useState<Gorev | null>(null);
  const [silOnayi, setSilOnayi]   = useState<Gorev | null>(null);
  const [yeniDurum, setYeniDurum] = useState<GorevDurumu>("yapilacak");
  const [aktifId, setAktifId]     = useState<string | null>(null);

  useEffect(() => {
    if (otomatikAcilModal) {
      setYeniDurum("yapilacak"); setDuzenle(null); setModalAcik(true);
      router.replace("/gorevler");
    }
  }, [otomatikAcilModal, router]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 150, tolerance: 8 } })
  );

  const handleDragStart = (e: DragStartEvent) => setAktifId(e.active.id as string);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setAktifId(null);
    if (!over) return;
    const gorevId = active.id as string;
    const yeni    = over.id as GorevDurumu;
    const mevcut  = gorevler.find((g) => g.id === gorevId)?.durum;
    if (yeni !== mevcut && DURUM_SIRASI.includes(yeni)) {
      durumDegis(gorevId, yeni);
    }
  };

  const aktifGorev = aktifId ? gorevler.find((g) => g.id === aktifId) ?? null : null;

  const handleKaydet = (form: Omit<Gorev, "id" | "olusturmaTarih">) => {
    if (duzenle) { guncelle(duzenle.id, { ...form, olusturmaTarih: duzenle.olusturmaTarih }); setDuzenle(null); }
    else         { ekle(form); }
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}
      onDragCancel={() => setAktifId(null)}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {DURUM_SIRASI.map((durum) => (
          <KanbanSutun
            key={durum} durum={durum} aktifId={aktifId}
            liste={gorevler.filter((g) => g.durum === durum)}
            onEkle={() => { setYeniDurum(durum); setDuzenle(null); setModalAcik(true); }}
            onDuzenle={(g) => { setDuzenle(g); setModalAcik(true); }}
            onSil={(g) => setSilOnayi(g)}
            onTasi={(id, yeni) => durumDegis(id, yeni)}
          />
        ))}
      </div>

      {/* Sürüklenirken görünen klon */}
      <DragOverlay dropAnimation={{ duration: 180, easing: "ease" }}>
        {aktifGorev && (
          <GorevKarti gorev={aktifGorev} index={0} isOverlay
            onDuzenle={() => {}} onSil={() => {}} onTasi={() => {}} />
        )}
      </DragOverlay>

      <GorevModal open={modalAcik}
        onClose={() => { setModalAcik(false); setDuzenle(null); }}
        gorev={duzenle} varsayilanDurum={yeniDurum} onKaydet={handleKaydet} />

      <AnimatePresence>
        {silOnayi && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setSilOnayi(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }} transition={{ duration: 0.18 }}
              className="w-full max-w-sm glass-card rounded-2xl p-6">
              <div className="w-12 h-12 rounded-xl bg-[rgba(239,68,68,0.12)] border border-[rgba(239,68,68,0.25)] flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-[#ef4444]" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">Görevi Sil</h3>
              <p className="text-sm text-[#94a3b8] mb-6">
                <span className="text-white font-semibold">{silOnayi.baslik}</span> görevini silmek istediğinizden emin misiniz?
              </p>
              <div className="flex gap-3">
                <button onClick={() => setSilOnayi(null)}
                  className="flex-1 py-2.5 rounded-xl border border-[rgba(255,255,255,0.1)] text-[#94a3b8] text-sm font-medium hover:bg-[rgba(255,255,255,0.05)] transition-colors">
                  İptal
                </button>
                <button onClick={() => { storesSil(silOnayi.id); setSilOnayi(null); }}
                  className="flex-1 py-2.5 rounded-xl bg-[#ef4444] text-white text-sm font-bold hover:bg-[#dc2626] transition-colors">
                  Evet, Sil
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DndContext>
  );
}
