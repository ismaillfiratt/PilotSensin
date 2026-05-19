"use client";

import { useMemo } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useGorevler } from "@/store/gorevler";
import { trGunBaslangici, trGunSonu } from "@/lib/tarih";
import { ONCELIK_CONFIG } from "@/lib/gorev-data";

export default function BugunYapilacaklarSection() {
  const { gorevler, durumDegis } = useGorevler();

  const bugunGorevleri = useMemo(() => {
    const gunBasi = trGunBaslangici();
    const gunSonu = trGunSonu();
    return gorevler.filter((g) => {
      if (g.silindi) return false;
      const t = new Date(g.sonTarih);
      return t >= gunBasi && t <= gunSonu;
    });
  }, [gorevler]);

  const toggleTamamla = (id: string, mevcutDurum: string) => {
    durumDegis(id, mevcutDurum === "tamamlandi" ? "yapilacak" : "tamamlandi");
  };

  return (
    <section className="py-4 space-y-3">
      <div className="flex justify-between items-center">
        <h2 className="text-sm font-semibold">Bugün yapılacaklar</h2>
        <Link href="/gorevler" className="text-xs font-medium transition-colors hover:opacity-75"
          style={{ color: "var(--leaf)" }}>
          Tüm görevler →
        </Link>
      </div>

      {bugunGorevleri.length === 0 ? (
        <p className="text-sm py-3" style={{ color: "var(--text-secondary)" }}>
          Bugün için planlı görev yok.
        </p>
      ) : (
        <ul className="space-y-0">
          {bugunGorevleri.map((g) => {
            const tamamlandi = g.durum === "tamamlandi";
            const oncelik    = ONCELIK_CONFIG[g.oncelik];
            return (
              <li
                key={g.id}
                className="flex items-center gap-3 py-2.5 border-b border-black/5 last:border-0"
              >
                <input
                  type="checkbox"
                  checked={tamamlandi}
                  onChange={() => toggleTamamla(g.id, g.durum)}
                  className="w-4 h-4 rounded shrink-0 cursor-pointer"
                  style={{ accentColor: "var(--forest)" }}
                />
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm font-medium truncate",
                    tamamlandi && "line-through opacity-40"
                  )} style={{ color: "var(--text-primary)" }}>
                    {g.baslik}
                  </p>
                  {g.aciklama && !tamamlandi && (
                    <p className="text-xs truncate mt-0.5" style={{ color: "var(--text-secondary)" }}>
                      {g.aciklama}
                    </p>
                  )}
                </div>
                {!tamamlandi && (
                  <span
                    className="text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0"
                    style={{ color: oncelik.color, background: oncelik.bg }}
                  >
                    {oncelik.label}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
