"use client";

import { useMemo, useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import { useNakit } from "@/store/nakit";
import { haftalikOzet, aylikOzet } from "@/lib/nakit-data";
import { formatTL } from "@/lib/para";

type Periyot = "hafta" | "ay";

export default function NakitAkisiOzet() {
  const { islemler }        = useNakit();
  const [periyot, setPeriyot] = useState<Periyot>("hafta");

  const veri = useMemo(() => {
    const ozet = periyot === "hafta" ? haftalikOzet(islemler) : aylikOzet(islemler);
    return ozet.map((s) => ({
      etiket:     s.etiket,
      gelir:      s.gelirKurus / 100,
      gider:      s.giderKurus / 100,
    }));
  }, [islemler, periyot]);

  const toplamGelir = useMemo(() => veri.reduce((s, x) => s + x.gelir, 0), [veri]);
  const toplamGider = useMemo(() => veri.reduce((s, x) => s + x.gider, 0), [veri]);
  const net         = toplamGelir - toplamGider;

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <section className="py-4 space-y-3">
      <div className="flex justify-between items-center">
        <h2 className="text-sm font-semibold">
          {periyot === "hafta" ? "Bu hafta" : "Bu ay"} nakit akışı
        </h2>
        <div className="flex rounded-lg overflow-hidden border border-gray-200 text-xs font-medium">
          {(["hafta", "ay"] as Periyot[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriyot(p)}
              className="px-3 py-1 transition-colors"
              style={{
                background: periyot === p ? "var(--accent)" : "transparent",
                color:      periyot === p ? "#fff" : "var(--text-secondary)",
              }}
            >
              {p === "hafta" ? "Hafta" : "Ay"}
            </button>
          ))}
        </div>
      </div>

      <div className="h-44">
        {mounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={veri} barGap={2} barCategoryGap="30%">
              <CartesianGrid vertical={false} stroke="rgba(0,0,0,0.05)" />
              <XAxis
                dataKey="etiket"
                tick={{ fontSize: 10, fill: "#94A3B8" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                width={55}
                tick={{ fontSize: 10, fill: "#94A3B8" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
              />
              <Tooltip
                formatter={(value) => [typeof value === "number" ? formatTL(value * 100) : String(value), ""]}
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                  border: "1px solid #E2E8F0",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                }}
              />
              <Bar dataKey="gelir" name="Gelir" fill="var(--accent)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="gider" name="Gider" fill="#C97676"     radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full rounded-lg bg-gray-50 animate-pulse" />
        )}
      </div>

      <div className="flex gap-5 text-xs">
        <span>
          Gelir:{" "}
          <span className="font-number font-medium" style={{ color: "var(--text-primary)" }}>
            {formatTL(toplamGelir * 100)}
          </span>
        </span>
        <span>
          Gider:{" "}
          <span className="font-number font-medium" style={{ color: "#C97676" }}>
            {formatTL(toplamGider * 100)}
          </span>
        </span>
        <span>
          Net:{" "}
          <span
            className="font-number font-semibold"
            style={{ color: net >= 0 ? "var(--color-success)" : "var(--color-danger)" }}
          >
            {net >= 0 ? "+" : ""}{formatTL(net * 100)}
          </span>
        </span>
      </div>
    </section>
  );
}
