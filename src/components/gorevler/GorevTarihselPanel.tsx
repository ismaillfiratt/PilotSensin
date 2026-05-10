"use client";

import { useState, useMemo } from "react";
import { Calendar, CheckCircle2, Clock, ListTodo, BarChart3, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { useGorevler } from "@/store/gorevler";
import { ONCELIK_CONFIG } from "@/lib/gorev-data";
import type { Gorev } from "@/lib/gorev-data";

/* ── Yardımcılar ── */
function gunStr(iso: string) { return iso.split("T")[0]; }
function bugun()  { return new Date().toISOString().split("T")[0]; }
function dunGun() { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().split("T")[0]; }
function oncekiGun(n: number) { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().split("T")[0]; }

function formatTarihLong(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" });
}

type Mod = "bugun" | "dun" | "hafta" | "ay" | "ozel";
type Filtre = "eklendi" | "devam" | "tamamlandi" | "geciken" | "toplam" | null;

/* ── Stat kartı bileşeni ── */
interface StatKartProps {
  label: string;
  deger: number;
  renk: string;
  bg: string;
  icon: React.ElementType;
  secili: boolean;
  onClick: () => void;
}
function StatKart({ label, deger, renk, bg, icon: Icon, secili, onClick }: StatKartProps) {
  return (
    <button onClick={onClick}
      className="rounded-xl p-3 text-center border transition-all hover:scale-105"
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

  const [mod, setMod]             = useState<Mod>("bugun");
  const [ozelTarih, setOzelTarih] = useState(bugun());
  const [filtre, setFiltre]       = useState<Filtre>(null);
  const [ozelAcik, setOzelAcik]   = useState(false);

  /* Başlangıç / bitiş tarihi */
  const { baslangic, bitis } = useMemo(() => {
    switch (mod) {
      case "bugun":  return { baslangic: bugun(),        bitis: bugun() };
      case "dun":    return { baslangic: dunGun(),       bitis: dunGun() };
      case "hafta":  return { baslangic: oncekiGun(6),   bitis: bugun() };
      case "ay":     return { baslangic: oncekiGun(29),  bitis: bugun() };
      case "ozel":   return { baslangic: ozelTarih,      bitis: ozelTarih };
    }
  }, [mod, ozelTarih]);

  const bitisT = new Date(bitis + "T23:59:59");
  const basT   = new Date(baslangic + "T00:00:00");

  /* İtibarıyla istatistikler (bitiş tarihine kadar kümülatif) */
  const itibariylaStats = useMemo(() => {
    const tum      = gorevler.filter((g) => new Date(g.olusturmaTarih) <= bitisT);
    const tamam    = tum.filter((g) => g.tamamlanmaTarihi && new Date(g.tamamlanmaTarihi) <= bitisT);
    const devam    = tum.filter((g) => g.durum === "devam" && !tamam.includes(g));
    const yapilacak = tum.filter((g) => !tamam.includes(g) && !devam.includes(g));
    const geciken  = tum.filter((g) => !tamam.includes(g) && new Date(g.sonTarih) < bitisT);
    return { toplam: tum.length, tamamlandi: tamam.length, devam: devam.length, yapilacak: yapilacak.length, geciken: geciken.length };
  }, [gorevler, bitisT]);

  /* O dönemde gerçekleşen olaylar */
  const olayStats = useMemo(() => {
    const eklendi   = gorevler.filter((g) => { const t = new Date(g.olusturmaTarih); return t >= basT && t <= bitisT; });
    const devamGecti = gorevler.filter((g) => { if (!g.devamaTarihi) return false; const t = new Date(g.devamaTarihi); return t >= basT && t <= bitisT; });
    const tamamlandi = gorevler.filter((g) => { if (!g.tamamlanmaTarihi) return false; const t = new Date(g.tamamlanmaTarihi); return t >= basT && t <= bitisT; });
    return { eklendi, devamGecti, tamamlandi };
  }, [gorevler, basT, bitisT]);

  /* Seçili filtreye göre liste */
  const filtrelenmisListe: Gorev[] = useMemo(() => {
    if (!filtre) return [];
    const tum     = gorevler.filter((g) => new Date(g.olusturmaTarih) <= bitisT);
    const tamam   = tum.filter((g) => g.tamamlanmaTarihi && new Date(g.tamamlanmaTarihi) <= bitisT);
    switch (filtre) {
      case "toplam":     return [...tum].sort((a, b) => new Date(b.olusturmaTarih).getTime() - new Date(a.olusturmaTarih).getTime());
      case "tamamlandi": return olayStats.tamamlandi;
      case "devam":      return olayStats.devamGecti;
      case "eklendi":    return olayStats.eklendi;
      case "geciken":    return tum.filter((g) => !tamam.includes(g) && new Date(g.sonTarih) < bitisT);
    }
  }, [filtre, gorevler, bitisT, olayStats]);

  const modButonlar: { key: Mod; label: string }[] = [
    { key: "bugun", label: "Bugün" },
    { key: "dun",   label: "Dün" },
    { key: "hafta", label: "Son 1 Hafta" },
    { key: "ay",    label: "Son 1 Ay" },
  ];

  const setFiltreToogle = (f: Filtre) => setFiltre((prev) => prev === f ? null : f);

  const donemLabel = mod === "ozel"
    ? formatTarihLong(ozelTarih)
    : mod === "hafta" ? "Son 1 Hafta"
    : mod === "ay"    ? "Son 1 Ay"
    : mod === "dun"   ? "Dün"
    : "Bugün";

  return (
    <div className="glass-card rounded-2xl p-6 space-y-5">
      {/* Başlık */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[rgba(251,192,36,0.12)] border border-[rgba(251,192,36,0.2)] flex items-center justify-center">
          <Calendar className="w-5 h-5 text-[#fbc024]" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white">Tarihsel Görev Analizi</h3>
          <p className="text-xs text-[#94a3b8]">Dönem seçin veya özel tarih girin</p>
        </div>
      </div>

      {/* Tarih seçici — sol: hızlı butonlar, sağ: özel tarih */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Hızlı dönem butonları */}
        {modButonlar.map(({ key, label }) => (
          <button key={key} onClick={() => { setMod(key); setOzelAcik(false); }}
            className="px-3 py-1.5 rounded-xl text-xs font-medium border transition-all"
            style={{
              borderColor: mod === key ? "#fbc024" : "rgba(255,255,255,0.08)",
              backgroundColor: mod === key ? "rgba(251,192,36,0.12)" : "transparent",
              color: mod === key ? "#fbc024" : "#94a3b8",
            }}>
            {label}
          </button>
        ))}

        {/* Özel tarih butonu */}
        <button onClick={() => { setOzelAcik(!ozelAcik); if (!ozelAcik) setMod("ozel"); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all"
          style={{
            borderColor: mod === "ozel" ? "#fbc024" : "rgba(255,255,255,0.08)",
            backgroundColor: mod === "ozel" ? "rgba(251,192,36,0.12)" : "transparent",
            color: mod === "ozel" ? "#fbc024" : "#94a3b8",
          }}>
          <Calendar className="w-3 h-3" />
          Özel Tarih
          {ozelAcik ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        {/* Özel tarih input — görünür olunca */}
        {ozelAcik && (
          <input type="date" value={ozelTarih} max={bugun()}
            onChange={(e) => { setOzelTarih(e.target.value); setMod("ozel"); }}
            className="px-3 py-1.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(251,192,36,0.4)] text-white text-xs focus:outline-none scheme-dark" />
        )}
      </div>

      {/* Seçilen dönem etiketi */}
      <p className="text-xs text-[#64748b] -mt-2">
        {mod === "bugun" || mod === "dun" || mod === "ozel"
          ? `${donemLabel} itibarıyla`
          : `${donemLabel} itibarıyla (${formatTarihLong(baslangic)} — ${formatTarihLong(bitis)})`}
      </p>

      {itibariylaStats.toplam === 0 && olayStats.eklendi.length === 0 ? (
        <div className="py-10 text-center text-[#64748b] text-sm">
          Bu dönemde henüz görev bulunmuyor
        </div>
      ) : (
        <>
          {/* Bölüm 1: İtibarıyla durumu */}
          <div>
            <p className="text-[11px] text-[#64748b] font-semibold uppercase tracking-widest mb-2">
              {donemLabel} İtibarıyla Durum
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {[
                { key: "toplam"     as Filtre, label: "Toplam",       deger: itibariylaStats.toplam,      renk: "#94a3b8", bg: "rgba(148,163,184,0.1)", icon: ListTodo      },
                { key: "eklendi"    as Filtre, label: "Yapılacak",    deger: itibariylaStats.yapilacak,   renk: "#94a3b8", bg: "rgba(148,163,184,0.08)", icon: ListTodo    },
                { key: "devam"      as Filtre, label: "Devam Ediyor", deger: itibariylaStats.devam,       renk: "#fbc024", bg: "rgba(251,192,36,0.1)",  icon: Clock        },
                { key: "tamamlandi" as Filtre, label: "Tamamlandı",   deger: itibariylaStats.tamamlandi,  renk: "#22c55e", bg: "rgba(34,197,94,0.1)",  icon: CheckCircle2 },
                { key: "geciken"    as Filtre, label: "Geciken",      deger: itibariylaStats.geciken,     renk: "#ef4444", bg: "rgba(239,68,68,0.1)",  icon: BarChart3    },
              ].map(({ key, label, deger, renk, bg, icon }) => (
                <StatKart key={key} label={label} deger={deger} renk={renk} bg={bg} icon={icon}
                  secili={filtre === key} onClick={() => setFiltreToogle(key)} />
              ))}
            </div>
          </div>

          {/* Bölüm 2: O dönemde gerçekleşenler */}
          <div>
            <p className="text-[11px] text-[#64748b] font-semibold uppercase tracking-widest mb-2">
              {donemLabel} İçinde Gerçekleşenler
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: "eklendi"    as Filtre, label: "Yeni Eklendi",        deger: olayStats.eklendi.length,    renk: "#a78bfa", bg: "rgba(167,139,250,0.1)", icon: Plus         },
                { key: "devam"      as Filtre, label: "Devam'a Geçti",       deger: olayStats.devamGecti.length, renk: "#fbc024", bg: "rgba(251,192,36,0.1)",  icon: Clock        },
                { key: "tamamlandi" as Filtre, label: "Tamamlandı",          deger: olayStats.tamamlandi.length, renk: "#22c55e", bg: "rgba(34,197,94,0.1)",  icon: CheckCircle2 },
              ].map(({ key, label, deger, renk, bg, icon }) => (
                <StatKart key={`olay-${key}`} label={label} deger={deger} renk={renk} bg={bg} icon={icon}
                  secili={filtre === key} onClick={() => setFiltreToogle(key)} />
              ))}
            </div>
          </div>

          {/* Görev listesi (filtre seçilince görünür) */}
          {filtre && filtrelenmisListe.length > 0 && (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              <p className="text-[11px] text-[#64748b] font-semibold uppercase tracking-widest">
                {filtrelenmisListe.length} görev
              </p>
              {filtrelenmisListe.map((g) => {
                const tamamlandi = g.tamamlanmaTarihi && new Date(g.tamamlanmaTarihi) <= bitisT;
                const gecikti    = !tamamlandi && new Date(g.sonTarih) < bitisT;
                const oncelik    = ONCELIK_CONFIG[g.oncelik];
                return (
                  <div key={g.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)]">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: tamamlandi ? "#22c55e" : gecikti ? "#ef4444" : "#fbc024" }} />
                    <p className={`flex-1 text-sm truncate ${tamamlandi ? "line-through text-[#64748b]" : "text-white"}`}>
                      {g.baslik}
                    </p>
                    <span className="text-[10px] font-semibold shrink-0" style={{ color: oncelik.color }}>
                      {oncelik.label}
                    </span>
                    <span className="text-[10px] text-[#64748b] shrink-0">{g.sorumlu}</span>
                    <span className="text-[10px] shrink-0 font-medium px-1.5 py-0.5 rounded-md"
                      style={{
                        color: tamamlandi ? "#22c55e" : gecikti ? "#ef4444" : "#fbc024",
                        backgroundColor: tamamlandi ? "rgba(34,197,94,0.1)" : gecikti ? "rgba(239,68,68,0.1)" : "rgba(251,192,36,0.1)",
                      }}>
                      {tamamlandi ? "Tamamlandı" : gecikti ? "Gecikti" : g.durum === "devam" ? "Devam" : "Bekliyor"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {filtre && filtrelenmisListe.length === 0 && (
            <p className="text-center text-xs text-[#64748b] py-4">Bu kategoride görev bulunmuyor</p>
          )}
        </>
      )}
    </div>
  );
}
