"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  TrendingUp, BarChart3, Package,
  CheckSquare, ClipboardList, Shield, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNakit }            from "@/store/nakit";
import { useGorevler }         from "@/store/gorevler";
import { useStok }             from "@/store/stok";
import { useProsedurler }      from "@/store/prosedurler";
import { useAcilFon }          from "@/store/acilFon";
import { useSatislar }         from "@/store/satislar";
import { useIsletmeGiderleri } from "@/store/isletmeGiderleri";
import {
  nakitSkoru, gorevSkoru, stokSkoru,
  prosedurSkoru, acilFonSkoru, karZararSkoru,
} from "@/lib/pilot-score";

function skorRengiClass(s: number) {
  if (s >= 80) return { text: "text-emerald-600", bg: "bg-emerald-50" };
  if (s >= 60) return { text: "text-amber-500",   bg: "bg-amber-50"   };
  return          { text: "text-red-500",          bg: "bg-red-50"     };
}

export default function ModuleHizliErisim() {
  const { islemler }                                     = useNakit();
  const { gorevler }                                     = useGorevler();
  const { urunler }                                      = useStok();
  const { prosedurler, checklist }                       = useProsedurler();
  const { islemler: fonIslemler, hedefler: fonHedefler } = useAcilFon();
  const { kayitlar: satislar }                           = useSatislar();
  const { giderler }                                     = useIsletmeGiderleri();

  const moduller = useMemo(() => {
    const mNakit = nakitSkoru(islemler);
    const mKZ    = karZararSkoru(satislar, giderler);
    const mStok  = stokSkoru(urunler);
    const mGorev = gorevSkoru(gorevler);
    const mPros  = prosedurSkoru(prosedurler, checklist);
    const mAcil  = acilFonSkoru(fonIslemler, fonHedefler);

    return [
      { key: "nakit-akisi", title: "Nakit Akışı",  href: "/nakit-akisi", Icon: TrendingUp,    m: mNakit },
      { key: "kar-zarar",   title: "Kâr-Zarar",   href: "/kar-zarar",   Icon: BarChart3,     m: mKZ    },
      { key: "stok",        title: "Stok",         href: "/stok",        Icon: Package,       m: mStok  },
      { key: "gorevler",    title: "Görevler",     href: "/gorevler",    Icon: CheckSquare,   m: mGorev },
      { key: "prosedurler", title: "Prosedürler",  href: "/prosedurler", Icon: ClipboardList, m: mPros  },
      { key: "acil-fon",    title: "Acil Fon",     href: "/acil-fon",    Icon: Shield,        m: mAcil  },
    ];
  }, [islemler, satislar, giderler, urunler, gorevler, prosedurler, checklist, fonIslemler, fonHedefler]);

  return (
    <section className="py-4 space-y-3">
      <h2 className="text-sm font-semibold">Modüller</h2>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {moduller.map(({ key, title, href, Icon, m }) => {
          const { text, bg } = skorRengiClass(m.skor);
          return (
            <Link
              key={key}
              href={href}
              className="group p-4 rounded-xl border hover:shadow-sm transition-all"
              style={{ borderColor: "rgba(0,0,0,0.08)", background: "#fff" }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(15,61,46,0.08)" }}>
                  <Icon className="w-4 h-4" style={{ color: "var(--forest)" }} />
                </div>
                <span className={cn("font-number text-[11px] font-semibold px-2 py-0.5 rounded-full", text, bg)}>
                  %{m.skor}
                </span>
              </div>

              <p className="text-sm font-medium group-hover:text-forest transition-colors"
                style={{ color: "var(--text-primary)" }}>
                {title}
              </p>
              <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-secondary)" }}>
                {m.metrik} {m.metrikLabel}
              </p>

              {m.uyariSayisi > 0 && (
                <p className="text-[11px] mt-2 flex items-center gap-1 font-medium" style={{ color: "#C97676" }}>
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  {m.uyariSayisi} uyarı
                </p>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
