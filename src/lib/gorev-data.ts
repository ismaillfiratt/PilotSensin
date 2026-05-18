import { trGunFarki, trGoster } from "./tarih";
import type { Silinebilir } from "@/lib/silinebilir";

export type GorevDurumu  = "yapilacak" | "devam" | "tamamlandi";
export type Oncelik      = "acil" | "yuksek" | "normal" | "dusuk";

export interface Gorev extends Silinebilir {
  id: string;
  baslik: string;
  aciklama: string;
  sorumlu: string;
  sonTarih: string; // ISO
  oncelik: Oncelik;
  durum: GorevDurumu;
  olusturmaTarih: string; // ISO
  tamamlanmaTarihi?: string; // tamamlandığı an — gecikme hesabı için sabit kalır
  devamaTarihi?:    string; // devam ediyor'a alındığı an
}


export const SORUMLULAR = ["İsmail", "Ayşe", "Mehmet", "Ali", "Fatma"];

export const ONCELIK_CONFIG: Record<Oncelik, { label: string; color: string; bg: string }> = {
  acil:   { label: "Acil",    color: "#ef4444", bg: "rgba(239,68,68,0.12)"   },
  yuksek: { label: "Yüksek",  color: "#fbc024", bg: "rgba(251,192,36,0.12)"  },
  normal: { label: "Normal",  color: "#94a3b8", bg: "rgba(148,163,184,0.12)" },
  dusuk:  { label: "Düşük",   color: "#64748b", bg: "rgba(100,116,139,0.12)" },
};

export const DURUM_CONFIG: Record<GorevDurumu, { label: string; color: string; bg: string; border: string }> = {
  yapilacak:   { label: "Yapılacak",   color: "#94a3b8", bg: "rgba(148,163,184,0.08)", border: "rgba(148,163,184,0.2)"  },
  devam:       { label: "Devam Ediyor", color: "#fbc024", bg: "rgba(251,192,36,0.08)",  border: "rgba(251,192,36,0.25)"  },
  tamamlandi:  { label: "Tamamlandı",  color: "#22c55e", bg: "rgba(34,197,94,0.08)",   border: "rgba(34,197,94,0.25)"   },
};

export const DURUM_SIRASI: GorevDurumu[] = ["yapilacak", "devam", "tamamlandi"];

export function sonTarihDurumu(iso: string) {
  const fark = trGunFarki(iso); // TR takvim günü — UTC saatten bağımsız
  if (fark < 0)  return { renk: "#ef4444", etiket: `${Math.abs(fark)}g gecikti` };
  if (fark === 0) return { renk: "#ef4444", etiket: "Bugün" };
  if (fark <= 2)  return { renk: "#fbc024", etiket: `${fark}g kaldı` };
  return { renk: "#94a3b8", etiket: trGoster(iso, "kisa") };
}
