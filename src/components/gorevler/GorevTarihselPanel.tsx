"use client";

import { useState, useMemo } from "react";
import { Calendar, CheckCircle2, Clock, ListTodo, AlertCircle } from "lucide-react";
import { useGorevler } from "@/store/gorevler";
import { ONCELIK_CONFIG, DURUM_CONFIG } from "@/lib/gorev-data";

/* ── Yardımcılar ── */
function bugun()       { return new Date().toISOString().split("T")[0]; }
function oncekiGun(n: number) { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().split("T")[0]; }
function formatKisa(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
}
function formatLong(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" });
}

type Mod = "bugun" | "dun" | "hafta" | "ay" | "ozel";
type Filtre = "toplam" | "yapilacak" | "devam" | "tamamlandi" | "geciken" | null;

/* ── Tıklanabilir stat kartı ── */
function StatKart({ label, deger, renk, bg, icon: Icon, secili, onClick }: {
  label: string; deger: number; renk: string; bg: string;
  icon: React.ElementType; secili: boolean; onClick: () => void;
}) {
  return (
    <button onClick={onClick}
      className="rounded-xl p-3 text-center border transition-all hover:scale-[1.03] active:scale-100"
      style={{
        backgroundColor: secili ? bg : "rgba(255,255,255,0.03)",
        borderColor: secili ? renk : "rgba(255,255,255,0.08)",
        boxShadow: secili ? `0 0 0 1px ${renk}40` : "none",
      }}>
      <Icon className="w-4 h-4 mx-auto mb-1" style={{ color: renk }} />
      <p className="text-xl font-black" style={{ color: renk }}>{deger}</p>
      <p className="text-[10px] text-[#94a3b8] mt-0.5 leading-tight">{label}</p>
    </button>
  );
}

/* ── Ana bileşen ── */
export default function GorevTarihselPanel() {
  const { gorevler } = useGorevler();

  const [mod, setMod]           = useState<Mod>("bugun");
  const [ozelBas, setOzelBas]   = useState(oncekiGun(6));
  const [ozelBit, setOzelBit]   = useState(bugun());
  const [filtre, setFiltre]     = useState<Filtre>(null);

  /* Dönem aralığı */
  const { baslangic, bitis } = useMemo<{ baslangic: string; bitis: string }>(() => {
    const bg = bugun();
    switch (mod) {
      case "bugun": return { baslangic: bg,             bitis: bg             };
      case "dun":   return { baslangic: oncekiGun(1),   bitis: oncekiGun(1)   };
      case "hafta": return { baslangic: oncekiGun(6),   bitis: bg             };
      case "ay":    return { baslangic: oncekiGun(29),  bitis: bg             };
      case "ozel":  return { baslangic: ozelBas,        bitis: ozelBit        };
    }
  }, [mod, ozelBas, ozelBit]);

  const basT   = new Date(baslangic + "T00:00:00");
  const bitisT = new Date(bitis     + "T23:59:59");
  const simdi  = new Date();

  /* Seçilen aralıkta oluşturulmuş görevler */
  const aralikGorevler = useMemo(
    () => gorevler.filter((g) => {
      const t = new Date(g.olusturmaTarih);
      return t >= basT && t <= bitisT;
    }),
    [gorevler, basT, bitisT]
  );

  /* İstatistikler — durum alanını doğrudan kullan (kanban ile her zaman senkron) */
  const stats = useMemo(() => ({
    toplam:     aralikGorevler.length,
    yapilacak:  aralikGorevler.filter((g) => g.durum === "yapilacak").length,
    devam:      aralikGorevler.filter((g) => g.durum === "devam").length,
    tamamlandi: aralikGorevler.filter((g) => g.durum === "tamamlandi").length,
    geciken:    aralikGorevler.filter((g) => g.durum !== "tamamlandi" && new Date(g.sonTarih) < simdi).length,
  }), [aralikGorevler, simdi]);

  /* Filtreye göre liste */
  const filtrelenmis = useMemo(() => {
    if (!filtre) return [];
    const sira = (arr: typeof aralikGorevler) =>
      [...arr].sort((a, b) => new Date(b.olusturmaTarih).getTime() - new Date(a.olusturmaTarih).getTime());
    switch (filtre) {
      case "toplam":     return sira(aralikGorevler);
      case "yapilacak":  return sira(aralikGorevler.filter((g) => g.durum === "yapilacak"));
      case "devam":      return sira(aralikGorevler.filter((g) => g.durum === "devam"));
      case "tamamlandi": return sira(aralikGorevler.filter((g) => g.durum === "tamamlandi"));
      case "geciken":    return sira(aralikGorevler.filter((g) => g.durum !== "tamamlandi" && new Date(g.sonTarih) < simdi));
    }
  }, [filtre, aralikGorevler, simdi]);

  const toggle = (f: Filtre) => setFiltre((p) => p === f ? null : f);

  /* Dönem etiketi */
  const donemEtiket = mod === "bugun" ? "Bugün"
    : mod === "dun"   ? "Dün"
    : mod === "hafta" ? "Son 1 Hafta"
    : mod === "ay"    ? "Son 1 Ay"
    : `${formatLong(baslangic)} — ${formatLong(bitis)}`;

  const kartlar: { key: Filtre; label: string; renk: string; bg: string; icon: React.ElementType }[] = [
    { key: "toplam",     label: "Toplam",       renk: "#94a3b8", bg: "rgba(148,163,184,0.12)", icon: ListTodo      },
    { key: "yapilacak",  label: "Yapılacak",    renk: "#94a3b8", bg: "rgba(148,163,184,0.08)", icon: ListTodo      },
    { key: "devam",      label: "Devam Ediyor", renk: "#fbc024", bg: "rgba(251,192,36,0.12)",  icon: Clock         },
    { key: "tamamlandi", label: "Tamamlandı",   renk: "#22c55e", bg: "rgba(34,197,94,0.12)",   icon: CheckCircle2  },
    { key: "geciken",    label: "Geciken",       renk: "#ef4444", bg: "rgba(239,68,68,0.12)",   icon: AlertCircle   },
  ];

  const modButonlar: { key: Mod; label: string }[] = [
    { key: "bugun", label: "Bugün"       },
    { key: "dun",   label: "Dün"         },
    { key: "hafta", label: "Son 1 Hafta" },
    { key: "ay",    label: "Son 1 Ay"    },
  ];

  return (
    <div className="glass-card rounded-2xl p-6 space-y-5">
      {/* Başlık */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[rgba(251,192,36,0.12)] border border-[rgba(251,192,36,0.2)] flex items-center justify-center">
          <Calendar className="w-5 h-5 text-[#fbc024]" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white">Tarihsel Görev Analizi</h3>
          <p className="text-xs text-[#94a3b8]">Dönem seçin, karta tıklayarak görevleri görüntüleyin</p>
        </div>
      </div>

      {/* Dönem seçici */}
      <div className="space-y-3">
        {/* Hızlı butonlar */}
        <div className="flex flex-wrap gap-2">
          {modButonlar.map(({ key, label }) => (
            <button key={key} onClick={() => setMod(key)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium border transition-all"
              style={{
                borderColor:     mod === key ? "#fbc024" : "rgba(255,255,255,0.08)",
                backgroundColor: mod === key ? "rgba(251,192,36,0.12)" : "transparent",
                color:           mod === key ? "#fbc024" : "#94a3b8",
              }}>
              {label}
            </button>
          ))}

          {/* Özel tarih butonu */}
          <button onClick={() => setMod("ozel")}
            className="px-3 py-1.5 rounded-xl text-xs font-medium border transition-all flex items-center gap-1.5"
            style={{
              borderColor:     mod === "ozel" ? "#fbc024" : "rgba(255,255,255,0.08)",
              backgroundColor: mod === "ozel" ? "rgba(251,192,36,0.12)" : "transparent",
              color:           mod === "ozel" ? "#fbc024" : "#94a3b8",
            }}>
            <Calendar className="w-3 h-3" />
            Özel Tarih
          </button>
        </div>

        {/* Özel tarih aralığı — mod="ozel" seçilince görünür */}
        {mod === "ozel" && (
          <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)]">
            <div className="flex items-center gap-2">
              <label className="text-xs text-[#94a3b8] whitespace-nowrap">Başlangıç</label>
              <input type="date" value={ozelBas} max={ozelBit}
                onChange={(e) => setOzelBas(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-white text-xs focus:outline-none focus:border-[rgba(251,192,36,0.5)] scheme-dark" />
            </div>
            <span className="text-[#64748b] text-xs">—</span>
            <div className="flex items-center gap-2">
              <label className="text-xs text-[#94a3b8] whitespace-nowrap">Bitiş</label>
              <input type="date" value={ozelBit} min={ozelBas} max={bugun()}
                onChange={(e) => setOzelBit(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-white text-xs focus:outline-none focus:border-[rgba(251,192,36,0.5)] scheme-dark" />
            </div>
          </div>
        )}
      </div>

      {/* Seçilen dönem etiketi */}
      <p className="text-xs text-[#64748b] -mt-1">
        <span className="text-[#94a3b8] font-medium">{donemEtiket}</span>
        {" "}— bu dönemde oluşturulan {stats.toplam} görev
      </p>

      {/* Stat kartları */}
      {stats.toplam === 0 ? (
        <div className="py-10 text-center text-[#64748b] text-sm">
          Bu dönemde henüz görev oluşturulmamış
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {kartlar.map(({ key, label, renk, bg, icon }) => (
              <StatKart key={key} label={label} deger={stats[key as keyof typeof stats] as number}
                renk={renk} bg={bg} icon={icon}
                secili={filtre === key} onClick={() => toggle(key)} />
            ))}
          </div>
          <p className="text-[10px] text-[#475569] text-center -mt-2">
            Karta tıklayarak görevleri görüntüleyin
          </p>

          {/* Görev listesi */}
          {filtre && (
            <div className="space-y-2">
              {filtrelenmis.length === 0 ? (
                <p className="text-center text-xs text-[#64748b] py-3">Bu kategoride görev yok</p>
              ) : (
                <>
                  <p className="text-[11px] text-[#64748b] font-semibold uppercase tracking-widest">
                    {filtrelenmis.length} görev
                  </p>
                  <div className="max-h-80 overflow-y-auto space-y-1.5 pr-1">
                    {filtrelenmis.map((g) => {
                      const cfg     = DURUM_CONFIG[g.durum];
                      const oncelik = ONCELIK_CONFIG[g.oncelik];
                      const gecikti = g.durum !== "tamamlandi" && new Date(g.sonTarih) < simdi;
                      return (
                        <div key={g.id}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)]">
                          {/* Durum renk noktası */}
                          <span className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: gecikti ? "#ef4444" : cfg.color }} />

                          {/* Başlık */}
                          <p className={`flex-1 text-sm truncate ${g.durum === "tamamlandi" ? "line-through text-[#64748b]" : "text-white"}`}>
                            {g.baslik}
                          </p>

                          {/* Eklenme tarihi */}
                          <span className="text-[10px] text-[#475569] shrink-0 hidden sm:block">
                            {formatKisa(g.olusturmaTarih)}
                          </span>

                          {/* Öncelik */}
                          <span className="text-[10px] font-semibold shrink-0" style={{ color: oncelik.color }}>
                            {oncelik.label}
                          </span>

                          {/* Sorumlu */}
                          <span className="text-[10px] text-[#64748b] shrink-0 hidden sm:block">{g.sorumlu}</span>

                          {/* Durum rozeti */}
                          <span className="text-[10px] shrink-0 font-medium px-1.5 py-0.5 rounded-md whitespace-nowrap"
                            style={{
                              color:           gecikti ? "#ef4444" : cfg.color,
                              backgroundColor: gecikti ? "rgba(239,68,68,0.1)" : `${cfg.color}18`,
                            }}>
                            {gecikti ? "Gecikti" : cfg.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
