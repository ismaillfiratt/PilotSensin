"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useBildirimler } from "@/store/bildirimler";
import { useSirket }      from "@/store/sirket";
import { cn }             from "@/lib/utils";

const ONEMLI_MODULLER = ["nakit-akisi", "kar-zarar", "stok", "acil-fon"] as const;

export default function UyariRozeti() {
  const [acik, setAcik] = useState(false);
  const ref             = useRef<HTMLDivElement>(null);

  const bildirimler = useBildirimler((s) => s.bildirimler);
  const rol         = useSirket((s) => s.rol);

  const uyarilar = useMemo(() => {
    const filtered = bildirimler
      .filter((b) => {
        if (b.silindi) return false;
        if (b.okundu)  return false;
        if (b.modul === "sistem") return false;
        if (b.tip !== "kritik" && !(b.tip === "uyari" && (ONEMLI_MODULLER as readonly string[]).includes(b.modul))) return false;
        const hedef = b.hedef ?? "herkes";
        if (hedef === "pilot"   && rol !== "pilot")   return false;
        if (hedef === "copilot" && rol !== "copilot") return false;
        return true;
      })
      // Motor (tarama) bildirimleri önce, sonra olay bildirimleri; içinde yeniden eskiye
      .sort((a, b) => {
        const kaynakSira = (k?: string) => k === "tarama" ? 0 : 1;
        if (kaynakSira(a.kaynak) !== kaynakSira(b.kaynak))
          return kaynakSira(a.kaynak) - kaynakSira(b.kaynak);
        return new Date(b.tarih).getTime() - new Date(a.tarih).getTime();
      });

    // Aynı (tip + modul) kombinasyonundan yalnızca en öncelikliyi göster
    const seen = new Set<string>();
    return filtered.filter((u) => {
      const key = `${u.tip}-${u.modul}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [bildirimler, rol]);

  const sayi         = uyarilar.length;
  const kritikVarMi  = uyarilar.some((u) => u.tip === "kritik");

  // Click-outside kapat
  const handleOutside = useCallback((e: MouseEvent) => {
    if (ref.current && !ref.current.contains(e.target as Node)) setAcik(false);
  }, []);

  useEffect(() => {
    if (!acik) return;
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [acik, handleOutside]);

  // ESC kapat
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setAcik(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (sayi === 0) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setAcik((p) => !p)}
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium",
          "bg-[#FEF3F2] border border-[rgba(201,118,118,0.25)]",
          "text-[#8E3939] hover:bg-[#FCE7E7] transition-colors",
          kritikVarMi && "uyari-pulse"
        )}
        aria-expanded={acik}
        aria-label={`${sayi} uyarı`}
      >
        {/* Canlı nokta */}
        <span className="relative flex h-2 w-2 shrink-0">
          {kritikVarMi && (
            <span className="absolute inline-flex h-full w-full rounded-full bg-[#C97676] opacity-50 animate-ping" />
          )}
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C97676]" />
        </span>
        {/* Desktop: "N uyarı", mobile: sadece N */}
        <span className="hidden sm:inline">{sayi} uyarı</span>
        <span className="sm:hidden font-mono">{sayi}</span>
        {/* Chevron */}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          className={cn("transition-transform", acik && "rotate-180")}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Dropdown */}
      {acik && (
        <div className={cn(
          "absolute top-full right-0 mt-2 bg-white",
          "rounded-xl border border-black/10 shadow-lg z-50 overflow-hidden",
          "w-80 max-w-[calc(100vw-2rem)]"
        )}>
          {/* Üçgen */}
          <div className="absolute -top-1.5 right-6 w-3 h-3 bg-white border-l border-t border-black/10 rotate-45" />

          {/* Başlık */}
          <div className="px-4 py-3 border-b border-black/5">
            <p className="text-[11px] font-semibold tracking-wider text-[#6B7280]">İLGİ GEREKLİ</p>
            <p className="text-[10px] text-[#9CA3AF] mt-0.5">Aksiyon gerektiren {sayi} uyarı</p>
          </div>

          {/* Liste */}
          <div className="max-h-80 overflow-y-auto">
            {uyarilar.slice(0, 6).map((u) => (
              <Link
                key={u.id}
                href={u.ilgiliLink ?? "/bildirimler"}
                onClick={() => setAcik(false)}
                className="flex items-start gap-3 px-4 py-3 hover:bg-[#F9FAFB] transition-colors border-b border-black/4 last:border-0"
              >
                <span className={cn(
                  "shrink-0 w-2 h-2 rounded-full mt-1.5",
                  u.tip === "kritik" ? "bg-[#C97676]" : "bg-[#F59E0B]"
                )} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[#111827] truncate">{u.baslik}</p>
                  <p className="text-[11px] text-[#6B7280] mt-0.5 line-clamp-2">{u.mesaj}</p>
                </div>
              </Link>
            ))}
          </div>

          {uyarilar.length > 6 && (
            <Link
              href="/bildirimler"
              onClick={() => setAcik(false)}
              className="block px-4 py-2.5 text-[11px] font-medium text-[#0F3D2E] text-center border-t border-black/5 hover:bg-[#F9FAFB] transition-colors"
            >
              Tüm uyarıları gör ({uyarilar.length}) →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
