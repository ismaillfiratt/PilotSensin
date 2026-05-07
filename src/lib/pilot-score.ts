import type { Islem }       from "./nakit-data";
import type { Gorev }       from "./gorev-data";
import type { Urun }        from "./stok-data";
import type { Prosedur, ChecklistItem } from "./prosedur-data";
import type { FonIslem, FonAyar }      from "./acil-fon-data";
import { stokDurumu }       from "./stok-data";
import { mevcutBirikim }    from "./acil-fon-data";

export interface ModulSkoru {
  baslik:      string;
  skor:        number;
  durum:       "ok" | "warning" | "critical";
  metrik:      string;
  metrikLabel: string;
  uyariSayisi: number;
}

/* ── Nakit Akışı skoru ── */
export function nakitSkoru(islemler: Islem[]): ModulSkoru {
  const gelir = islemler.filter((i) => i.tip === "gelir").reduce((s, i) => s + i.tutar, 0);
  const gider = islemler.filter((i) => i.tip === "gider").reduce((s, i) => s + i.tutar, 0);
  const net   = gelir - gider;

  let skor = 50;
  if (gelir > 0) {
    const oran = net / gelir; // -1 ile 1 arası
    skor = Math.round(Math.min(100, Math.max(0, 50 + oran * 50)));
  }

  const durum: "ok" | "warning" | "critical" =
    skor >= 75 ? "ok" : skor >= 45 ? "warning" : "critical";

  const formatTL = (n: number) => "₺" + Math.abs(n).toLocaleString("tr-TR");

  return {
    baslik: "Nakit Akışı",
    skor,
    durum,
    metrik:      formatTL(net),
    metrikLabel: net >= 0 ? "Net akış (pozitif)" : "Net akış (negatif)",
    uyariSayisi: net < 0 ? 2 : net < gelir * 0.1 ? 1 : 0,
  };
}

/* ── Görevler skoru ── */
export function gorevSkoru(gorevler: Gorev[]): ModulSkoru {
  if (gorevler.length === 0) return { baslik: "Görevler", skor: 100, durum: "ok", metrik: "0", metrikLabel: "Görev yok", uyariSayisi: 0 };

  const tamamlanan = gorevler.filter((g) => g.durum === "tamamlandi").length;
  const acik       = gorevler.filter((g) => g.durum !== "tamamlandi").length;
  const gecikmiş   = gorevler.filter((g) => g.durum !== "tamamlandi" && new Date(g.sonTarih) < new Date()).length;
  const acilAcik   = gorevler.filter((g) => g.durum !== "tamamlandi" && g.oncelik === "acil").length;

  // Tamamlama: 60 puan, Zamanındalık: 30 puan, Baz: 10 puan
  const tamamPuan  = (tamamlanan / gorevler.length) * 60;
  const gecikOran  = gecikmiş / Math.max(1, acik);
  const zamanPuan  = (1 - gecikOran) * 30;
  const acilCeza   = Math.min(10, acilAcik * 3);
  const skor       = Math.round(Math.max(0, tamamPuan + zamanPuan - acilCeza + 10));

  return {
    baslik: "Görevler",
    skor,
    durum: skor >= 70 ? "ok" : skor >= 45 ? "warning" : "critical",
    metrik:      String(acik),
    metrikLabel: gecikmiş > 0 ? `${gecikmiş} gecikmiş görev` : "Açık görev",
    uyariSayisi: gecikmiş + acilAcik,
  };
}

/* ── Stok skoru ── */
export function stokSkoru(urunler: Urun[]): ModulSkoru {
  if (urunler.length === 0) return { baslik: "Stok Yönetimi", skor: 100, durum: "ok", metrik: "0", metrikLabel: "Ürün yok", uyariSayisi: 0 };

  const kritikler = urunler.filter((u) => stokDurumu(u) === "kritik").length;
  const uyarilar  = urunler.filter((u) => stokDurumu(u) === "uyari").length;
  const olular    = urunler.filter((u) => stokDurumu(u) === "olu").length;

  const kritikOran = kritikler / urunler.length;
  const uyariOran  = uyarilar  / urunler.length;

  const skor = Math.round(Math.max(0, 100 - kritikOran * 60 - uyariOran * 20 - (olular > 0 ? 10 : 0)));

  return {
    baslik: "Stok Yönetimi",
    skor,
    durum: skor >= 75 ? "ok" : skor >= 50 ? "warning" : "critical",
    metrik:      String(kritikler),
    metrikLabel: "Kritik stok kalemi",
    uyariSayisi: kritikler + uyarilar,
  };
}

/* ── Prosedürler skoru ── */
export function prosedurSkoru(prosedurler: Prosedur[], checklist: ChecklistItem[]): ModulSkoru {
  if (prosedurler.length === 0 && checklist.length === 0) {
    return { baslik: "Prosedürler", skor: 0, durum: "critical", metrik: "%0", metrikLabel: "Prosedür eklenmedi", uyariSayisi: 0 };
  }
  const tamamlanan  = checklist.filter((c) => c.tamamlandi).length;
  const toplamCheck = checklist.length;
  const checkOran   = toplamCheck > 0 ? tamamlanan / toplamCheck : 1;
  const skor        = Math.round(checkOran * 100);
  return {
    baslik:      "Prosedürler",
    skor,
    durum:       skor >= 75 ? "ok" : skor >= 40 ? "warning" : "critical",
    metrik:      `%${skor}`,
    metrikLabel: `${prosedurler.length} prosedür · ${tamamlanan}/${toplamCheck} kontrol`,
    uyariSayisi: toplamCheck - tamamlanan,
  };
}

/* ── Acil Durum Fonu skoru ── */
export function acilFonSkoru(islemler: FonIslem[], ayar: FonAyar): ModulSkoru {
  const mevcut = mevcutBirikim(islemler);
  const hedef  = ayar.hedef;
  const oran   = hedef > 0 ? Math.min(1, mevcut / hedef) : 0;
  const skor   = Math.round(oran * 100);
  const formatTL = (n: number) => "₺" + n.toLocaleString("tr-TR");
  return {
    baslik:      "Acil Durum Fonu",
    skor,
    durum:       skor >= 80 ? "ok" : skor >= 40 ? "warning" : "critical",
    metrik:      formatTL(mevcut),
    metrikLabel: `Hedef: ${formatTL(hedef)}`,
    uyariSayisi: skor < 40 ? 1 : 0,
  };
}

/* ── Genel Pilot Skoru (ağırlıklı ortalama) ── */
export function pilotSkoru(modüller: ModulSkoru[]): number {
  if (modüller.length === 0) return 0;
  const agirliklar: Record<string, number> = {
    "Nakit Akışı":      0.30,
    "Görevler":         0.20,
    "Stok Yönetimi":    0.20,
    "Prosedürler":      0.15,
    "Acil Durum Fonu":  0.15,
  };
  let toplam = 0; let agirlik = 0;
  modüller.forEach((m) => {
    const a = agirliklar[m.baslik] ?? (1 / modüller.length);
    toplam  += m.skor * a;
    agirlik += a;
  });
  return Math.round(toplam / agirlik);
}
