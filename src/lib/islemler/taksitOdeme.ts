/**
 * taksitOdemeYap — Atomik taksit ödeme iş olayı.
 *
 * Akış:
 *   1. Borç ve taksit varlık kontrolü
 *   2. İdempotency — zaten ödendiyse veya nakit'te aynı islemId varsa atla
 *   3. Nakit gider kaydı (kasadan eksi)
 *   4. Taksiti "ödendi" işaretle + nakitIslemId bağla
 *
 * Tek seferlik tıklama → kasadan düş + taksit kapan.
 */

import { useNakit }   from "@/store/nakit";
import { useBorclar } from "@/store/borclar";
import { yazabilir, yetkiYok } from "./yetki";
import type { IslemSonuc } from "./types";

export interface TaksitOdemeGirdi {
  borcId:        string;
  taksitId:      string;
  /** Hangi ödeme yöntemiyle ödendi? */
  odemeYontemi:  "nakit" | "kart" | "havale" | "cek";
  /** Opsiyonel ödeme tarihi (ISO). Verilmezse şimdiki zaman. */
  tarih?:        string;
  /** Opsiyonel ödeme notu (örn. "Mehmet Bey EFT yaptı") */
  not?:          string;
  /** Caller'dan idempotency anahtarı (opsiyonel) */
  islemId?:      string;
}

export async function taksitOdemeYap(girdi: TaksitOdemeGirdi): Promise<IslemSonuc> {
  if (!yazabilir()) return yetkiYok("taksitOdemeYap");

  const islemId = girdi.islemId ?? crypto.randomUUID();
  const tarih   = girdi.tarih   ?? new Date().toISOString();

  // ── 1. Borç ve taksit varlık kontrolü ────────────────────────────
  const borc = useBorclar.getState().borclar.find((b) => b.id === girdi.borcId);
  if (!borc) {
    return { basarili: false, islemId, hata: `Borç bulunamadı: ${girdi.borcId}` };
  }
  if (borc.silindi) {
    return { basarili: false, islemId, hata: "Silinmiş borca ödeme yapılamaz" };
  }
  const taksit = borc.taksitler.find((t) => t.id === girdi.taksitId);
  if (!taksit) {
    return { basarili: false, islemId, hata: `Taksit bulunamadı: ${girdi.taksitId}` };
  }

  // ── 2. İdempotency ──────────────────────────────────────────────
  if (taksit.odendiAt) {
    return { basarili: true, islemId }; // zaten ödenmiş
  }
  if (useNakit.getState().islemler.some((i) => i.islemId === islemId)) {
    return { basarili: true, islemId }; // nakit kaydı zaten var
  }

  try {
    // ── 3. Nakit gider kaydı ──────────────────────────────────────
    const aciklamaParts = [borc.aciklama, `Taksit ${taksit.siraNo}/${borc.taksitler.length}`];
    if (girdi.not) aciklamaParts.push(`(${girdi.not})`);

    await useNakit.getState().ekle({
      tip:          "gider",
      tutarKurus:   taksit.tutarKurus,
      kategori:     "Vadeli Ödeme",
      aciklama:     aciklamaParts.join(" — "),
      tarih,
      odemeYontemi: girdi.odemeYontemi,
      islemId,
    });

    // ── 4. Taksiti ödendi işaretle ────────────────────────────────
    await useBorclar.getState().taksitOde(borc.id, taksit.id, islemId);

    return { basarili: true, islemId };

  } catch (hata) {
    const mesaj = hata instanceof Error ? hata.message : String(hata);
    console.error("[taksitOdemeYap] hata:", mesaj);
    return { basarili: false, islemId, hata: mesaj };
  }
}

/**
 * taksitOdemeGeriAl — bir ödenmiş taksiti geri al.
 * Bağlı nakit gider kaydını siler ve taksiti tekrar bekleyene çevirir.
 */
export async function taksitOdemeGeriAl(borcId: string, taksitId: string): Promise<IslemSonuc> {
  if (!yazabilir()) return yetkiYok("taksitOdemeGeriAl");

  const borc = useBorclar.getState().borclar.find((b) => b.id === borcId);
  if (!borc) return { basarili: false, islemId: "", hata: "Borç bulunamadı" };
  const taksit = borc.taksitler.find((t) => t.id === taksitId);
  if (!taksit) return { basarili: false, islemId: "", hata: "Taksit bulunamadı" };
  if (!taksit.odendiAt) return { basarili: true, islemId: "" }; // zaten bekliyor

  const islemId = taksit.nakitIslemId ?? "";

  try {
    // Bağlı nakit kaydını sil (varsa)
    if (taksit.nakitIslemId) {
      const nakitKaydi = useNakit.getState().islemler.find((i) => i.islemId === taksit.nakitIslemId);
      if (nakitKaydi) {
        await useNakit.getState().sil(nakitKaydi.id);
      }
    }
    // Taksiti tekrar bekleyene çevir
    await useBorclar.getState().taksitGeriAl(borcId, taksitId);
    return { basarili: true, islemId };
  } catch (hata) {
    const mesaj = hata instanceof Error ? hata.message : String(hata);
    return { basarili: false, islemId, hata: mesaj };
  }
}
