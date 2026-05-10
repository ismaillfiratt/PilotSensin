"use client";

import { motion } from "framer-motion";
import { Camera } from "lucide-react";
import { useNakit }        from "@/store/nakit";
import { useGorevler }     from "@/store/gorevler";
import { useStok }         from "@/store/stok";
import { useProsedurler }  from "@/store/prosedurler";
import { useAcilFon }      from "@/store/acilFon";
import {
  nakitSkoru, gorevSkoru, stokSkoru,
  prosedurSkoru, acilFonSkoru, pilotSkoru,
} from "@/lib/pilot-score";

interface Props { ad: string; soyad: string; email: string; }

export default function ProfilAvatar({ ad, soyad, email }: Props) {
  const initials = `${ad?.[0] ?? ""}${soyad?.[0] ?? ""}`.toUpperCase() || "?";

  const { islemler }                   = useNakit();
  const { gorevler }                   = useGorevler();
  const { urunler }                    = useStok();
  const { prosedurler, checklist }     = useProsedurler();
  const { islemler: fonIslemler, hedefler: fonHedefler } = useAcilFon();

  const skor = pilotSkoru([
    nakitSkoru(islemler),
    gorevSkoru(gorevler),
    stokSkoru(urunler),
    prosedurSkoru(prosedurler, checklist),
    acilFonSkoru(fonIslemler, fonHedefler),
  ]);

  const skorRenk = skor >= 80 ? "#22c55e" : skor >= 60 ? "#fbc024" : "#ef4444";

  // Görev sayısı
  const acikGorev  = gorevler.filter((g) => g.durum !== "tamamlandi").length;
  // Uyarı: gecikmiş görev + kritik stok sayısı
  const gecikGorev = gorevler.filter((g) => g.durum !== "tamamlandi" && new Date(g.sonTarih) < new Date()).length;
  const uyariSayisi = gecikGorev + urunler.filter((u) => {
    const gun = Math.floor((Date.now() - new Date(u.sonHareket).getTime()) / 86400000);
    return gun < 90 && u.mevcutAdet <= u.kritikStok;
  }).length;
  // Gün: en yakın görev bitiş tarihine kalan gün
  const yakinGun = gorevler
    .filter((g) => g.durum !== "tamamlandi")
    .map((g) => Math.ceil((new Date(g.sonTarih).getTime() - Date.now()) / 86400000))
    .filter((d) => d >= 0)
    .sort((a, b) => a - b)[0] ?? 0;

  const istatistikler = [
    { label: "Görev",  value: String(acikGorev)  },
    { label: "Uyarı",  value: String(uyariSayisi) },
    { label: "Gün",    value: String(yakinGun)    },
  ];

  return (
    <div className="glass-card rounded-2xl p-6 flex flex-col items-center gap-4">
      <div className="relative group">
        <div className="w-24 h-24 rounded-2xl bg-[#fbc024] flex items-center justify-center text-3xl font-black text-[#0e172a] select-none">
          {initials}
        </div>
        <button className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
          <Camera className="w-6 h-6 text-white" />
        </button>
      </div>

      <div className="text-center">
        <p className="text-lg font-bold text-white">{ad} {soyad}</p>
        <p className="text-sm text-[#94a3b8] mt-0.5">{email}</p>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="flex items-center gap-2 px-4 py-2 rounded-xl border"
        style={{ backgroundColor: `${skorRenk}15`, borderColor: `${skorRenk}40` }}
      >
        <span className="text-xs text-[#94a3b8]">Pilot Skoru</span>
        <span className="text-sm font-black" style={{ color: skorRenk }}>%{skor}</span>
      </motion.div>

      <div className="w-full grid grid-cols-3 gap-2 pt-2 border-t border-[rgba(255,255,255,0.06)]">
        {istatistikler.map(({ label, value }) => (
          <div key={label} className="text-center">
            <p className="text-base font-bold text-white">{value}</p>
            <p className="text-[11px] text-[#94a3b8]">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
