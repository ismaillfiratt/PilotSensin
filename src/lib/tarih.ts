/**
 * Türkiye saat dilimi (Europe/Istanbul, UTC+3) için merkezi tarih/saat yardımcıları.
 * Tüm uygulamada bu fonksiyonlar kullanılmalı — new Date().toLocaleDateString() değil.
 *
 * Supabase'de timestamp with time zone olarak saklanan ISO 8601 stringleri
 * gösterimde bu yardımcılarla Türkiye saatine çevrilir.
 */

import { useState, useEffect, useCallback } from "react";

export const TZ = "Europe/Istanbul";

/* ─── Türkiye'deki "bugün" (YYYY-MM-DD) ─────────────────────────────── */
export function trBugun(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: TZ });
}

/* ─── N gün önceki TR tarihi (YYYY-MM-DD) ───────────────────────────── */
export function trOncekiGun(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toLocaleDateString("en-CA", { timeZone: TZ });
}

/* ─── Verilen TR gün stringini Date objesine çevir (gün başı / sonu) ── */
export function trGunBaslangici(gunStr?: string): Date {
  return new Date((gunStr ?? trBugun()) + "T00:00:00+03:00");
}
export function trGunSonu(gunStr?: string): Date {
  return new Date((gunStr ?? trBugun()) + "T23:59:59+03:00");
}

/* ─── Gösterim fonksiyonları (ISO → TR formatında string) ───────────── */
export function trGoster(iso: string, format: "tarih" | "kisa" | "saat" | "uzun" | "tarihSaat" = "tarih"): string {
  const d = new Date(iso);
  switch (format) {
    case "uzun":      return d.toLocaleDateString("tr-TR", { timeZone: TZ, weekday: "long",  day: "numeric", month: "long",  year: "numeric" });
    case "tarih":     return d.toLocaleDateString("tr-TR", { timeZone: TZ, day: "2-digit",   month: "long",  year: "numeric" });
    case "kisa":      return d.toLocaleDateString("tr-TR", { timeZone: TZ, day: "2-digit",   month: "short" });
    case "saat":      return d.toLocaleTimeString("tr-TR", { timeZone: TZ, hour: "2-digit",  minute: "2-digit" });
    case "tarihSaat": return d.toLocaleString  ("tr-TR", { timeZone: TZ, day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  }
}

/* ─── Son tarih: takvim günü farkı (TR takvimine göre, saat bağımsız) ─ */
export function trGunFarki(isoSonTarih: string): number {
  const sonGun   = new Date(isoSonTarih).toLocaleDateString("en-CA", { timeZone: TZ });
  const bugun    = trBugun();
  return Math.round((new Date(sonGun).getTime() - new Date(bugun).getTime()) / 86400000);
}

/* ─── Şu anki TR saatini HH:MM:SS stringe çevir ────────────────────── */
export function trSaatiStr(d: Date): string {
  return d.toLocaleTimeString("tr-TR", { timeZone: TZ, hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
export function trTarihiUzun(d: Date): string {
  return d.toLocaleDateString("tr-TR", { timeZone: TZ, weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

/* ─── Hook: her saniye güncellenen TR saati (bellek sızıntısız) ─────── */
export function useTRSaat() {
  const [simdi, setSimdi] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setSimdi(new Date()), 1_000);
    return () => clearInterval(timer);   // cleanup — bellek sızıntısı yok
  }, []);

  return simdi;
}

/* ─── Hook: gece yarısı TR'de geçince callback tetikler ─────────────── */
export function useGunDegisimi(callback: () => void) {
  const stableCallback = useCallback(callback, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let sonGun = trBugun();

    const kontrol = () => {
      const yeniGun = trBugun();
      if (yeniGun !== sonGun) {
        sonGun = yeniGun;
        stableCallback();
      }
    };

    // Her 30 saniyede kontrol — gece yarısını max 30 sn gecikmeli yakalar
    const timer = setInterval(kontrol, 30_000);
    return () => clearInterval(timer);
  }, [stableCallback]);
}
