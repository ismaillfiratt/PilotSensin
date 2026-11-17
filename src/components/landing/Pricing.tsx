"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { PRICING } from "@/lib/pricing";

type Donem = "aylik" | "yillik";

export default function Pricing() {
  const [donem, setDonem] = useState<Donem>("yillik");

  const aylikFiyat = donem === "aylik" ? 299 : 249;

  return (
    <section id="fiyat" style={{ background: "#FAFAFA" }} className="py-20 px-6">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <p style={{ color: "#1F5C44", letterSpacing: "0.1em", textTransform: "uppercase", fontSize: 11, fontWeight: 500, marginBottom: 10 }}>
            Fiyatlandırma
          </p>
          <h2 style={{ fontSize: 36, fontWeight: 600, color: "#1a1a1a", letterSpacing: "-0.025em", lineHeight: 1.15, margin: 0 }}>
            Şeffaf fiyat, gizli ücret yok.
          </h2>
          <p style={{ fontSize: 14, color: "#525252", marginTop: 12, maxWidth: 560, marginLeft: "auto", marginRight: "auto" }}>
            7 gün ücretsiz dene, kredi kartı gerekmez.
          </p>
        </div>

        {/* Toggle */}
        <div className="flex justify-center" style={{ marginBottom: "2rem" }}>
          <div
            className="inline-flex gap-1"
            style={{ padding: 4, background: "#ffffff", borderRadius: 999, border: "0.5px solid rgba(0,0,0,0.08)" }}
          >
            {(["aylik", "yillik"] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDonem(d)}
                style={{
                  padding: "6px 16px", fontSize: 12, fontWeight: 500, borderRadius: 999,
                  border: "none", cursor: "pointer",
                  background: donem === d ? "#1F5C44" : "transparent",
                  color: donem === d ? "#ffffff" : "#737373",
                  WebkitTextFillColor: donem === d ? "#ffffff" : "#737373",
                  transition: "all 0.15s",
                }}
              >
                {d === "aylik" ? "Aylık" : "Yıllık · 2 ay bedava"}
              </button>
            ))}
          </div>
        </div>

        {/* Tek kart */}
        <div
          className="mx-auto relative rounded-2xl"
          style={{ maxWidth: 480, padding: 32, background: "#ffffff", border: "2px solid #1F5C44" }}
        >
          <p style={{ fontSize: 12, fontWeight: 600, color: "#1F5C44", letterSpacing: "0.04em", marginBottom: 4 }}>
            {PRICING.packageName.toUpperCase()}
          </p>
          <p style={{ fontSize: 12, color: "#525252", marginBottom: 16 }}>İşletmen için tam paket</p>

          {/* Fiyat */}
          <div style={{ marginBottom: 16 }}>
            <div className="flex items-baseline gap-1">
              <span style={{ fontSize: 42, fontWeight: 600, color: "#0a0a0a", lineHeight: 1 }}>₺{aylikFiyat}</span>
              <span style={{ fontSize: 14, color: "#737373" }}>/ay</span>
            </div>
            {donem === "yillik" && (
              <p style={{ fontSize: 11, color: "#1F5C44", marginTop: 4 }}>
                ₺2.990 yıllık ödenir · 2 ay bedava
              </p>
            )}
          </div>

          {/* CTA */}
          <Link
            href="/kayit"
            style={{
              display: "block", textAlign: "center", width: "100%",
              padding: "14px 0", background: "#1F5C44",
              color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF",
              fontWeight: 600, borderRadius: 10, fontSize: 14,
              textDecoration: "none", marginBottom: 20,
            }}
          >
            7 gün ücretsiz dene
          </Link>

          {/* Özellikler */}
          <ul className="flex flex-col" style={{ gap: 10, listStyle: "none", padding: 0, margin: 0 }}>
            {PRICING.features.map((f) => (
              <li key={f} className="flex items-start gap-2">
                <Check style={{ width: 14, height: 14, color: "#1F5C44", flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 13, color: "#1a1a1a" }}>{f}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
