"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { useBildirimler } from "@/store/bildirimler";
import { snoozeAl, snoozeMi } from "@/lib/uyari-motoru/snooze";

export default function IlgiGerekliSection() {
  const bildirimler      = useBildirimler((s) => s.bildirimler);
  const [, forceRender]  = useState(0);

  const ilgiGerekli = useMemo(() => {
    return bildirimler
      .filter((b) =>
        !b.silindi &&
        !b.okundu &&
        b.kaynak === "tarama" &&
        (b.tip === "kritik" || b.tip === "uyari") &&
        !snoozeMi(b.olayId ?? b.id)
      )
      .sort((a, b) => {
        if (a.tip !== b.tip) return a.tip === "kritik" ? -1 : 1;
        return new Date(b.tarih).getTime() - new Date(a.tarih).getTime();
      })
      .slice(0, 5);
  // forceRender dahil edilmiyor — snoozeMi localStorage'dan okur, dependency değil
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bildirimler, forceRender]);

  const handleSnooze = (b: (typeof bildirimler)[number]) => {
    snoozeAl(b.olayId ?? b.id, 4);
    forceRender((n) => n + 1);
  };

  const toplamOkunmamis = bildirimler.filter((b) => !b.silindi && !b.okundu).length;

  return (
    <section className="py-4 space-y-3">
      <div className="flex justify-between items-center">
        <h2 className="text-sm font-semibold">İlgi gerekli</h2>
        {toplamOkunmamis > 5 && (
          <Link
            href="/bildirimler"
            className="text-xs font-medium hover:opacity-75 transition-opacity"
            style={{ color: "var(--text-secondary)" }}
          >
            Tümünü gör →
          </Link>
        )}
      </div>

      {ilgiGerekli.length === 0 ? (
        <p className="text-sm py-4" style={{ color: "var(--text-secondary)" }}>
          ✓ Sistemler temiz. Hiçbir uyarı yok.
        </p>
      ) : (
        <div className="space-y-1">
          {ilgiGerekli.map((b) => (
            <div
              key={b.id}
              className="group flex items-center gap-3 py-2 rounded-lg hover:bg-gray-50 transition-colors px-2 -mx-2"
            >
              {/* Seviye noktası */}
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{
                  background: b.tip === "kritik"
                    ? "var(--color-danger)"
                    : "var(--color-warning)",
                }}
              />

              {/* İçerik */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  {b.baslik}
                </p>
                <p className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>
                  {b.mesaj}
                </p>
              </div>

              {/* Aksiyonlar */}
              <div className="flex items-center gap-1 shrink-0">
                {b.ilgiliLink && (
                  <Link
                    href={b.ilgiliLink}
                    className="text-xs font-medium whitespace-nowrap px-2 py-1 rounded transition-opacity hover:opacity-75"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Şimdi düzelt →
                  </Link>
                )}

                <button
                  onClick={() => handleSnooze(b)}
                  title="4 saat ertele"
                  className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-all"
                >
                  <X className="w-3.5 h-3.5 text-gray-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
