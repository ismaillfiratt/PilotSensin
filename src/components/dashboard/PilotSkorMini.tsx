"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useNakit }            from "@/store/nakit";
import { useGorevler }         from "@/store/gorevler";
import { useStok }             from "@/store/stok";
import { useProsedurler }      from "@/store/prosedurler";
import { useAcilFon }          from "@/store/acilFon";
import { useSatislar }         from "@/store/satislar";
import { useIsletmeGiderleri } from "@/store/isletmeGiderleri";
import {
  nakitSkoru, gorevSkoru, stokSkoru,
  prosedurSkoru, acilFonSkoru, karZararSkoru, pilotSkoru,
} from "@/lib/pilot-score";

const MODUL_HREF: Record<string, string> = {
  "Nakit Akışı":  "/nakit-akisi",
  "Kâr-Zarar":   "/kar-zarar",
  "Stok":        "/stok",
  "Görevler":    "/gorevler",
  "Prosedürler": "/prosedurler",
  "Acil Fon":    "/acil-fon",
};

function skorRengi(s: number) {
  if (s >= 80) return "#10B981";
  if (s >= 60) return "#F59E0B";
  return "#EF4444";
}

export default function PilotSkorMini() {
  const { islemler }                                     = useNakit();
  const { gorevler }                                     = useGorevler();
  const { urunler }                                      = useStok();
  const { prosedurler, checklist }                       = useProsedurler();
  const { islemler: fonIslemler, hedefler: fonHedefler } = useAcilFon();
  const { kayitlar: satislar }                           = useSatislar();
  const { giderler }                                     = useIsletmeGiderleri();

  const { genel, enZayif3 } = useMemo(() => {
    const mNakit = nakitSkoru(islemler);
    const mGorev = gorevSkoru(gorevler);
    const mStok  = stokSkoru(urunler);
    const mPros  = prosedurSkoru(prosedurler, checklist);
    const mAcil  = acilFonSkoru(fonIslemler, fonHedefler);
    const mKZ    = karZararSkoru(satislar, giderler);

    const moduller = [
      { title: "Nakit Akışı",  skor: mNakit.skor },
      { title: "Kâr-Zarar",   skor: mKZ.skor    },
      { title: "Stok",        skor: mStok.skor   },
      { title: "Görevler",    skor: mGorev.skor  },
      { title: "Prosedürler", skor: mPros.skor   },
      { title: "Acil Fon",    skor: mAcil.skor   },
    ];

    const genel   = pilotSkoru([mNakit, mKZ, mGorev, mStok, mPros, mAcil]);
    const enZayif3 = [...moduller].sort((a, b) => a.skor - b.skor).slice(0, 3);

    return { genel, enZayif3 };
  }, [islemler, gorevler, urunler, prosedurler, checklist, fonIslemler, fonHedefler, satislar, giderler]);

  const radius       = 44;
  const circumference = 2 * Math.PI * radius;
  const dashOffset   = circumference - (genel / 100) * circumference;
  const renk         = skorRengi(genel);
  const etiket       = genel >= 80 ? "Mükemmel" : genel >= 60 ? "Dikkat" : "Kritik";

  return (
    <div className="flex flex-col items-center gap-4 py-6">
      <p className="label-caps self-start lg:self-center">PİLOT SKORU</p>

      {/* Gauge */}
      <div className="relative w-28 h-28">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="#F3F4F6" strokeWidth="7" />
          <motion.circle
            cx="50" cy="50" r={radius} fill="none"
            stroke={renk} strokeWidth="7" strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="font-number font-bold text-2xl leading-none"
            style={{ color: renk }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            %{genel}
          </motion.span>
        </div>
      </div>

      {/* Durum rozeti */}
      <span
        className="text-xs font-semibold px-3 py-1 rounded-full border"
        style={{ color: renk, borderColor: `${renk}40`, background: `${renk}12` }}
      >
        {etiket}
      </span>

      {/* En zayıf 3 */}
      <div className="w-full space-y-2 border-t border-black/5 pt-3">
        <p className="label-caps">EN ZAYIF</p>
        {enZayif3.map(({ title, skor }) => (
          <Link
            key={title}
            href={MODUL_HREF[title] ?? "/dashboard"}
            className="flex items-center gap-2 group"
          >
            <span className="text-xs w-24 truncate group-hover:underline" style={{ color: "var(--text-secondary)" }}>
              {title}
            </span>
            <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${skor}%` }}
                transition={{ duration: 0.9, ease: "easeOut" }}
                style={{ background: skorRengi(skor) }}
              />
            </div>
            <span className="font-number text-xs w-8 text-right" style={{ color: "var(--text-muted)" }}>
              %{skor}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
