import type { Islem }                from "./nakit-data";
import type { Gorev }                from "./gorev-data";
import type { Urun }                 from "./stok-data";
import type { Prosedur, ChecklistItem } from "./prosedur-data";
import type { FonIslem, FonHedef }  from "./acil-fon-data";
import type { SatisKaydi }          from "@/store/satislar";
import type { GiderItem }           from "@/lib/db";
import { stokDurumu }                from "./stok-data";
import { mevcutBirikim }             from "./acil-fon-data";
import { uyumSkoru, isDue }          from "./prosedur-data";

export interface ModulSkoru {
  baslik:      string;
  skor:        number;
  durum:       "ok" | "warning" | "critical";
  metrik:      string;
  metrikLabel: string;
  uyariSayisi: number;
}

const fmt = (n: number) => "₺" + Math.abs(n).toLocaleString("tr-TR");

/* ── Nakit Akışı ── */
export function nakitSkoru(islemler: Islem[]): ModulSkoru {
  if (islemler.length === 0)
    return { baslik: "Nakit Akışı", skor: 100, durum: "ok", metrik: "₺0", metrikLabel: "İşlem eklenmedi", uyariSayisi: 0 };

  const gelir = islemler.filter((i) => i.tip === "gelir").reduce((s, i) => s + i.tutarKurus, 0);
  const gider = islemler.filter((i) => i.tip === "gider").reduce((s, i) => s + i.tutarKurus, 0);
  const net   = gelir - gider;
  let skor = 50;
  if (gelir > 0) skor = Math.round(Math.min(100, Math.max(0, 50 + (net / gelir) * 50)));

  return {
    baslik:      "Nakit Akışı",
    skor,
    durum:       skor >= 75 ? "ok" : skor >= 45 ? "warning" : "critical",
    metrik:      fmt(net),
    metrikLabel: net >= 0 ? "Net akış (pozitif)" : "Net akış (negatif)",
    uyariSayisi: net < 0 ? 2 : net < gelir * 0.1 ? 1 : 0,
  };
}

/* ── Görevler ── */
export function gorevSkoru(gorevler: Gorev[]): ModulSkoru {
  if (gorevler.length === 0)
    return { baslik: "Görevler", skor: 100, durum: "ok", metrik: "0", metrikLabel: "Görev eklenmedi", uyariSayisi: 0 };

  const tamamlanan = gorevler.filter((g) => g.durum === "tamamlandi").length;
  const acik       = gorevler.filter((g) => g.durum !== "tamamlandi").length;
  const gecikmiş   = gorevler.filter((g) => g.durum !== "tamamlandi" && new Date(g.sonTarih) < new Date()).length;
  const acilAcik   = gorevler.filter((g) => g.durum !== "tamamlandi" && g.oncelik === "acil").length;

  const tamamPuan = (tamamlanan / gorevler.length) * 60;
  const gecikOran = gecikmiş / Math.max(1, acik);
  const zamanPuan = (1 - gecikOran) * 30;
  const acilCeza  = Math.min(10, acilAcik * 3);
  const skor      = Math.round(Math.max(0, tamamPuan + zamanPuan - acilCeza + 10));

  return {
    baslik:      "Görevler",
    skor,
    durum:       skor >= 70 ? "ok" : skor >= 45 ? "warning" : "critical",
    metrik:      String(acik),
    metrikLabel: gecikmiş > 0 ? `${gecikmiş} gecikmiş görev` : "Açık görev",
    uyariSayisi: gecikmiş + acilAcik,
  };
}

/* ── Stok ── */
export function stokSkoru(urunler: Urun[]): ModulSkoru {
  if (urunler.length === 0)
    return { baslik: "Stok Yönetimi", skor: 100, durum: "ok", metrik: "0", metrikLabel: "Ürün eklenmedi", uyariSayisi: 0 };

  const kritikler  = urunler.filter((u) => stokDurumu(u) === "kritik").length;
  const uyarilar   = urunler.filter((u) => stokDurumu(u) === "uyari").length;
  const olular     = urunler.filter((u) => stokDurumu(u) === "olu").length;
  const kritikOran = kritikler / urunler.length;
  const uyariOran  = uyarilar  / urunler.length;
  const skor       = Math.round(Math.max(0, 100 - kritikOran * 60 - uyariOran * 20 - (olular > 0 ? 10 : 0)));

  return {
    baslik:      "Stok Yönetimi",
    skor,
    durum:       skor >= 75 ? "ok" : skor >= 50 ? "warning" : "critical",
    metrik:      String(kritikler),
    metrikLabel: "Kritik stok kalemi",
    uyariSayisi: kritikler + uyarilar,
  };
}

/* ── Prosedürler ── */
export function prosedurSkoru(prosedurler: Prosedur[], checklist: ChecklistItem[]): ModulSkoru {
  if (prosedurler.length === 0 && checklist.length === 0)
    return { baslik: "Prosedürler", skor: 100, durum: "ok", metrik: "%100", metrikLabel: "Prosedür eklenmedi", uyariSayisi: 0 };

  const uyum      = uyumSkoru(checklist);
  const bekleyen  = checklist.filter(c => isDue(c)).length;
  return {
    baslik:      "Prosedürler",
    skor:        uyum,
    durum:       uyum >= 75 ? "ok" : uyum >= 40 ? "warning" : "critical",
    metrik:      `%${uyum}`,
    metrikLabel: `${prosedurler.length} SOP · ${bekleyen} bekleyen kontrol`,
    uyariSayisi: bekleyen,
  };
}

/* ── Acil Durum Fonu ── */
export function acilFonSkoru(islemler: FonIslem[], hedefler: FonHedef[]): ModulSkoru {
  if (hedefler.length === 0)
    return { baslik: "Acil Durum Fonu", skor: 100, durum: "ok", metrik: "₺0", metrikLabel: "Hedef eklenmedi", uyariSayisi: 0 };

  if (islemler.length === 0)
    return { baslik: "Acil Durum Fonu", skor: 0, durum: "critical", metrik: "₺0", metrikLabel: "Birikim eklenmedi", uyariSayisi: 1 };

  const toplamHedefKurus = hedefler.reduce((s, h) => s + h.toplamHedefKurus, 0);
  const mevcut = mevcutBirikim(islemler);
  const oran   = toplamHedefKurus > 0 ? Math.min(1, mevcut / toplamHedefKurus) : 0;
  const skor   = Math.round(oran * 100);
  return {
    baslik:      "Acil Durum Fonu",
    skor,
    durum:       skor >= 80 ? "ok" : skor >= 40 ? "warning" : "critical",
    metrik:      fmt(mevcut),
    metrikLabel: `Toplam hedef: ${fmt(toplamHedefKurus)}`,
    uyariSayisi: skor < 40 ? 1 : 0,
  };
}

/* ── Kâr-Zarar ── */
export function karZararSkoru(kayitlar: SatisKaydi[], giderler: GiderItem[]): ModulSkoru {
  const simdi  = new Date();
  const ayBasi = new Date(simdi.getFullYear(), simdi.getMonth(), 1);

  const buAy = kayitlar.filter((k) => !k.iadeEdildi && new Date(k.tarih) >= ayBasi);

  if (buAy.length === 0 && giderler.length === 0)
    return { baslik: "Kâr-Zarar", skor: 100, durum: "ok", metrik: "—", metrikLabel: "Veri girilmedi", uyariSayisi: 0 };

  const ciro        = buAy.reduce((t, k) => t + k.toplamCiroKurus, 0);
  const smm         = buAy.reduce((t, k) => t + k.birimAlisFiyatiKurus * k.adet, 0);
  const brutKarKurus     = ciro - smm;
  const toplamGider = giderler.reduce((t, g) => t + g.tutarKurus, 0);
  const netKar      = brutKarKurus - toplamGider;
  const netMarj     = ciro > 0 ? netKar / ciro : 0;

  // Skor: %25 marj = 100 puan, 0% = 50, negatif = 0–50 arası
  const skor = ciro === 0
    ? (netKar >= 0 ? 50 : 20)
    : Math.round(Math.min(100, Math.max(0, 50 + netMarj * 200)));

  return {
    baslik:      "Kâr-Zarar",
    skor,
    durum:       skor >= 70 ? "ok" : skor >= 40 ? "warning" : "critical",
    metrik:      fmt(netKar),
    metrikLabel: ciro > 0
      ? `%${(netMarj * 100).toFixed(1)} net marj`
      : netKar < 0 ? "Zarar" : "Veri az",
    uyariSayisi: netKar < 0 ? 2 : netMarj < 0.05 ? 1 : 0,
  };
}

/* ── Genel Pilot Skoru ── */
export function pilotSkoru(modüller: ModulSkoru[]): number {
  if (modüller.length === 0) return 100;
  const agirliklar: Record<string, number> = {
    "Nakit Akışı":     0.25,
    "Kâr-Zarar":       0.25,
    "Görevler":        0.15,
    "Stok Yönetimi":   0.15,
    "Prosedürler":     0.10,
    "Acil Durum Fonu": 0.10,
  };
  let toplam = 0; let agirlik = 0;
  modüller.forEach((m) => {
    const a = agirliklar[m.baslik] ?? (1 / modüller.length);
    toplam  += m.skor * a;
    agirlik += a;
  });
  return Math.round(toplam / agirlik);
}
