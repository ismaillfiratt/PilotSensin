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
import type { SatisKaydi }   from "@/store/satislar";
import type { GiderItem }    from "@/lib/db";
import { stokDurumu }         from "./stok-data";
import { isDue }              from "./prosedur-data";
import { trBugun }            from "./tarih";

export type YeniBildirim = Omit<Bildirim, "tarih" | "okundu">;

/* Günlük sabit ID — aynı gün ikinci kez oluşmaz */
export function gid(tip: string) { return `${tip}__${trBugun()}`; }

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
  const gelir = son7.filter((i) => i.tip === "gelir").reduce((s, i) => s + i.tutarKurus, 0);
  const gider = son7.filter((i) => i.tip === "gider").reduce((s, i) => s + i.tutarKurus, 0);

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
    .reduce((s, i) => s + i.tutarKurus, 0);

  const ozet = [
    `${acik} açık görev (${gecikmiş > 0 ? `${gecikmiş} gecikmiş` : "tümü zamanında"})`,
    bugunGelir > 0 ? `Bugünkü gelirKurus: ${tl(bugunGelir)}` : null,
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

/* ─── 6. NAKİT AKİŞ TETİKLEYİCİ ────────────────────────────────────── */
export function nakitRiskTetikle(
  kritikGunVar:  boolean,
  ilkKritikGun:  string | null,
  runwayGun:     number,
  mevcutlar:     Bildirim[],
): YeniBildirim[] {
  const sonuc: YeniBildirim[] = [];

  if (kritikGunVar && !varMi(gid("nakit-kritik-risk"), mevcutlar)) {
    sonuc.push({
      id:         gid("nakit-kritik-risk"),
      tip:        "kritik",
      modul:      "nakit-akisi",
      baslik:     "Kritik Nakit Sıkışıklığı Riski",
      mesaj:      ilkKritikGun
        ? `${ilkKritikGun} tarihinde nakit bakiyesi sıfırın altına düşüyor. Planlarını gözden geçir.`
        : "30 gün içinde nakit bakiyesi negatife dönebilir.",
      ilgiliLink: "/nakit-akisi",
    });
  }

  if (!kritikGunVar && runwayGun <= 7 && runwayGun > 0 && !varMi(gid("nakit-runway-az"), mevcutlar)) {
    sonuc.push({
      id:         gid("nakit-runway-az"),
      tip:        "kritik",
      modul:      "nakit-akisi",
      baslik:     "Düşük Nakit Can Suyu",
      mesaj:      `Mevcut gider hızıyla yalnızca ${runwayGun} gün dayanabilirsiniz.`,
      ilgiliLink: "/nakit-akisi",
    });
  }

  return sonuc;
}

/* ─── 7. KÂR-ZARAR TETİKLEYİCİ ─────────────────────────────────────── */
export function karZararTetikle(
  kayitlar: SatisKaydi[],
  giderler: GiderItem[],
  mevcutlar: Bildirim[],
): YeniBildirim[] {
  const sonuc: YeniBildirim[] = [];
  if (kayitlar.length === 0 && giderler.length === 0) return sonuc;

  const ayBasi  = new Date();
  ayBasi.setDate(1); ayBasi.setHours(0, 0, 0, 0);

  const buAy       = kayitlar.filter((k) => !k.iadeEdildi && new Date(k.tarih) >= ayBasi);
  const ciro       = buAy.reduce((t, k) => t + k.toplamCiroKurus, 0);
  const smm        = buAy.reduce((t, k) => t + k.birimAlisFiyatiKurus * k.adet, 0);
  const brutKarKurus    = ciro - smm;
  const toplamGider = giderler.reduce((t, g) => t + g.tutarKurus, 0);
  const netKar     = brutKarKurus - toplamGider;
  const netMarj    = ciro > 0 ? netKar / ciro : null;

  // Net zarar bildirimi
  if (netKar < 0 && !varMi(gid("kz-net-zarar"), mevcutlar)) {
    sonuc.push({
      id:         gid("kz-net-zarar"),
      tip:        "kritik",
      modul:      "kar-zarar",
      baslik:     "Aylık Net Zarar",
      mesaj:      `Bu ay ${tl(Math.abs(netKar))} zarar — giderler ciroyu aşıyor.`,
      ilgiliLink: "/kar-zarar",
    });
  }

  // Düşük marj uyarısı (%5 altı)
  if (netMarj !== null && netMarj >= 0 && netMarj < 0.05 && ciro > 0 && !varMi(gid("kz-dusuk-marj"), mevcutlar)) {
    sonuc.push({
      id:         gid("kz-dusuk-marj"),
      tip:        "uyari",
      modul:      "kar-zarar",
      baslik:     "Çok Düşük Kâr Marjı",
      mesaj:      `Bu ayın net marjı %${(netMarj * 100).toFixed(1)} — hedef en az %5.`,
      ilgiliLink: "/kar-zarar",
    });
  }

  // SMM > Ciro (satışta zarar)
  if (smm > ciro && ciro > 0 && !varMi(gid("kz-smm-yuksek"), mevcutlar)) {
    sonuc.push({
      id:         gid("kz-smm-yuksek"),
      tip:        "kritik",
      modul:      "kar-zarar",
      baslik:     "Satış Maliyeti Ciroyu Aşıyor",
      mesaj:      `SMM (${tl(smm)}) bu ay cirosundan (${tl(ciro)}) yüksek — brüt zarar.`,
      ilgiliLink: "/kar-zarar",
    });
  }

  return sonuc;
}

/* ─── STALE BİLDİRİM TEMİZLEYİCİ ─────────────────────────────────── */
/**
 * Koşulları artık geçerli olmayan bildirim ID'lerini döner.
 * BildirimProvider bu ID'leri `sil()` ile kaldırır.
 */
export function staleIdler(
  urunler:   Urun[],
  gorevler:  Gorev[],
  kayitlar:  SatisKaydi[],
  giderler:  GiderItem[],
  mevcutlar: Bildirim[]
): string[] {
  const stale: string[] = [];
  const mevcut = (id: string) => mevcutlar.some((b) => b.id === id);

  const simdi    = new Date();
  const gunBasi  = new Date(); gunBasi.setHours(0, 0, 0, 0);
  const gunSonu  = new Date(); gunSonu.setHours(23, 59, 59, 999);

  // Stok kritik bildirimi (engine, günlük ID) — kritik ürün kalmadıysa sil
  if (mevcut(gid("stok-kritik")) && !urunler.some((u) => stokDurumu(u) === "kritik")) {
    stale.push(gid("stok-kritik"));
  }
  // Stok uyarı bildirimi (engine, günlük ID) — uyarı ürün kalmadıysa sil
  if (mevcut(gid("stok-uyari")) && !urunler.some((u) => stokDurumu(u) === "uyari")) {
    stale.push(gid("stok-uyari"));
  }
  // Anlık stok-kritik bildirimleri (UUID ID, kaynak:"olay") — ürün artık kritik değilse sil
  mevcutlar
    .filter((b) => !b.silindi && b.modul === "stok" && b.baslik === "Kritik Stok Uyarısı" && b.kaynak === "olay")
    .forEach((b) => {
      const urunAd     = b.mesaj.split(" kritik seviyenin")[0];
      const halaKritik = urunler.some((u) => u.ad === urunAd && stokDurumu(u) === "kritik");
      if (!halaKritik) stale.push(b.id);
    });
  // Gecikmiş görev bildirimi — gecikmiş görev kalmadıysa sil
  if (
    mevcut(gid("gorev-gecik")) &&
    !gorevler.some((g) => g.durum !== "tamamlandi" && new Date(g.sonTarih) < simdi)
  ) {
    stale.push(gid("gorev-gecik"));
  }
  // Bugün acil görev bildirimi — bugün acil görev kalmadıysa sil
  if (
    mevcut(gid("gorev-bugun-acil")) &&
    !gorevler.some(
      (g) =>
        g.durum !== "tamamlandi" &&
        g.oncelik === "acil" &&
        new Date(g.sonTarih) >= gunBasi &&
        new Date(g.sonTarih) <= gunSonu
    )
  ) {
    stale.push(gid("gorev-bugun-acil"));
  }

  // P&L — zarar/düşük marj bildirimi: artık net kâr pozitifse temizle
  const ayBasi2 = new Date(); ayBasi2.setDate(1); ayBasi2.setHours(0, 0, 0, 0);
  const buAy2   = kayitlar.filter((k) => !k.iadeEdildi && new Date(k.tarih) >= ayBasi2);
  const ciro2   = buAy2.reduce((t, k) => t + k.toplamCiroKurus, 0);
  const smm2    = buAy2.reduce((t, k) => t + k.birimAlisFiyatiKurus * k.adet, 0);
  const netKar2 = (ciro2 - smm2) - giderler.reduce((t, g) => t + g.tutarKurus, 0);
  const marj2   = ciro2 > 0 ? netKar2 / ciro2 : null;

  if (mevcut(gid("kz-net-zarar"))   && netKar2 >= 0)                    stale.push(gid("kz-net-zarar"));
  if (mevcut(gid("kz-dusuk-marj"))  && (marj2 === null || marj2 >= 0.05)) stale.push(gid("kz-dusuk-marj"));
  if (mevcut(gid("kz-smm-yuksek"))  && smm2 <= ciro2)                   stale.push(gid("kz-smm-yuksek"));

  // Önceki günlere ait günlük-ID'li bildirimler — bugünün tarihi değilse sil
  const bugun = trBugun();
  mevcutlar
    .filter((b) => !b.silindi && b.id.includes("__") && !b.id.endsWith(`__${bugun}`))
    .forEach((b) => stale.push(b.id));

  return stale;
}

/* ─── 8. ÜRÜN MARJ TETİKLEYİCİSİ ──────────────────────────────────── */
import type { UrunMarjHesap } from "@/lib/selectors/urun-marj";

export function urunMarjTetikle(
  marjlar:   UrunMarjHesap[],
  mevcutlar: Bildirim[],
): YeniBildirim[] {
  const sonuc: YeniBildirim[] = [];

  const zararli = marjlar.filter((m) => m.durumu === "zarar" && m.satisFiyati > 0);
  const alarmli = marjlar.filter((m) => m.alarmAktif);

  if (zararli.length > 0 && !varMi(gid("marj-zarar"), mevcutlar)) {
    sonuc.push({
      id:         gid("marj-zarar"),
      tip:        "kritik",
      modul:      "stok",
      baslik:     "Ürün zarar ediyor",
      mesaj:      zararli.length === 1
        ? `"${zararli[0].urunAd}" her satışta zarar ediyor. Gider veya fiyatı düzenle.`
        : `${zararli.length} ürün zarar ediyor (${zararli.slice(0, 2).map((m) => m.urunAd).join(", ")}${zararli.length > 2 ? "…" : ""}).`,
      ilgiliLink: "/stok",
    });
  }

  if (alarmli.length > 0 && !varMi(gid("marj-alarm"), mevcutlar)) {
    sonuc.push({
      id:         gid("marj-alarm"),
      tip:        "uyari",
      modul:      "stok",
      baslik:     "Ürün hedef marjın altında",
      mesaj:      alarmli.length === 1
        ? `"${alarmli[0].urunAd}" marjı %${alarmli[0].birimBrutMarj.toFixed(1)} — hedef %${alarmli[0].hedefMarjYuzde}.`
        : `${alarmli.length} ürün hedef marjın altında.`,
      ilgiliLink: "/stok",
    });
  }

  return sonuc;
}
