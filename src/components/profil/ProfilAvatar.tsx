"use client";

import { motion } from "framer-motion";
import { Camera } from "lucide-react";

interface Props {
  ad: string;
  soyad: string;
  email: string;
}

export default function ProfilAvatar({ ad, soyad, email }: Props) {
  const initials = `${ad?.[0] ?? ""}${soyad?.[0] ?? ""}`.toUpperCase() || "?";

  return (
    <div className="glass-card rounded-2xl p-6 flex flex-col items-center gap-4">
      {/* Avatar */}
      <div className="relative group">
        <div className="w-24 h-24 rounded-2xl bg-[#fbc024] flex items-center justify-center text-3xl font-black text-[#0e172a] select-none">
          {initials}
        </div>
        <button className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
          <Camera className="w-6 h-6 text-white" />
        </button>
      </div>

      <div className="text-center">
        <p className="text-lg font-bold text-white">
          {ad} {soyad}
        </p>
        <p className="text-sm text-[#94a3b8] mt-0.5">{email}</p>
      </div>

      {/* Pilot Skoru rozeti */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[rgba(251,192,36,0.1)] border border-[rgba(251,192,36,0.25)]"
      >
        <span className="text-xs text-[#94a3b8]">Pilot Skoru</span>
        <span className="text-sm font-black text-[#fbc024]">72</span>
      </motion.div>

      <div className="w-full grid grid-cols-3 gap-2 pt-2 border-t border-[rgba(255,255,255,0.06)]">
        {[
          { label: "Görev", value: "12" },
          { label: "Uyarı", value: "7" },
          { label: "Gün", value: "23" },
        ].map(({ label, value }) => (
          <div key={label} className="text-center">
            <p className="text-base font-bold text-white">{value}</p>
            <p className="text-[11px] text-[#94a3b8]">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
