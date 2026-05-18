/**
 * Olay-anlık bildirim fabrikası — saf fonksiyonlar.
 * Her fonksiyon koşul sağlanırsa Bildirim nesnesi, sağlanmazsa null döner.
 * tarih/okundu store'un ekle() metodunda set edilir.
 */

import type { Bildirim } from "@/store/bildirimler";
import type { Urun }     from "@/lib/stok-data";
import type { SatisKaydi } from "@/store/satislar";
import type { Kurus }    from "@/lib/para";
import { formatTL }      from "@/lib/para";
import {
  YUKSEK_TUTAR_ESIK_KURUS,
  COPILOT_BUYUK_ISLEM_KURUS,
  STOK_FIRE_ESIK_ADET,
} from "./esikler";

function yeni(b: Omit<Bildirim, "tarih" | "okundu">): Bildirim {
  return { ...b, tarih: new Date().toISOString(), okundu: false };
}

/* ─── Satış ────────────────────────────────────────────────────────── */

export function satisAnlikBildirim(p: {
  urunAd:         string;
  adet:           number;
  kasaGirisKurus: Kurus;
  yapanRol:       "pilot" | "copilot";
  islemId:        string;
}): Bildirim | null {
  const buyukSatis   = p.kasaGirisKurus >= YUKSEK_TUTAR_ESIK_KURUS;
  const copilotBuyuk = p.yapanRol === "copilot" && p.kasaGirisKurus >= COPILOT_BUYUK_ISLEM_KURUS;
  if (!buyukSatis && !copilotBuyuk) return null;

  return yeni({
    id:         crypto.randomUUID(),
    tip:        copilotBuyuk && !buyukSatis ? "uyari" : "bilgi",
    modul:      "kar-zarar",
    baslik:     copilotBuyuk ? "Co-Pilot Büyük Satış" : "Yüksek Tutarlı Satış",
    mesaj:      `${p.urunAd} × ${p.adet} — ${formatTL(p.kasaGirisKurus)}`,
    hedef:      "pilot",
    kaynak:     "olay",
    olayId:     p.islemId,
    ilgiliLink: "/kar-zarar",
    sesCal:     copilotBuyuk,
    pushGonder: copilotBuyuk,
  });
}

/* ─── Stok ─────────────────────────────────────────────────────────── */

export function stokTukendiBildirim(urun: Urun, islemId: string): Bildirim {
  return yeni({
    id:         crypto.randomUUID(),
    tip:        "kritik",
    modul:      "stok",
    baslik:     "Ürün Tükendi",
    mesaj:      `${urun.ad} stoğu sıfırlandı.`,
    hedef:      "herkes",
    kaynak:     "olay",
    olayId:     islemId,
    ilgiliLink: "/stok",
    sesCal:     true,
    pushGonder: true,
  });
}

export function stokKritikBildirim(urun: Urun, islemId: string): Bildirim {
  return yeni({
    id:         crypto.randomUUID(),
    tip:        "kritik",
    modul:      "stok",
    baslik:     "Kritik Stok Uyarısı",
    mesaj:      `${urun.ad} kritik seviyenin altına düştü (${urun.mevcutAdet} ${urun.birim}).`,
    hedef:      "herkes",
    kaynak:     "olay",
    olayId:     islemId,
    ilgiliLink: "/stok",
    sesCal:     true,
    pushGonder: false,
  });
}

export function stokDuzeltmeFireBildirim(urun: Urun, fireAdet: number): Bildirim | null {
  if (fireAdet < STOK_FIRE_ESIK_ADET) return null;
  return yeni({
    id:         crypto.randomUUID(),
    tip:        "uyari",
    modul:      "stok",
    baslik:     "Yüksek Stok Firesi",
    mesaj:      `${urun.ad}: ${fireAdet} ${urun.birim} fire kaydedildi.`,
    hedef:      "pilot",
    kaynak:     "olay",
    ilgiliLink: "/stok",
    sesCal:     false,
    pushGonder: false,
  });
}

/* ─── İşlemler ─────────────────────────────────────────────────────── */

export function iadeBildirim(orijinalSatis: SatisKaydi): Bildirim {
  return yeni({
    id:         crypto.randomUUID(),
    tip:        "uyari",
    modul:      "kar-zarar",
    baslik:     "Satış İadesi",
    mesaj:      `${orijinalSatis.urunAd} × ${orijinalSatis.adet} iade alındı — ${formatTL(orijinalSatis.kasaGirisKurus)}`,
    hedef:      "pilot",
    kaynak:     "olay",
    olayId:     orijinalSatis.islemId,
    ilgiliLink: "/kar-zarar",
    sesCal:     false,
    pushGonder: false,
  });
}

export function vadeliSatisBildirim(p: {
  urunAd:         string;
  kasaGirisKurus: Kurus;
  islemId:        string;
}): Bildirim {
  return yeni({
    id:         crypto.randomUUID(),
    tip:        "bilgi",
    modul:      "kar-zarar",
    baslik:     "Vadeli Satış",
    mesaj:      `${p.urunAd} — ${formatTL(p.kasaGirisKurus)} vadeli kaydedildi (kasaya girmedi).`,
    hedef:      "pilot",
    kaynak:     "olay",
    olayId:     p.islemId,
    ilgiliLink: "/kar-zarar",
    sesCal:     false,
    pushGonder: false,
  });
}

export function buyukGiderBildirim(
  gider:    { kategori: string; tutarKurus: Kurus },
  yapanRol: "pilot" | "copilot",
): Bildirim | null {
  if (gider.tutarKurus < COPILOT_BUYUK_ISLEM_KURUS) return null;
  if (yapanRol !== "copilot") return null;
  return yeni({
    id:         crypto.randomUUID(),
    tip:        "uyari",
    modul:      "nakit-akisi",
    baslik:     "Co-Pilot Büyük Gider",
    mesaj:      `${gider.kategori} — ${formatTL(gider.tutarKurus)} tutarında gider kaydedildi.`,
    hedef:      "pilot",
    kaynak:     "olay",
    ilgiliLink: "/nakit-akisi",
    sesCal:     true,
    pushGonder: true,
  });
}

export function kasaMinAltiBildirim(yeniBakiyeKurus: Kurus, esikKurus: Kurus): Bildirim {
  return yeni({
    id:         crypto.randomUUID(),
    tip:        "kritik",
    modul:      "nakit-akisi",
    baslik:     "Kasa Minimum Altında",
    mesaj:      `Kasa bakiyesi ${formatTL(yeniBakiyeKurus)} — belirlenen eşik (${formatTL(esikKurus)}) altında.`,
    hedef:      "pilot",
    kaynak:     "olay",
    ilgiliLink: "/nakit-akisi",
    sesCal:     true,
    pushGonder: false,
  });
}

/* ─── Sistem / Güvenlik ─────────────────────────────────────────────── */

export function sistemHatasiBildirim(islem: string, mesaj: string): Bildirim {
  return yeni({
    id:         crypto.randomUUID(),
    tip:        "kritik",
    modul:      "sistem",
    baslik:     "Kayıt Hatası",
    mesaj:      `${islem}: ${mesaj}`,
    hedef:      "herkes",
    kaynak:     "sistem",
    sesCal:     false,
    pushGonder: false,
  });
}

export function yetkiIhlaliBildirim(yapanEmail: string, denenenIslem: string): Bildirim {
  return yeni({
    id:         crypto.randomUUID(),
    tip:        "uyari",
    modul:      "ekip",
    baslik:     "Yetkisiz İşlem Girişimi",
    mesaj:      `${yapanEmail} — "${denenenIslem}" işlemi için yetki gerekiyor.`,
    hedef:      "pilot",
    kaynak:     "olay",
    ilgiliLink: "/ayarlar",
    sesCal:     false,
    pushGonder: false,
  });
}
