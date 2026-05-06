"use client";

import { useState, useEffect } from "react";

export default function TarihBilgisi() {
  const [tarih, setTarih] = useState("");

  useEffect(() => {
    const guncelle = () => {
      setTarih(
        new Date().toLocaleDateString("tr-TR", {
          weekday: "long",
          day:     "numeric",
          month:   "long",
          year:    "numeric",
        })
      );
    };
    guncelle();
    const timer = setInterval(guncelle, 60_000);
    return () => clearInterval(timer);
  }, []);

  if (!tarih) return null;

  return (
    <p className="text-sm text-[#94a3b8] mt-1">
      {tarih} &mdash; Son güncelleme: az önce
    </p>
  );
}
