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

const fmt = (n: number) => "₺" + (Math.abs(n) / 100).toLocaleString("tr-TR", { minimumFractionDigits: 2 });

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
  const aktifCL = checklist.filter(c => !c.silindi);

  if (aktifCL.length === 0)
    return { baslik: "Prosedürler", skor: 100, durum: "ok", metrik: "%100", metrikLabel: "Kontrol maddesi yok", uyariSayisi: 0 };

  const uyum     = uyumSkoru(aktifCL);
  const bekleyen = aktifCL.filter(c => c.otomatikKontrol ? !c.tamamlandi : isDue(c)).length;
  const uyumlu   = aktifCL.length - bekleyen;
  return {
    baslik:      "Prosedürler",
    skor:        uyum,
    durum:       uyum >= 75 ? "ok" : uyum >= 40 ? "warning" : "critical",
    metrik:      `%${uyum}`,
    metrikLabel: `${prosedurler.length} SOP · ${bekleyen} bekleyen · ${uyumlu}/${aktifCL.length} uyumlu`,
    uyariSayisi: bekleyen,
  };
}

/* ── Acil Durum Fonu ── */
export function acilFonSkoru(islemler: FonIslem[], hedefler: FonHedef[]): ModulSkoru {
  const aktif = hedefler.filter(h => !h.silindi);

  if (aktif.length === 0)
    return { baslik: "Acil Durum Fonu", skor: 0, durum: "critical", metrik: "₺0", metrikLabel: "Hedef eklenmedi", uyariSayisi: 1 };

  const temiz = islemler.filter(i => !i.silindi);

  // 1. Genel doluluk (0-100) — %40 ağırlık
  const toplamHedef  = aktif.reduce((s, h) => s + h.toplamHedefKurus, 0);
  const toplamMevcut = mevcutBirikim(temiz);
  const genelDoluluk = toplamHedef > 0 ? Math.min(100, (toplamMevcut / toplamHedef) * 100) : 0;

  // 2. Birikim disiplini — son 3 takvim ayında yatırma yapılmış mı? (0-100) — %30 ağırlık
  const simdi = new Date();
  let aktifAylar = 0;
  for (let i = 0; i < 3; i++) {
    const yil = simdi.getFullYear();
    const ay  = simdi.getMonth() - i;
    const varMi = temiz.some(is => {
      if (is.tip !== "yatirma") return false;
      const t = new Date(is.tarih);
      return t.getFullYear() === new Date(yil, ay, 1).getFullYear() &&
             t.getMonth()    === new Date(yil, ay, 1).getMonth();
    });
    if (varMi) aktifAylar++;
  }
  const birikimDisiplin = temiz.some(i => i.tip === "yatirma")
    ? (aktifAylar / 3) * 100
    : 0;

  // 3. Hedef sağlığı — aktif hedeflerin ortalama doluluk % (0-100) — %20 ağırlık
  const hedefOranlar = aktif.map(h => {
    const mev = mevcutBirikim(temiz, h.id);
    return h.toplamHedefKurus > 0 ? Math.min(100, (mev / h.toplamHedefKurus) * 100) : 0;
  });
  const hedefSagligi = hedefOranlar.length > 0
    ? hedefOranlar.reduce((s, o) => s + o, 0) / hedefOranlar.length
    : 0;

  // 4. Tamamlanan bonus — tamamlanmış hedef × 5, max 20 — %10 ağırlık
  const tamamlanan     = aktif.filter(h => mevcutBirikim(temiz, h.id) >= h.toplamHedefKurus).length;
  const tamamlananBonus = Math.min(20, tamamlanan * 5);

  const skor = Math.round(Math.max(0, Math.min(100,
    genelDoluluk    * 0.40 +
    birikimDisiplin * 0.30 +
    hedefSagligi    * 0.20 +
    tamamlananBonus * 0.10,
  )));

  return {
    baslik:      "Acil Durum Fonu",
    skor,
    durum:       skor >= 75 ? "ok" : skor >= 50 ? "warning" : "critical",
    metrik:      fmt(toplamMevcut),
    metrikLabel: toplamHedef > 0 ? `%${Math.round(genelDoluluk)} hedef doluluk` : "Hedef tutarı yok",
    uyariSayisi: skor < 50 ? 1 : 0,
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
