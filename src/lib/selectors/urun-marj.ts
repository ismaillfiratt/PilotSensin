import type { Urun }                          from "@/lib/stok-data";
import type { UrunMarjKayit }                  from "@/lib/urun-marj-data";
import { kdvHesapla }                          from "@/lib/kdv-hesap";

export interface DirectGiderHesap {
  id:             string;
  ad:             string;
  tip:            "sabit" | "yuzde";
  orijinalDeger:  number;
  aktif:          boolean;
  brut:           number;
  net:            number;
  kdv:            number;
  indirilebilir:  number;
}

export interface UrunBrutKarHesap {
  urunId:                  string;
  urunAd:                  string;
  satisFiyati:             number;   // KDV dahil
  satisNet:                number;   // KDV hariç
  satisKdv:                number;
  /** Mal maliyeti (stoktan, gider listesinde görünmez) */
  malMaliyetiBrut:         number;
  malMaliyetiNet:          number;
  malMaliyetiKdv:          number;
  /** Sadece ek giderler (Kargo, Paketleme, komisyonlar…) */
  directGiderler:          DirectGiderHesap[];
  toplamDirectNet:         number;   // malMaliyetiNet + sum(giderler.net)
  toplamIndirilebilirKdv:  number;
  birimBrutKar:            number;
  birimBrutMarj:           number;
  hedefMarjYuzde:          number | null;
  alarmAktif:              boolean;
  durumu:                  "kar" | "zarar" | "basabas" | "alarm";
}

export function urunBrutKarHesapla(
  urun:  Urun,
  kayit: UrunMarjKayit | undefined,
): UrunBrutKarHesap {
  const satisFiyati = urun.birimSatisFiyatiKurus != null ? urun.birimSatisFiyatiKurus / 100 : 0;
  const alisFiyati  = urun.birimMaliyetKurus     != null ? urun.birimMaliyetKurus     / 100 : 0;

  // ── 1. Satış KDV (stoktan) ──────────────────────────────────────────
  const satisHesap = kdvHesapla(
    satisFiyati,
    urun.satisKdvDahilHaric ?? "dahil",
    urun.satisKdvOrani      ?? 20,
    false,
  );

  // ── 2. Mal maliyeti KDV (stoktan, gizli — sadece hesaba katılır) ────
  const alisHesap = kdvHesapla(
    alisFiyati,
    urun.alisKdvDahilHaric ?? "dahil",
    urun.alisKdvOrani      ?? 20,
    true,   // alıştan indirilebilir
  );

  // ── 3. Ek giderler (stok-maliyet kaynaklı olanlar zaten listede yok) ─
  const aktifGiderler = (kayit?.giderler ?? []).filter(
    (g) => g.aktif && g.kaynak !== "stok-maliyet"
  );

  const directGiderler: DirectGiderHesap[] = aktifGiderler.map((g) => {
    const yuzdeBase   = g.yuzdeBase ?? "satis";
    const yuzdeTabani =
      yuzdeBase === "alis"  ? alisFiyati :
      yuzdeBase === "ozel"  ? (g.yuzdeBaseOzel ?? 0) :
      satisFiyati;

    const hamTutar = g.tip === "yuzde"
      ? (yuzdeTabani * g.tutar) / 100
      : g.tutar;

    const hesap = kdvHesapla(hamTutar, g.kdvDahilHaric, g.kdvOrani, g.kdvIndirilebilir);

    return {
      id:            g.id,
      ad:            g.ad,
      tip:           g.tip,
      orijinalDeger: g.tutar,
      aktif:         g.aktif,
      brut:          hesap.brut,
      net:           hesap.net,
      kdv:           hesap.kdv,
      indirilebilir: hesap.indirilebilir,
    };
  });

  // ── 4. Toplamlar ────────────────────────────────────────────────────
  const toplamDirectNet        = alisHesap.net + directGiderler.reduce((t, d) => t + d.net, 0);
  const toplamIndirilebilirKdv = alisHesap.indirilebilir + directGiderler.reduce((t, d) => t + d.indirilebilir, 0);

  const birimBrutKar  = satisHesap.net - toplamDirectNet;
  const birimBrutMarj = satisHesap.net > 0 ? (birimBrutKar / satisHesap.net) * 100 : 0;

  const hedef      = kayit?.hedefMarjYuzde ?? null;
  const alarmAktif = hedef !== null && birimBrutMarj < hedef && birimBrutKar >= 0;

  let durumu: UrunBrutKarHesap["durumu"] = "kar";
  if (birimBrutKar < 0)                    durumu = "zarar";
  else if (Math.abs(birimBrutKar) < 0.01) durumu = "basabas";
  else if (alarmAktif)                     durumu = "alarm";

  return {
    urunId:                 urun.id,
    urunAd:                 urun.ad,
    satisFiyati:            satisHesap.brut,
    satisNet:               satisHesap.net,
    satisKdv:               satisHesap.kdv,
    malMaliyetiBrut:        alisHesap.brut,
    malMaliyetiNet:         alisHesap.net,
    malMaliyetiKdv:         alisHesap.indirilebilir,
    directGiderler,
    toplamDirectNet,
    toplamIndirilebilirKdv,
    birimBrutKar,
    birimBrutMarj,
    hedefMarjYuzde:         hedef,
    alarmAktif,
    durumu,
  };
}

export function tumUrunBrutKarlari(
  urunler:  Urun[],
  kayitlar: UrunMarjKayit[],
): UrunBrutKarHesap[] {
  return urunler.map((u) => {
    const kayit = kayitlar.find((k) => k.urunId === u.id);
    return urunBrutKarHesapla(u, kayit);
  });
}

// Geriye dönük uyum
export type UrunMarjHesap = UrunBrutKarHesap;
export const urunMarjHesapla  = urunBrutKarHesapla;
export const tumUrunMarjlari  = tumUrunBrutKarlari;
