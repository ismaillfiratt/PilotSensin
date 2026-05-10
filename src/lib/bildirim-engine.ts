/**
 * Akıllı Bildirim Motoru
 * Her tetikleyici, mevcut bildirimlere bakarak dedup yapar ve gruplandırır.
 * Stable günlük ID = tür + tarih → aynı gün aynı tür yalnızca bir kez eklenir.
 */

import type { Urun }          from "./stok-data";
import type { Islem }         from "./nakit-data";
import type { ChecklistItem } from "./prosedur-data";
import type { Gorev }         from "./gorev-data";
import type { Bildirim }      from "@/store/bildirimler";
import { stokDurumu }         from "./stok-data";
import { isDue }              from "./prosedur-data";
import { trBugun }            from "./tarih";

export type YeniBildirim = Omit<Bildirim, "tarih" | "okundu">;

/* Günlük sabit ID — aynı gün ikinci kez oluşmaz */
function gid(tip: string) { return `${tip}__${trBugun()}`; }

/* Zaten eklenmiş mi? */
function varMi(id: string, mevcutlar: Bildirim[]) {
  return mevcutlar.some((b) => b.id === id);
}

/* Para formatı */
const tl = (n: number) => `₺${Math.round(n).toLocaleString("tr-TR")}`;

/* ─── 1. STOK TETİKLEYİCİ ─────────────────────────────────────────── */
export function stokTetikle(urunler: Urun[], mevcutlar: Bildirim[]): YeniBildirim[] {
  const sonuc: YeniBildirim[] = [];

  const kritikler = urunler.filter((u) => stokDurumu(u) === "kritik");
  const uyarilar  = urunler.filter((u) => stokDurumu(u) === "uyari");

  if (kritikler.length > 0 && !varMi(gid("stok-kritik"), mevcutlar)) {
    sonuc.push({
      id:          gid("stok-kritik"),
      tip:         "kritik",
      modul:       "stok",
      baslik:      "Kritik Stok Seviyesi",
      mesaj:       kritikler.length === 1
        ? `"${kritikler[0].ad}" kritik stokta — ${kritikler[0].mevcutAdet} ${kritikler[0].birim} kaldı`
        : `${kritikler.length} ürün kritik stok seviyesinde (${kritikler.map((u) => u.ad).slice(0, 2).join(", ")}${kritikler.length > 2 ? "…" : ""})`,
      ilgiliLink:  "/stok",
    });
  }

  if (uyarilar.length > 0 && !varMi(gid("stok-uyari"), mevcutlar)) {
    sonuc.push({
      id:          gid("stok-uyari"),
      tip:         "uyari",
      modul:       "stok",
      baslik:      "Stok Uyarısı",
      mesaj:       uyarilar.length === 1
        ? `"${uyarilar[0].ad}" emniyet stoğunun altına indi`
        : `${uyarilar.length} ürün emniyet stoğunun altında`,
      ilgiliLink:  "/stok",
    });
  }

  return sonuc;
}

/* ─── 2. NAKİT AKIŞI TETİKLEYİCİ ─────────────────────────────────── */
export function nakitTetikle(islemler: Islem[], mevcutlar: Bildirim[]): YeniBildirim[] {
  const sonuc: YeniBildirim[] = [];
  if (islemler.length === 0) return sonuc;

  // Son 7 günün özeti
  const yediGunOnce = Date.now() - 7 * 86400000;
  const son7 = islemler.filter((i) => new Date(i.tarih).getTime() >= yediGunOnce);
  const gelir = son7.filter((i) => i.tip === "gelir").reduce((s, i) => s + i.tutar, 0);
  const gider = son7.filter((i) => i.tip === "gider").reduce((s, i) => s + i.tutar, 0);

  if (gider > gelir && !varMi(gid("nakit-negatif"), mevcutlar)) {
    const fark = gider - gelir;
    sonuc.push({
      id:          gid("nakit-negatif"),
      tip:         "kritik",
      modul:       "nakit-akisi",
      baslik:      "Negatif Nakit Akışı",
      mesaj:       `Son 7 günde giderler gelirden ${tl(fark)} fazla`,
      ilgiliLink:  "/nakit-akisi",
    });
  }

  // Günlük gelir ortalaması düşükse uyarı
  const gunlukGelirOrt = gelir / 7;
  const gunlukGiderOrt = gider / 7;
  if (gunlukGelirOrt > 0 && gunlukGiderOrt > gunlukGelirOrt * 1.5 && !varMi(gid("nakit-yuksek-gider"), mevcutlar)) {
    sonuc.push({
      id:          gid("nakit-yuksek-gider"),
      tip:         "uyari",
      modul:       "nakit-akisi",
      baslik:      "Yüksek Gider Oranı",
      mesaj:       `Günlük gider ortalaması (${tl(gunlukGiderOrt)}) gelirin %50 üzerinde`,
      ilgiliLink:  "/nakit-akisi",
    });
  }

  return sonuc;
}

/* ─── 3. SOP / CHECKLİST TETİKLEYİCİ ─────────────────────────────── */
export function sopTetikle(checklist: ChecklistItem[], mevcutlar: Bildirim[]): YeniBildirim[] {
  const sonuc: YeniBildirim[] = [];

  // Sadece gün sonuna 2 saat kala tetikle (16:00 – 23:59)
  const saat = new Date().getHours();
  if (saat < 16) return sonuc;

  const bekleyenler = checklist.filter((c) => isDue(c) && !c.tamamlandi);
  if (bekleyenler.length > 0 && !varMi(gid("sop-bekleyen"), mevcutlar)) {
    sonuc.push({
      id:         gid("sop-bekleyen"),
      tip:        "uyari",
      modul:      "prosedurler",
      baslik:     "Tamamlanmamış Kontrol Maddeleri",
      mesaj:      bekleyenler.length === 1
        ? `"${bekleyenler[0].baslik}" kontrol maddesi bugün yapılmadı`
        : `${bekleyenler.length} kontrol maddesi bugün tamamlanmadı`,
      ilgiliLink: "/prosedurler",
    });
  }

  return sonuc;
}

/* ─── 4. GÖREV TETİKLEYİCİ ─────────────────────────────────────────── */
export function gorevTetikle(gorevler: Gorev[], mevcutlar: Bildirim[]): YeniBildirim[] {
  const sonuc: YeniBildirim[] = [];
  const simdi = new Date();

  const gecikmiş = gorevler.filter(
    (g) => g.durum !== "tamamlandi" && new Date(g.sonTarih) < simdi
  );

  if (gecikmiş.length > 0 && !varMi(gid("gorev-gecik"), mevcutlar)) {
    sonuc.push({
      id:         gid("gorev-gecik"),
      tip:        "kritik",
      modul:      "gorevler",
      baslik:     "Gecikmiş Görevler",
      mesaj:      gecikmiş.length === 1
        ? `"${gecikmiş[0].baslik}" görevi gecikti`
        : `${gecikmiş.length} görev gecikmiş durumda`,
      ilgiliLink: "/gorevler",
    });
  }

  // Bugün son tarihli acil görevler
  const gunBasi = new Date(); gunBasi.setHours(0, 0, 0, 0);
  const gunSonu = new Date(); gunSonu.setHours(23, 59, 59, 999);
  const bugunAcil = gorevler.filter(
    (g) =>
      g.durum !== "tamamlandi" &&
      g.oncelik === "acil" &&
      new Date(g.sonTarih) >= gunBasi &&
      new Date(g.sonTarih) <= gunSonu
  );

  if (bugunAcil.length > 0 && !varMi(gid("gorev-bugun-acil"), mevcutlar)) {
    sonuc.push({
      id:         gid("gorev-bugun-acil"),
      tip:        "uyari",
      modul:      "gorevler",
      baslik:     "Bugün Biten Acil Görev",
      mesaj:      bugunAcil.length === 1
        ? `"${bugunAcil[0].baslik}" bugün tamamlanmalı`
        : `${bugunAcil.length} acil görev bugün bitiyor`,
      ilgiliLink: "/gorevler",
    });
  }

  return sonuc;
}

/* ─── 5. GÜNLÜK ÖZET TETİKLEYİCİ ───────────────────────────────────── */
export function gunlukOzetTetikle(
  gorevler: Gorev[],
  islemler: Islem[],
  mevcutlar: Bildirim[]
): YeniBildirim[] {
  const sonuc: YeniBildirim[] = [];

  // Sadece sabah 08:00–11:00 arası tetikle
  const saat = new Date().getHours();
  if (saat < 8 || saat > 11) return sonuc;

  const id = gid("gunluk-ozet");
  if (varMi(id, mevcutlar)) return sonuc;

  const simdi = new Date();
  const tamamlandi = gorevler.filter((g) => g.durum === "tamamlandi").length;
  const acik       = gorevler.filter((g) => g.durum !== "tamamlandi").length;
  const gecikmiş   = gorevler.filter((g) => g.durum !== "tamamlandi" && new Date(g.sonTarih) < simdi).length;

  const bugunGelir = islemler
    .filter((i) => i.tip === "gelir" && gunStr(i.tarih) === trBugun())
    .reduce((s, i) => s + i.tutar, 0);

  const ozet = [
    `${acik} açık görev (${gecikmiş > 0 ? `${gecikmiş} gecikmiş` : "tümü zamanında"})`,
    bugunGelir > 0 ? `Bugünkü gelir: ${tl(bugunGelir)}` : null,
  ].filter(Boolean).join(" · ");

  sonuc.push({
    id,
    tip:        "bilgi",
    modul:      "sistem",
    baslik:     "Günaydın! İşte günlük özetin",
    mesaj:      ozet || "Bugün henüz veri girilmedi.",
    ilgiliLink: "/dashboard",
  });

  return sonuc;
}

function gunStr(iso: string) { return iso.split("T")[0]; }
