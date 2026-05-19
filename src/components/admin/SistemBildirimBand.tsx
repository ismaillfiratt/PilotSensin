"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import { useSirket } from "@/store/sirket";
import type { RealtimeChannel } from "@supabase/supabase-js";

type BildirimTip   = "kritik" | "duyuru" | "guncelleme";
type BildirimHedef = "tumu"   | "pilot"  | "copilot";

interface SistemBildirim {
  id: string; baslik: string; mesaj: string;
  tip: BildirimTip; hedef: BildirimHedef; olusturma: string;
}
interface Toast extends SistemBildirim { toastId: string; }

const TIP: Record<BildirimTip, { renk: string; ikon: string }> = {
  kritik:     { renk: "#ef4444", ikon: "🚨" },
  duyuru:     { renk: "var(--leaf)", ikon: "📢" },
  guncelleme: { renk: "#22c55e", ikon: "✅" },
};

function ToastItem({ t, onKapat }: { t: Toast; onKapat: (id: string) => void }) {
  const cfg = TIP[t.tip] ?? TIP.duyuru;
  return (
    <motion.div layout
      initial={{ opacity: 0, y: 24, scale: 0.94 }}
      animate={{ opacity: 1, y: 0,  scale: 1     }}
      exit={{ opacity: 0, y: 12, scale: 0.94 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="w-80 rounded-2xl shadow-2xl overflow-hidden"
      style={{ background: "rgba(14,23,42,0.97)", border: `1px solid ${cfg.renk}55`, backdropFilter: "blur(20px)" }}>
      {/* Üst renkli çizgi */}
      <div className="h-1" style={{ background: `linear-gradient(90deg, ${cfg.renk}, ${cfg.renk}88)` }} />
      <div className="p-4 flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-lg"
          style={{ background: `${cfg.renk}18`, border: `1px solid ${cfg.renk}33` }}>
          {cfg.ikon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white leading-snug">{t.baslik}</p>
          <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "#94a3b8" }}>{t.mesaj}</p>
          <p className="text-[10px] mt-1.5" style={{ color: "#475569" }}>
            {new Date(t.olusturma).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
            {" · PilotSensin"}
          </p>
        </div>
        <button onClick={() => onKapat(t.id)}
          className="text-gray-500 hover:text-white transition-colors shrink-0 text-xl leading-none mt-0.5"
          aria-label="Bildirimi kapat">×</button>
      </div>
    </motion.div>
  );
}

export default function SistemBildirimBand() {
  const [toastlar,  setToastlar]  = useState<Toast[]>([]);
  const kanalRef   = useRef<RealtimeChannel | null>(null);
  const timerRef   = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const gorulenRef = useRef<Set<string>>(new Set());

  const rol      = useSirket((s) => s.rol);
  const yuklendi = useSirket((s) => s.yuklendi);

  const hedefUyuyor = (hedef: BildirimHedef, mevcutRol: string | null) =>
    hedef === "tumu" ||
    (hedef === "pilot"   && mevcutRol === "pilot")   ||
    (hedef === "copilot" && mevcutRol === "copilot");

  /* ─── Bildirimi toast olarak göster ─── */
  const goster = (b: SistemBildirim) => {
    if (gorulenRef.current.has(b.id)) return;
    gorulenRef.current.add(b.id);
    const yeni: Toast = { ...b, toastId: b.id };

    setToastlar((prev) => {
      const guncel = [...prev, yeni];
      if (guncel.length > 3) {
        const silinen = guncel.shift()!;
        clearTimeout(timerRef.current.get(silinen.toastId));
        timerRef.current.delete(silinen.toastId);
      }
      return guncel;
    });
    const timer = setTimeout(() => kapat(b.id, false), 10_000);
    timerRef.current.set(b.id, timer);
  };

  /* ─── Kapatma — DB'ye dismissed_popup=true yaz ─── */
  const kapat = async (notifId: string, yazDB = true) => {
    clearTimeout(timerRef.current.get(notifId));
    timerRef.current.delete(notifId);
    setToastlar((prev) => prev.filter((t) => t.toastId !== notifId));

    if (!yazDB) return;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("notification_read_states").upsert({
      user_id:         user.id,
      notification_id: notifId,
      dismissed_popup: true,
      is_read:         true,
    }, { onConflict: "user_id,notification_id" });
  };

  /* ─── Mount: son 30 günün gösterilmemiş bildirimleri ─── */
  useEffect(() => {
    if (!yuklendi) return;

    async function yukle() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const onceki30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      // Bildirimler + kullanıcının dismiss durumu
      const { data: bildirimler } = await supabase
        .from("system_notifications")
        .select("*, notification_read_states!left(dismissed_popup)")
        .gte("olusturma", onceki30)
        .order("olusturma", { ascending: true });

      if (!bildirimler) return;

      bildirimler.forEach((b) => {
        const readState = Array.isArray(b.notification_read_states)
          ? b.notification_read_states[0]
          : b.notification_read_states;
        const dismissed = readState?.dismissed_popup === true;
        if (dismissed) return;
        if (!hedefUyuyor(b.hedef as BildirimHedef, rol)) return;
        goster(b as SistemBildirim);
      });
    }

    yukle();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yuklendi]);

  /* ─── Realtime: anlık bildirimler ─── */
  useEffect(() => {
    const supabase = createClient();
    const kanal = supabase
      .channel("sistem-bildirimler-rt")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "system_notifications" }, (payload) => {
        const b = payload.new as SistemBildirim;
        const { rol: r, yuklendi: y } = useSirket.getState();
        if (!y) return;
        if (hedefUyuyor(b.hedef, r)) goster(b);
      })
      .subscribe();

    kanalRef.current = kanal;
    return () => {
      supabase.removeChannel(kanal);
      timerRef.current.forEach(clearTimeout);
      timerRef.current.clear();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!yuklendi) return null;

  return (
    <div className="fixed bottom-6 right-4 z-[9999] flex flex-col gap-3 items-end pointer-events-none" aria-live="polite">
      <AnimatePresence mode="sync">
        {toastlar.map((t) => (
          <div key={t.toastId} className="pointer-events-auto">
            <ToastItem t={t} onKapat={(id) => kapat(id, true)} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
