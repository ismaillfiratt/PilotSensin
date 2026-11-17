"use client";

import { useState, useEffect } from "react";
import { Check, ArrowRight, Package } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

interface AppVersion {
  id:             string;
  version_string: string;
  release_date:   string;
  baslik:         string;
  ozet:           string | null;
  maddeler:       string[];
  yayinlandi:     boolean;
  yayin_tarihi:   string | null;
  created_at:     string;
}

const YAKINDAT = [
  "Mobil uygulama (iOS / Android)",
  "Bankalar API entegrasyonu (Açık Bankacılık)",
  "E-Fatura otomasyon",
  "Pazaryeri entegrasyonları (Trendyol, Hepsiburada)",
  "Webhook ve API erişimi",
  "Detaylı raporlar ve veri analitiği",
];

const KART      = "bg-white rounded-xl p-5";
const KART_STIL = { border: "0.5px solid rgba(0,0,0,0.08)" };

export default function SurumPanel() {
  const [surumler,   setSurumler]   = useState<AppVersion[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    createClient()
      .from("app_versions")
      .select("*")
      .eq("yayinlandi", true)
      .order("release_date", { ascending: false })
      .then(({ data }) => {
        if (data && data.length > 0) setSurumler(data as AppVersion[]);
        setYukleniyor(false);
      });
  }, []);

  const enSon = surumler[0];

  return (
    <div className="space-y-4">

      {/* Panel başlık */}
      <div>
        <p className="label-caps">YARDIM</p>
        <h2 className="text-xl font-medium text-gray-900 mt-1">Sürüm Notları</h2>
        <p className="text-sm text-gray-500 mt-1">
          PilotSensin güncelleme geçmişi ve gelen yenilikler
        </p>
      </div>

      {/* ── KART 1 — Mevcut sürüm ── */}
      <div className={KART + " flex items-center justify-between gap-4"} style={KART_STIL}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(15,61,46,0.07)" }}>
            <Package className="w-5 h-5" style={{ color: "var(--forest)" }} />
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">Şu anki sürüm</p>
            <p className="font-medium mt-0.5" style={{ fontSize: 22, color: "var(--forest)" }}>
              {yukleniyor ? "—" : (enSon?.version_string ?? "v0.9.2")} Beta
            </p>
          </div>
        </div>
        <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full shrink-0"
          style={{ background: "rgba(180,83,9,0.1)", color: "#B45309" }}>
          BETA
        </span>
      </div>

      {/* ── KART 2 — Sürüm geçmişi ── */}
      <div className={KART + " space-y-5"} style={KART_STIL}>
        <p className="text-sm font-medium text-gray-800">Son güncellemeler</p>
        {yukleniyor ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-4 rounded bg-gray-100 animate-pulse" style={{ width: `${70 - i * 10}%` }} />
            ))}
          </div>
        ) : surumler.length === 0 ? (
          <p className="text-xs text-gray-400">Henüz sürüm notu yok.</p>
        ) : surumler.map(({ id, version_string, release_date, baslik, maddeler }, i) => (
          <div key={id}
            className="pl-4 space-y-2"
            style={{
              borderLeft: "2px solid var(--forest)",
              opacity:    i === 0 ? 1 : i === 1 ? 0.75 : 0.55,
            }}>
            <div>
              <span className="text-sm font-medium text-gray-800">{version_string}</span>
              <span className="text-xs text-gray-400 ml-2">
                {baslik} · {new Date(release_date).toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" })}
              </span>
            </div>
            <ul className="space-y-1.5">
              {(maddeler ?? []).map((m, j) => (
                <li key={j} className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: "var(--forest)" }} />
                  <span className="text-xs text-gray-600">{m}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* ── KART 3 — Yakında ── */}
      <div className={KART + " space-y-3"}
        style={{ ...KART_STIL, background: "rgba(15,61,46,0.03)" }}>
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-gray-800">Yakında</p>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full"
            style={{ background: "rgba(180,83,9,0.1)", color: "#B45309" }}>
            ROADMAP
          </span>
        </div>
        <ul className="space-y-2">
          {YAKINDAT.map((m) => (
            <li key={m} className="flex items-center gap-2">
              <ArrowRight className="w-3.5 h-3.5 shrink-0 text-gray-300" />
              <span className="text-xs text-gray-600">{m}</span>
            </li>
          ))}
        </ul>
      </div>

    </div>
  );
}
