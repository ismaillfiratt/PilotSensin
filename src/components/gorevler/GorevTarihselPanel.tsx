"use client";

import { useState, useMemo } from "react";
import { Calendar, CheckCircle2, Clock, ListTodo, BarChart3, ChevronLeft, ChevronRight } from "lucide-react";
import { useGorevler } from "@/store/gorevler";
import { ONCELIK_CONFIG, sonTarihDurumu } from "@/lib/gorev-data";

function formatTarih(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" });
}

function isoGun(iso: string) {
  return iso.split("T")[0];
}

export default function GorevTarihselPanel() {
  const { gorevler } = useGorevler();

  const bugun = new Date().toISOString().split("T")[0];
  const [secilenTarih, setSecilenTarih] = useState(bugun);

  // Seçilen tarihe göre istatistik hesapla
  const istatistik = useMemo(() => {
    const secilen = new Date(secilenTarih + "T23:59:59");

    // O tarihe kadar oluşturulmuş görevler
    const mevcutGorevler = gorevler.filter((g) => new Date(g.olusturmaTarih) <= secilen);

    const tamamlandi = mevcutGorevler.filter(
      (g) => g.tamamlanmaTarihi && new Date(g.tamamlanmaTarihi) <= secilen
    );
    const devam = mevcutGorevler.filter(
      (g) => g.durum === "devam" && !tamamlandi.includes(g)
    );
    const yapilacak = mevcutGorevler.filter(
      (g) => !tamamlandi.includes(g) && !devam.includes(g)
    );
    const geciken = mevcutGorevler.filter(
      (g) => !tamamlandi.includes(g) && new Date(g.sonTarih) < secilen
    );

    return { toplam: mevcutGorevler.length, tamamlandi: tamamlandi.length, devam: devam.length, yapilacak: yapilacak.length, geciken: geciken.length, liste: mevcutGorevler };
  }, [gorevler, secilenTarih]);

  const gunDegistir = (fark: number) => {
    const d = new Date(secilenTarih);
    d.setDate(d.getDate() + fark);
    setSecilenTarih(d.toISOString().split("T")[0]);
  };

  const kartlar = [
    { label: "Toplam Görev",   deger: istatistik.toplam,     renk: "#94a3b8", bg: "rgba(148,163,184,0.1)", icon: ListTodo      },
    { label: "Yapılacak",      deger: istatistik.yapilacak,   renk: "#94a3b8", bg: "rgba(148,163,184,0.08)", icon: ListTodo    },
    { label: "Devam Ediyor",   deger: istatistik.devam,       renk: "#fbc024", bg: "rgba(251,192,36,0.1)",  icon: Clock        },
    { label: "Tamamlandı",     deger: istatistik.tamamlandi,  renk: "#22c55e", bg: "rgba(34,197,94,0.1)",  icon: CheckCircle2 },
    { label: "Geciken",        deger: istatistik.geciken,     renk: "#ef4444", bg: "rgba(239,68,68,0.1)",  icon: BarChart3    },
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
          <p className="text-xs text-[#94a3b8]">Seçilen tarihteki görev durumunu görüntüle</p>
        </div>
      </div>

      {/* Tarih seçici */}
      <div className="flex items-center gap-3">
        <button onClick={() => gunDegistir(-1)}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-[rgba(255,255,255,0.08)] text-[#94a3b8] hover:text-white hover:border-[rgba(255,255,255,0.2)] transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <input
            type="date"
            value={secilenTarih}
            max={bugun}
            onChange={(e) => setSecilenTarih(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white text-sm focus:outline-none focus:border-[rgba(251,192,36,0.5)] transition-colors [color-scheme:dark]"
          />
        </div>
        <button onClick={() => gunDegistir(1)} disabled={secilenTarih >= bugun}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-[rgba(255,255,255,0.08)] text-[#94a3b8] hover:text-white hover:border-[rgba(255,255,255,0.2)] disabled:opacity-30 transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
        <button onClick={() => setSecilenTarih(bugun)}
          className="px-3 py-2 rounded-xl border border-[rgba(255,255,255,0.08)] text-xs text-[#94a3b8] hover:text-[#fbc024] hover:border-[rgba(251,192,36,0.4)] transition-colors whitespace-nowrap">
          Bugün
        </button>
      </div>

      {/* Seçilen tarih etiketi */}
      <p className="text-xs text-[#64748b] text-center -mt-2">
        {formatTarih(secilenTarih)} itibarıyla
      </p>

      {/* İstatistik kartları */}
      {istatistik.toplam === 0 ? (
        <div className="py-10 text-center text-[#64748b] text-sm">
          Bu tarihte henüz görev oluşturulmamış
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {kartlar.map(({ label, deger, renk, bg, icon: Icon }) => (
              <div key={label} className="rounded-xl p-3 text-center border"
                style={{ backgroundColor: bg, borderColor: `${renk}30` }}>
                <Icon className="w-4 h-4 mx-auto mb-1" style={{ color: renk }} />
                <p className="text-xl font-black" style={{ color: renk }}>{deger}</p>
                <p className="text-[10px] text-[#94a3b8] mt-0.5 leading-tight">{label}</p>
              </div>
            ))}
          </div>

          {/* Görev listesi */}
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {istatistik.liste.map((g) => {
              const tamamlandi = g.tamamlanmaTarihi && new Date(g.tamamlanmaTarihi) <= new Date(secilenTarih + "T23:59:59");
              const gecikti    = !tamamlandi && new Date(g.sonTarih) < new Date(secilenTarih + "T23:59:59");
              const oncelik    = ONCELIK_CONFIG[g.oncelik];
              return (
                <div key={g.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)]">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-0.5"
                    style={{ backgroundColor: tamamlandi ? "#22c55e" : gecikti ? "#ef4444" : "#fbc024" }} />
                  <p className={`flex-1 text-sm truncate ${tamamlandi ? "line-through text-[#64748b]" : "text-white"}`}>
                    {g.baslik}
                  </p>
                  <span className="text-[10px] font-semibold shrink-0" style={{ color: oncelik.color }}>
                    {oncelik.label}
                  </span>
                  <span className="text-[10px] text-[#64748b] shrink-0">
                    {g.sorumlu}
                  </span>
                  <span className="text-[10px] shrink-0 font-medium"
                    style={{ color: tamamlandi ? "#22c55e" : gecikti ? "#ef4444" : "#94a3b8" }}>
                    {tamamlandi ? "Tamamlandı" : gecikti ? "Gecikti" : g.durum === "devam" ? "Devam" : "Bekliyor"}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
