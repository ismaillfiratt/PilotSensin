"use client";

import { useMemo }    from "react";
import Link           from "next/link";
import { CheckCircle, ClipboardList, Banknote, Sparkles, AlertCircle } from "lucide-react";
import { cn }         from "@/lib/utils";
import { useGorevler }    from "@/store/gorevler";
import { useProsedurler } from "@/store/prosedurler";
import { useAcilFon }     from "@/store/acilFon";
import {
  bugunYapilacaklariTopla,
  type YapilacakOge,
} from "@/lib/bugun-yapilacaklar";

const IKON_MAP = {
  "gorev":       CheckCircle,
  "checklist":   ClipboardList,
  "odeme":       Banknote,
  "oto-kontrol": Sparkles,
  "vade":        AlertCircle,
} as const;

function SatirRender({ oge }: { oge: YapilacakOge }) {
  const Icon = IKON_MAP[oge.ikon];

  return (
    <div className={cn(
      "flex items-center gap-3 py-2 group rounded-lg px-2 -mx-2 transition-colors",
      "hover:bg-gray-50"
    )}>
      {/* Checkbox veya ikon */}
      {oge.manuelToggle ? (
        <input
          type="checkbox"
          checked={oge.tamamlandi}
          onChange={oge.onToggle}
          className="w-4 h-4 rounded shrink-0 cursor-pointer"
          style={{ accentColor: "var(--accent)" }}
        />
      ) : (
        <div
          className="w-4 h-4 shrink-0 flex items-center justify-center"
          style={{ color: oge.tamamlandi ? "var(--color-success)" : "var(--text-tertiary)" }}
        >
          {oge.tamamlandi
            ? <CheckCircle className="w-4 h-4" />
            : <Icon className="w-4 h-4" />
          }
        </div>
      )}

      {/* İçerik */}
      <div className="flex-1 min-w-0">
        <p
          className={cn("text-sm font-medium truncate", oge.tamamlandi && "line-through opacity-50")}
          style={{ color: "var(--text-primary)" }}
        >
          {oge.baslik}
        </p>
        {oge.altYazi && (
          <p className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>
            {oge.altYazi}
          </p>
        )}
      </div>

      {/* Öncelik pill + link */}
      <div className="flex items-center gap-2 shrink-0">
        {!oge.tamamlandi && oge.oncelikLabel && (
          <span
            className="text-[10px] font-medium px-2 py-0.5 rounded-full"
            style={{
              color:      oge.oncelikRenk ?? "var(--text-secondary)",
              background: oge.oncelikRenk ? `${oge.oncelikRenk}22` : "rgba(0,0,0,0.04)",
            }}
          >
            {oge.oncelikLabel}
          </span>
        )}
        {oge.ilgiliLink && !oge.manuelToggle && !oge.tamamlandi && (
          <Link
            href={oge.ilgiliLink}
            className="text-xs font-medium whitespace-nowrap hover:opacity-75 transition-opacity"
            style={{ color: "var(--text-secondary)" }}
          >
            Şimdi →
          </Link>
        )}
      </div>
    </div>
  );
}

export default function BugunYapilacaklarSection() {
  const { gorevler }                            = useGorevler();
  const { checklist }                           = useProsedurler();
  const { hedefler, islemler: acilFonIslemler } = useAcilFon();

  const yapilacaklar = useMemo<YapilacakOge[]>(
    () => bugunYapilacaklariTopla({ gorevler, checklist, hedefler, acilFonIslemler }),
    [gorevler, checklist, hedefler, acilFonIslemler]
  );

  const bekleyenler   = yapilacaklar.filter((o) => !o.tamamlandi);
  const tamamlananlar = yapilacaklar.filter((o) =>  o.tamamlandi);

  return (
    <section className="py-4 space-y-3">
      <div className="flex justify-between items-center">
        <h2 className="text-sm font-semibold">Bugün yapılacaklar</h2>
        <div className="flex items-center gap-3">
          {yapilacaklar.length > 0 && (
            <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
              {tamamlananlar.length} / {yapilacaklar.length} tamamlandı
            </span>
          )}
          <Link
            href="/gorevler"
            className="text-xs font-medium hover:opacity-75 transition-opacity"
            style={{ color: "var(--text-secondary)" }}
          >
            Tümünü gör →
          </Link>
        </div>
      </div>

      {yapilacaklar.length === 0 ? (
        <p className="text-sm py-4" style={{ color: "var(--text-secondary)" }}>
          Bugün için planlı bir şey yok. ✨
        </p>
      ) : (
        <div className="space-y-1">
          {bekleyenler.map((o) => (
            <SatirRender key={o.id} oge={o} />
          ))}

          {tamamlananlar.length > 0 && (
            <>
              <div className="pt-2 pb-1">
                <p
                  className="text-[10px] uppercase tracking-wider"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  ✓ Bugün tamamlanan ({tamamlananlar.length})
                </p>
              </div>
              {tamamlananlar.map((o) => (
                <SatirRender key={o.id} oge={o} />
              ))}
            </>
          )}
        </div>
      )}
    </section>
  );
}
