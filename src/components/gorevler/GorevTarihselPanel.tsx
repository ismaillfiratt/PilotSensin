"use client";

import { useState, useMemo } from "react";
import { Calendar, CheckCircle2, Clock, ListTodo, AlertCircle, Search, X } from "lucide-react";
import { useGorevler } from "@/store/gorevler";
import { ONCELIK_CONFIG, DURUM_CONFIG, type Oncelik } from "@/lib/gorev-data";
import { trBugun, trOncekiGun, trGunBaslangici, trGunSonu, trGoster } from "@/lib/tarih";

type Mod    = "bugun" | "dun" | "hafta" | "ay" | "ozel";
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
        borderColor:     secili ? renk : "rgba(255,255,255,0.08)",
        boxShadow:       secili ? `0 0 0 1px ${renk}40` : "none",
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

  /* Dönem durumu */
  const [mod, setMod]         = useState<Mod>("bugun");
  const [ozelBas, setOzelBas] = useState(trOncekiGun(6));
  const [ozelBit, setOzelBit] = useState(trBugun());

  /* Stat filtresi */
  const [filtre, setFiltre] = useState<Filtre>(null);

  /* Görev filtreleri */
  const [arama, setArama]           = useState("");
  const [sorumluF, setSorumluF]     = useState(""); // "" = tümü
  const [oncelikF, setOncelikF]     = useState<"" | Oncelik>(""); // "" = tümü

  /* Dönem aralığı — TR timezone */
  const { baslangic, bitis } = useMemo<{ baslangic: string; bitis: string }>(() => {
    const bg = trBugun();
    switch (mod) {
      case "bugun": return { baslangic: bg,              bitis: bg            };
      case "dun":   return { baslangic: trOncekiGun(1),  bitis: trOncekiGun(1)};
      case "hafta": return { baslangic: trOncekiGun(6),  bitis: bg            };
      case "ay":    return { baslangic: trOncekiGun(29), bitis: bg            };
      case "ozel":  return { baslangic: ozelBas,         bitis: ozelBit       };
    }
  }, [mod, ozelBas, ozelBit]);

  const basT   = trGunBaslangici(baslangic);
  const bitisT = trGunSonu(bitis);
  const simdi  = new Date();

  /* Dönemdeki görevler */
  const aralikGorevler = useMemo(
    () => gorevler.filter((g) => { const t = new Date(g.olusturmaTarih); return t >= basT && t <= bitisT; }),
    [gorevler, basT, bitisT]
  );

  /* İstatistikler */
  const stats = useMemo(() => ({
    toplam:     aralikGorevler.length,
    yapilacak:  aralikGorevler.filter((g) => g.durum === "yapilacak").length,
    devam:      aralikGorevler.filter((g) => g.durum === "devam").length,
    tamamlandi: aralikGorevler.filter((g) => g.durum === "tamamlandi").length,
    geciken:    aralikGorevler.filter((g) => g.durum !== "tamamlandi" && new Date(g.sonTarih) < simdi).length,
  }), [aralikGorevler, simdi]);

  /* Stat filtresine göre temel liste */
  const statListesi = useMemo(() => {
    if (!filtre) return [];
    const s = (arr: typeof aralikGorevler) =>
      [...arr].sort((a, b) => new Date(b.olusturmaTarih).getTime() - new Date(a.olusturmaTarih).getTime());
    switch (filtre) {
      case "toplam":     return s(aralikGorevler);
      case "yapilacak":  return s(aralikGorevler.filter((g) => g.durum === "yapilacak"));
      case "devam":      return s(aralikGorevler.filter((g) => g.durum === "devam"));
      case "tamamlandi": return s(aralikGorevler.filter((g) => g.durum === "tamamlandi"));
      case "geciken":    return s(aralikGorevler.filter((g) => g.durum !== "tamamlandi" && new Date(g.sonTarih) < simdi));
    }
  }, [filtre, aralikGorevler, simdi]);

  /* Görev filtrelerine + aramaya göre son liste */
  const gosterilecek = useMemo(() => {
    let liste = statListesi ?? [];
    if (sorumluF) liste = liste.filter((g) => g.sorumlu === sorumluF);
    if (oncelikF) liste = liste.filter((g) => g.oncelik === oncelikF);
    if (arama.trim()) {
      const q = arama.trim().toLowerCase();
      liste = liste.filter((g) =>
        g.baslik.toLowerCase().includes(q) ||
        g.aciklama?.toLowerCase().includes(q) ||
        g.sorumlu.toLowerCase().includes(q)
      );
    }
    return liste;
  }, [statListesi, sorumluF, oncelikF, arama]);

  /* Dönemdeki benzersiz sorumlular (filtre seçeneği için) */
  const donemSorumlular = useMemo(
    () => [...new Set(aralikGorevler.map((g) => g.sorumlu))].sort(),
    [aralikGorevler]
  );

  const toggle = (f: Filtre) => {
    setFiltre((p) => p === f ? null : f);
    // Stat değiştirince görev filtrelerini sıfırla
    setArama(""); setSorumluF(""); setOncelikF("");
  };

  const filtreTemizle = () => { setArama(""); setSorumluF(""); setOncelikF(""); };
  const herhangiFiltre = !!(arama || sorumluF || oncelikF);

  /* Dönem etiketi */
  const donemEtiket = mod === "bugun" ? "Bugün"
    : mod === "dun"   ? "Dün"
    : mod === "hafta" ? "Son 1 Hafta"
    : mod === "ay"    ? "Son 1 Ay"
    : `${trGoster(baslangic + "T12:00:00", "tarih")} — ${trGoster(bitis + "T12:00:00", "tarih")}`;

  const modButonlar: { key: Mod; label: string }[] = [
    { key: "bugun", label: "Bugün"       },
    { key: "dun",   label: "Dün"         },
    { key: "hafta", label: "Son 1 Hafta" },
    { key: "ay",    label: "Son 1 Ay"    },
  ];

  const kartlar = [
    { key: "toplam"    as Filtre, label: "Toplam",       renk: "#94a3b8", bg: "rgba(148,163,184,0.12)", icon: ListTodo     },
    { key: "yapilacak" as Filtre, label: "Yapılacak",    renk: "#94a3b8", bg: "rgba(148,163,184,0.08)", icon: ListTodo     },
    { key: "devam"     as Filtre, label: "Devam Ediyor", renk: "#fbc024", bg: "rgba(251,192,36,0.12)",  icon: Clock        },
    { key: "tamamlandi"as Filtre, label: "Tamamlandı",   renk: "#22c55e", bg: "rgba(34,197,94,0.12)",   icon: CheckCircle2 },
    { key: "geciken"   as Filtre, label: "Geciken",      renk: "#ef4444", bg: "rgba(239,68,68,0.12)",   icon: AlertCircle  },
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
          <p className="text-xs text-[#94a3b8]">Dönem seç · Karta tıkla · Filtrele / Ara</p>
        </div>
      </div>

      {/* Dönem seçici */}
      <div className="space-y-3">
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
              <input type="date" value={ozelBit} min={ozelBas} max={trBugun()}
                onChange={(e) => setOzelBit(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-white text-xs focus:outline-none focus:border-[rgba(251,192,36,0.5)] scheme-dark" />
            </div>
          </div>
        )}
      </div>

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

          {/* Görev listesi + filtreleme */}
          {filtre && (
            <div className="space-y-3">
              {/* ── Filtre & arama çubuğu ── */}
              <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)]">
                {/* Arama */}
                <div className="flex items-center gap-1.5 flex-1 min-w-40 px-2.5 py-1.5 rounded-lg bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)]">
                  <Search className="w-3.5 h-3.5 text-[#64748b] shrink-0" />
                  <input
                    value={arama}
                    onChange={(e) => setArama(e.target.value)}
                    placeholder="Görev ara…"
                    className="flex-1 text-xs text-white bg-transparent outline-none placeholder-[#475569]"
                  />
                  {arama && (
                    <button onClick={() => setArama("")} className="text-[#64748b] hover:text-white transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Sorumlu filtresi */}
                <select value={sorumluF} onChange={(e) => setSorumluF(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-xs text-white focus:outline-none focus:border-[rgba(251,192,36,0.4)] transition-colors">
                  <option value="" className="bg-[#0e172a]">Tüm Sorumlular</option>
                  {donemSorumlular.map((s) => (
                    <option key={s} value={s} className="bg-[#0e172a]">{s}</option>
                  ))}
                </select>

                {/* Öncelik filtresi */}
                <select value={oncelikF} onChange={(e) => setOncelikF(e.target.value as "" | Oncelik)}
                  className="px-2.5 py-1.5 rounded-lg bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-xs text-white focus:outline-none focus:border-[rgba(251,192,36,0.4)] transition-colors">
                  <option value="" className="bg-[#0e172a]">Tüm Öncelikler</option>
                  <option value="acil"   className="bg-[#0e172a]">Acil</option>
                  <option value="yuksek" className="bg-[#0e172a]">Yüksek</option>
                  <option value="normal" className="bg-[#0e172a]">Normal</option>
                  <option value="dusuk"  className="bg-[#0e172a]">Düşük</option>
                </select>

                {/* Filtreleri temizle */}
                {herhangiFiltre && (
                  <button onClick={filtreTemizle}
                    className="px-2.5 py-1.5 rounded-lg border border-[rgba(239,68,68,0.3)] text-[#ef4444] text-xs hover:bg-[rgba(239,68,68,0.08)] transition-colors flex items-center gap-1">
                    <X className="w-3 h-3" />
                    Temizle
                  </button>
                )}
              </div>

              {/* Sonuç sayısı */}
              <p className="text-[11px] text-[#64748b] font-semibold uppercase tracking-widest">
                {gosterilecek.length} görev
                {herhangiFiltre && <span className="text-[#475569] normal-case font-normal ml-1">(filtrelenmiş)</span>}
              </p>

              {/* Liste */}
              {gosterilecek.length === 0 ? (
                <p className="text-center text-xs text-[#64748b] py-4">
                  {herhangiFiltre ? "Bu filtrelerle eşleşen görev bulunamadı" : "Bu kategoride görev yok"}
                </p>
              ) : (
                <div className="max-h-80 overflow-y-auto space-y-1.5 pr-1">
                  {gosterilecek.map((g) => {
                    const cfg     = DURUM_CONFIG[g.durum];
                    const oncelik = ONCELIK_CONFIG[g.oncelik];
                    const gecikti = g.durum !== "tamamlandi" && new Date(g.sonTarih) < simdi;
                    return (
                      <div key={g.id}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)]">
                        <span className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: gecikti ? "#ef4444" : cfg.color }} />

                        <p className={`flex-1 text-sm truncate ${g.durum === "tamamlandi" ? "line-through text-[#64748b]" : "text-white"}`}>
                          {g.baslik}
                        </p>

                        <span className="text-[10px] text-[#475569] shrink-0 hidden sm:block">
                          {trGoster(g.olusturmaTarih, "kisa")}
                        </span>

                        <span className="text-[10px] font-semibold shrink-0" style={{ color: oncelik.color }}>
                          {oncelik.label}
                        </span>

                        <span className="text-[10px] text-[#64748b] shrink-0">{g.sorumlu}</span>

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
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
