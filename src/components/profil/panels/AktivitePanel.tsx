"use client";

import { useState, useEffect } from "react";
import {
  Package, CheckSquare, ShoppingCart, Banknote,
  User, ClipboardList, Shield, Circle, History,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";

// ── Tipler ────────────────────────────────────────────────────────────────────
interface Aktivite {
  id:              string;
  modul:           string;
  eylem:           string;
  ozet:            string;
  olusturma_tarih: string;
}

type Filtre = "tumu" | "stok" | "gorev" | "satis" | "nakit" | "profil" | "prosedur" | "acil-fon";

const FILTRELER: { value: Filtre; label: string }[] = [
  { value: "tumu",     label: "Tümü"      },
  { value: "stok",     label: "Stok"      },
  { value: "gorev",    label: "Görevler"  },
  { value: "satis",    label: "Satış"     },
  { value: "nakit",    label: "Nakit"     },
  { value: "profil",   label: "Profil"    },
  { value: "prosedur", label: "Prosedür"  },
  { value: "acil-fon", label: "Acil Fon"  },
];

// ── Modül ikonu + renk ────────────────────────────────────────────────────────
const MODUL_STIL: Record<string, { icon: React.ElementType; bg: string; color: string }> = {
  stok:      { icon: Package,       bg: "rgba(96,165,250,0.1)",  color: "#1E40AF" },
  gorev:     { icon: CheckSquare,   bg: "rgba(34,197,94,0.1)",   color: "#047857" },
  satis:     { icon: ShoppingCart,  bg: "rgba(167,139,250,0.1)", color: "#5B21B6" },
  nakit:     { icon: Banknote,      bg: "rgba(15,61,46,0.1)",    color: "#0F3D2E" },
  profil:    { icon: User,          bg: "rgba(100,116,139,0.1)", color: "#475569" },
  prosedur:  { icon: ClipboardList, bg: "rgba(249,115,22,0.1)",  color: "#B45309" },
  "acil-fon":{ icon: Shield,        bg: "rgba(239,68,68,0.1)",   color: "#C97676" },
};
function modulStil(modul: string) {
  return MODUL_STIL[modul] ?? { icon: Circle, bg: "rgba(100,116,139,0.1)", color: "#64748b" };
}

// ── Tarih formatı ─────────────────────────────────────────────────────────────
function relZaman(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min  = Math.floor(diff / 60000);
  const hr   = Math.floor(min / 60);
  const gun  = Math.floor(hr / 24);
  if (min < 1)  return "Az önce";
  if (min < 60) return `${min} dk önce`;
  if (hr  < 24) return `${hr} saat önce`;
  if (gun === 1) {
    const hm = new Date(iso).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
    return `Dün, ${hm}`;
  }
  if (gun < 7) return `${gun} gün önce`;
  const d = new Date(iso);
  const ayStr = d.toLocaleDateString("tr-TR", { day: "2-digit", month: "short" });
  const yilStr = d.getFullYear() !== new Date().getFullYear()
    ? ` ${d.getFullYear()}` : "";
  return `${ayStr}${yilStr}`;
}

const SAYFA = 50;

// ── Ana bileşen ───────────────────────────────────────────────────────────────
export default function AktivitePanel() {
  const [filtre,     setFiltre]     = useState<Filtre>("tumu");
  const [aktiviteler, setAktiviteler] = useState<Aktivite[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [, setDahaFazla]  = useState(false);
  const [tumYuklendi, setTumYuklendi] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchAktivite = async (reset: boolean) => {
    setYukleniyor(true);
    const sb = createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { setYukleniyor(false); return; }

    const offset = reset ? 0 : aktiviteler.length;
    let q = sb
      .from("activity_log")
      .select("id,modul,eylem,ozet,olusturma_tarih")
      .eq("user_id", user.id)
      .order("olusturma_tarih", { ascending: false })
      .range(offset, offset + SAYFA - 1);

    if (filtre !== "tumu") q = q.eq("modul", filtre);

    const { data } = await q;
    const rows = (data ?? []) as Aktivite[];

    setAktiviteler(prev => reset ? rows : [...prev, ...rows]);
    setTumYuklendi(rows.length < SAYFA);
    setDahaFazla(rows.length === SAYFA);
    setYukleniyor(false);
  };

  useEffect(() => { void fetchAktivite(true); }, [filtre]); // eslint-disable-line react-hooks/exhaustive-deps

  const toplam = aktiviteler.length;

  return (
    <div className="space-y-4">
      {/* Başlık */}
      <div>
        <p className="label-caps">AKTİVİTE</p>
        <h2 className="text-xl font-medium text-gray-900 mt-1">Aktivitelerim</h2>
        <p className="text-sm text-gray-500 mt-1">Son aksiyonların ve uygulama geçmişi</p>
      </div>

      {/* B1 — Filtre barı */}
      <div className="bg-white rounded-xl p-4 flex items-center justify-between gap-3 flex-wrap"
        style={{ border: "0.5px solid rgba(0,0,0,0.08)" }}>
        <div className="flex items-center gap-1 flex-wrap">
          {FILTRELER.map(({ value, label }) => (
            <button key={value} onClick={() => setFiltre(value)}
              className="px-3 py-1 rounded-full text-xs font-medium transition-all"
              style={filtre === value
                ? { background: "rgba(15,61,46,0.08)", color: "var(--forest)" }
                : { color: "#64748b" }}>
              {label}
            </button>
          ))}
        </div>
        {!yukleniyor && (
          <span className="text-xs text-gray-400 shrink-0 font-number tabular-nums">{toplam} kayıt</span>
        )}
      </div>

      {/* B2 — Liste kartı */}
      <div className="bg-white rounded-xl overflow-hidden" style={{ border: "0.5px solid rgba(0,0,0,0.08)" }}>

        {/* Skeleton */}
        {yukleniyor && aktiviteler.length === 0 && (
          <div className="divide-y divide-gray-100 animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <div className="w-9 h-9 rounded-lg bg-gray-100 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-gray-100 rounded w-3/4" />
                  <div className="h-2.5 bg-gray-50 rounded w-1/3" />
                </div>
                <div className="h-2.5 bg-gray-100 rounded w-16 shrink-0" />
              </div>
            ))}
          </div>
        )}

        {/* Boş durum */}
        {!yukleniyor && aktiviteler.length === 0 && (
          <div className="py-16 flex flex-col items-center gap-3 text-center px-4">
            <History className="w-10 h-10 text-gray-200" />
            <p className="text-sm font-medium text-gray-600">Henüz aktivite yok</p>
            <p className="text-xs text-gray-400">İşlemler yaptıkça burada görünecek</p>
          </div>
        )}

        {/* Satırlar */}
        {aktiviteler.length > 0 && (
          <div className="divide-y divide-gray-100">
            {aktiviteler.map(a => {
              const s = modulStil(a.modul);
              const Icon = s.icon;
              return (
                <div key={a.id}
                  className="grid items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors"
                  style={{ gridTemplateColumns: "36px minmax(180px,1fr) 80px 90px" }}>

                  {/* İkon */}
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: s.bg }}>
                    <Icon className="w-4 h-4" style={{ color: s.color }} />
                  </div>

                  {/* Özet */}
                  <div className="min-w-0">
                    <p className="text-[13px] text-gray-800 truncate leading-snug">{a.ozet}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{a.eylem}</p>
                  </div>

                  {/* Modül pill */}
                  <span className="text-[10px] font-medium px-2.5 py-1 rounded-full truncate text-center"
                    style={{ backgroundColor: s.bg, color: s.color }}>
                    {a.modul}
                  </span>

                  {/* Tarih */}
                  <p className="text-xs text-gray-400 text-right whitespace-nowrap">{relZaman(a.olusturma_tarih)}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Daha fazla / tüm kayıtlar */}
        {aktiviteler.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 text-center">
            {tumYuklendi ? (
              <p className="text-xs text-gray-400">Tüm geçmiş yüklendi</p>
            ) : (
              <button onClick={() => fetchAktivite(false)} disabled={yukleniyor}
                className="text-xs font-medium transition-colors disabled:opacity-50"
                style={{ color: "var(--forest)" }}>
                {yukleniyor ? "Yükleniyor..." : "Daha eskileri yükle"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
