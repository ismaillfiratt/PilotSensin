/**
 * Borçlar veri modeli — vadeli ve taksitli ödemeler.
 *
 * Bir Borc bir veya daha fazla Taksit içerir.
 * Her taksit ayrı bir vade tarihi ve tutara sahip olabilir.
 * Ödeme yapıldığında nakit gider kaydı oluşturulur ve nakitIslemId bağlanır.
 */

import type { Kurus } from "@/lib/para";
import type { Silinebilir } from "@/lib/silinebilir";

export type BorcKaynak = "alim" | "manuel" | "vergi" | "kira" | "diger";

export interface Taksit {
  id:           string;
  siraNo:       number;          // 1, 2, 3...
  tutarKurus:   Kurus;
  vadeTarihi:   string;          // ISO date (YYYY-MM-DD)
  odendiAt:     string | null;   // ISO timestamp — null = bekliyor
  nakitIslemId: string | null;   // ödendiğinde oluşan nakit gider kaydının id'si
  not?:         string;          // ödeme notu (opsiyonel)
}

export interface Borc extends Silinebilir {
  id:               string;
  kaynak:           BorcKaynak;
  kaynakId?:        string;      // alimYap'in islemId'si gibi
  aciklama:         string;
  toplamTutarKurus: Kurus;
  paraBirimi:       string;      // "TRY"
  olusturmaTarihi:  string;      // ISO timestamp
  taksitler:        Taksit[];
}

/* ═══════════════════════════════════════════════════════
   Helper'lar
   ═══════════════════════════════════════════════════════ */

/** Bir borçtaki ödenmemiş tutar (kuruş) */
export function kalanBorc(borc: Borc): Kurus {
  return borc.taksitler
    .filter((t) => t.odendiAt === null)
    .reduce((toplam, t) => toplam + t.tutarKurus, 0);
}

/** Bir borçtaki ödenmiş tutar (kuruş) */
export function odenenTutar(borc: Borc): Kurus {
  return borc.taksitler
    .filter((t) => t.odendiAt !== null)
    .reduce((toplam, t) => toplam + t.tutarKurus, 0);
}

/** Borç tamamen ödendiyse true */
export function tamamenOdendi(borc: Borc): boolean {
  return borc.taksitler.every((t) => t.odendiAt !== null);
}

export type TaksitDurum = "odendi" | "bekliyor" | "yaklasiyor" | "gecikti";

/**
 * Taksitin durumunu döner.
 * - odendi: ödenmiş
 * - gecikti: vade geçmiş, ödenmemiş
 * - yaklasiyor: vade ≤ 3 gün
 * - bekliyor: vade > 3 gün
 */
export function taksitDurumu(t: Taksit, simdi: Date = new Date()): TaksitDurum {
  if (t.odendiAt) return "odendi";
  const vade = new Date(t.vadeTarihi);
  const farkMs = vade.getTime() - simdi.getTime();
  const farkGun = Math.ceil(farkMs / 86400000);
  if (farkGun < 0) return "gecikti";
  if (farkGun <= 3) return "yaklasiyor";
  return "bekliyor";
}

/** Bir borçtaki en yakın bekleyen taksitin vade tarihi (ISO date) — yoksa null */
export function siradakiVade(borc: Borc): string | null {
  const bekleyenler = borc.taksitler
    .filter((t) => t.odendiAt === null)
    .sort((a, b) => a.vadeTarihi.localeCompare(b.vadeTarihi));
  return bekleyenler[0]?.vadeTarihi ?? null;
}

/* ═══════════════════════════════════════════════════════
   Taksit oluşturma helper'ları
   ═══════════════════════════════════════════════════════ */

/**
 * Eşit aylık taksitler oluşturur.
 * Yuvarlama farkı ilk taksite eklenir (toplam doğru kalsın).
 *
 * @param toplamKurus     Toplam borç kuruş
 * @param taksitSayisi    Taksit sayısı (>= 1)
 * @param ilkVadeTarihi   İlk taksitin vade tarihi (ISO date YYYY-MM-DD)
 * @returns Taksit[] dizisi
 */
export function esitTaksitler(
  toplamKurus: Kurus,
  taksitSayisi: number,
  ilkVadeTarihi: string,
): Taksit[] {
  if (taksitSayisi < 1) return [];

  const taksitBasiKurus = Math.floor(toplamKurus / taksitSayisi);
  const fark = toplamKurus - (taksitBasiKurus * taksitSayisi);

  const taksitler: Taksit[] = [];
  const ilk = new Date(ilkVadeTarihi);

  for (let i = 0; i < taksitSayisi; i++) {
    const vade = new Date(ilk);
    vade.setMonth(vade.getMonth() + i);
    taksitler.push({
      id:           crypto.randomUUID(),
      siraNo:       i + 1,
      // Yuvarlama farkı ilk taksite eklenir
      tutarKurus:   i === 0 ? taksitBasiKurus + fark : taksitBasiKurus,
      vadeTarihi:   vade.toISOString().slice(0, 10),
      odendiAt:     null,
      nakitIslemId: null,
    });
  }

  return taksitler;
}

/**
 * Tek vadeli (vadeli) ödeme için tek taksit oluşturur.
 */
export function tekTaksit(toplamKurus: Kurus, vadeTarihi: string): Taksit[] {
  return [{
    id:           crypto.randomUUID(),
    siraNo:       1,
    tutarKurus:   toplamKurus,
    vadeTarihi,
    odendiAt:     null,
    nakitIslemId: null,
  }];
}

/* ═══════════════════════════════════════════════════════
   Toplu hesaplamalar (Borc[] üzerinden)
   ═══════════════════════════════════════════════════════ */

export interface BorclarOzet {
  aktifBorcSayisi:     number;
  toplamKalanKurus:    Kurus;
  toplamGecikenKurus:  Kurus;
  yaklasanTaksitSayisi: number;  // vade ≤ 3 gün, ödenmemiş
  gecikenTaksitSayisi:  number;
}

export function borclarOzet(borclar: Borc[], simdi: Date = new Date()): BorclarOzet {
  const aktif = borclar.filter((b) => !b.silindi && !tamamenOdendi(b));

  let toplamKalan = 0;
  let toplamGeciken = 0;
  let yaklasan = 0;
  let geciken = 0;

  for (const b of aktif) {
    for (const t of b.taksitler) {
      if (t.odendiAt) continue;
      toplamKalan += t.tutarKurus;
      const durum = taksitDurumu(t, simdi);
      if (durum === "gecikti") {
        toplamGeciken += t.tutarKurus;
        geciken++;
      } else if (durum === "yaklasiyor") {
        yaklasan++;
      }
    }
  }

  return {
    aktifBorcSayisi:      aktif.length,
    toplamKalanKurus:     toplamKalan,
    toplamGecikenKurus:   toplamGeciken,
    yaklasanTaksitSayisi: yaklasan,
    gecikenTaksitSayisi:  geciken,
  };
}
