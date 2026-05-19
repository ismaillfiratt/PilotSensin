"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useNakit } from "@/store/nakit";
import { formatTL } from "@/lib/para";
import { cn } from "@/lib/utils";

function relativeTime(iso: string): string {
  const fark = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (fark < 1)    return "Az önce";
  if (fark < 60)   return `${fark}dk`;
  if (fark < 1440) return `${Math.floor(fark / 60)}sa`;
  if (fark < 10080) return `${Math.floor(fark / 1440)}g`;
  return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

export default function SonHareketler() {
  const { islemler } = useNakit();

  const son5 = useMemo(
    () => islemler.filter((x) => !x.silindi).slice(0, 5),
    [islemler]
  );

  return (
    <section className="py-4 space-y-1">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-sm font-semibold">Son hareketler</h2>
        <Link
          href="/nakit-akisi"
          className="text-xs font-medium transition-colors hover:opacity-75"
          style={{ color: "var(--leaf)" }}
        >
          Tümünü gör →
        </Link>
      </div>

      {son5.length === 0 ? (
        <p className="text-sm py-4" style={{ color: "var(--text-secondary)" }}>
          Henüz işlem yok.
        </p>
      ) : (
        son5.map((islem) => (
          <div
            key={islem.id}
            className="flex items-center gap-3 py-2"
            style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}
          >
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{ background: islem.tip === "gelir" ? "var(--color-success)" : "#C97676" }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">
                {islem.tip === "gelir" ? "Gelir" : "Gider"}
              </p>
              <p className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>
                {islem.aciklama || islem.kategori}
              </p>
            </div>
            <span className="text-xs shrink-0" style={{ color: "var(--text-muted)" }}>
              {relativeTime(islem.tarih)}
            </span>
            <span
              className={cn("font-number font-medium text-sm shrink-0")}
              style={{ color: islem.tip === "gelir" ? "var(--text-primary)" : "#C97676" }}
            >
              {islem.tip === "gelir" ? "+" : "-"}{formatTL(islem.tutarKurus)}
            </span>
          </div>
        ))
      )}
    </section>
  );
}
