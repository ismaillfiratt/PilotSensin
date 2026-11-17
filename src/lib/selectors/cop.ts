"use client";

import { useMemo } from "react";
import type { SilinebilirTip } from "@/lib/silinebilir";
import { useNakit }            from "@/store/nakit";
import { useStok }             from "@/store/stok";
import { useSatislar }         from "@/store/satislar";
import { useGorevler }         from "@/store/gorevler";
import { useProsedurler }      from "@/store/prosedurler";
import { useAcilFon }          from "@/store/acilFon";
import { useIsletmeGiderleri } from "@/store/isletmeGiderleri";
import { useBildirimler }      from "@/store/bildirimler";

export interface SilinmisOge {
  id:                string;
  tip:               SilinebilirTip;
  isim:              string;
  silinmeTarihi:     string;
  silenKullaniciAd?: string;
  modulAdi:          string;
  kaskadIslemId?:    string;
  geriAlFn:          () => Promise<void>;
  kaliciSilFn:       () => Promise<void>;
}

const MODUL_ADI: Record<SilinebilirTip, string> = {
  urun:             "Stok",
  satisKaydi:       "Satış",
  nakitIslem:       "Nakit Akışı",
  kdvKaydi:         "KDV",
  gorev:            "Görevler",
  prosedur:         "Prosedürler",
  checklistMaddesi: "Kontrol Listesi",
  acilFonIslem:     "Acil Fon",
  acilFonHedef:     "Acil Fon Hedefi",
  isletmeGideri:    "Sabit Giderler",
  bildirim:         "Bildirimler",
  stokHareketi:     "Stok Hareketi",
  ekipUye:          "Ekip",
  davet:            "Ekip",
  sopGrup:          "Prosedürler",
  checklistGrup:    "Kontrol Listesi",
  borç:             "Borçlar",
  ödeme:            "Ödemeler",
};

/**
 * Tüm store'lardan silinen kayıtları birleştirir — yeniden eskiye sıralı.
 *
 * Store'lardaki `silinenler` getter'ları stabil fonksiyon referansları olduğu için
 * useMemo deps olarak kullanılamaz. Bunun yerine gerçek data array'lerine
 * subscribe ediyoruz; array değişince memo yeniden hesaplanır.
 */
export function useTumSilinenler(): SilinmisOge[] {
  // ── Data arrays (reactive — memo'yu tetikler) ──
  const nakitIslemler   = useNakit((s) => s.islemler);
  const stokUrunler     = useStok((s) => s.urunler);
  const satisKayitlar   = useSatislar((s) => s.kayitlar);
  const gorevListesi    = useGorevler((s) => s.gorevler);
  const prosedurListesi = useProsedurler((s) => s.prosedurler);
  const checklistler    = useProsedurler((s) => s.checklist);
  const fonHedefler     = useAcilFon((s) => s.hedefler);
  const fonIslemler     = useAcilFon((s) => s.islemler);
  const giderler        = useIsletmeGiderleri((s) => s.giderler);
  const bildirimListesi = useBildirimler((s) => s.bildirimler);

  // ── Action functions (stable refs — closure için) ──
  const nakitGeri  = useNakit((s) => s.geriAl);
  const nakitKal   = useNakit((s) => s.kaliciSil);
  const stokGeri   = useStok((s) => s.geriAl);
  const stokKal    = useStok((s) => s.kaliciSil);
  const satisGeri  = useSatislar((s) => s.geriAl);
  const satisKal   = useSatislar((s) => s.kaliciSil);
  const gorevGeri  = useGorevler((s) => s.geriAl);
  const gorevKal   = useGorevler((s) => s.kaliciSil);
  const prosedurGeri = useProsedurler((s) => s.prosedurGeriAl);
  const prosedurKal  = useProsedurler((s) => s.prosedurKaliciSil);
  const checkGeri    = useProsedurler((s) => s.checklistGeriAl);
  const checkKal     = useProsedurler((s) => s.checklistKaliciSil);
  const fonHGeri   = useAcilFon((s) => s.hedefGeriAl);
  const fonHKal    = useAcilFon((s) => s.hedefKaliciSil);
  const fonIGeri   = useAcilFon((s) => s.islemGeriAl);
  const fonIKal    = useAcilFon((s) => s.islemKaliciSil);
  const giderGeri  = useIsletmeGiderleri((s) => s.geriAl);
  const giderKal   = useIsletmeGiderleri((s) => s.kaliciSil);
  const bildGeri   = useBildirimler((s) => s.geriAl);
  const bildKal    = useBildirimler((s) => s.kaliciSil);

  return useMemo<SilinmisOge[]>(() => {
    const liste: SilinmisOge[] = [];

    nakitIslemler.filter((i) => i.silindi).forEach((i) => liste.push({
      id: i.id, tip: "nakitIslem",
      isim: `${i.kategori} — ${(i.tutarKurus / 100).toLocaleString("tr-TR")} ₺`,
      silinmeTarihi: i.silinmeTarihi!, silenKullaniciAd: i.silenKullaniciAd,
      modulAdi: MODUL_ADI.nakitIslem, kaskadIslemId: i.kaskadIslemId,
      geriAlFn:    () => nakitGeri(i.id),
      kaliciSilFn: () => nakitKal(i.id),
    }));

    stokUrunler.filter((u) => u.silindi).forEach((u) => liste.push({
      id: u.id, tip: "urun",
      isim: u.ad,
      silinmeTarihi: u.silinmeTarihi!, silenKullaniciAd: u.silenKullaniciAd,
      modulAdi: MODUL_ADI.urun, kaskadIslemId: u.kaskadIslemId,
      geriAlFn:    () => stokGeri(u.id),
      kaliciSilFn: () => stokKal(u.id),
    }));

    satisKayitlar.filter((k) => k.silindi).forEach((k) => liste.push({
      id: k.id, tip: "satisKaydi",
      isim: `${k.urunAd} × ${k.adet}`,
      silinmeTarihi: k.silinmeTarihi!, silenKullaniciAd: k.silenKullaniciAd,
      modulAdi: MODUL_ADI.satisKaydi, kaskadIslemId: k.kaskadIslemId,
      geriAlFn:    () => satisGeri(k.id),
      kaliciSilFn: () => satisKal(k.id),
    }));

    gorevListesi.filter((g) => g.silindi).forEach((g) => liste.push({
      id: g.id, tip: "gorev",
      isim: g.baslik,
      silinmeTarihi: g.silinmeTarihi!, silenKullaniciAd: g.silenKullaniciAd,
      modulAdi: MODUL_ADI.gorev, kaskadIslemId: g.kaskadIslemId,
      geriAlFn:    () => gorevGeri(g.id),
      kaliciSilFn: () => gorevKal(g.id),
    }));

    prosedurListesi.filter((p) => p.silindi).forEach((p) => liste.push({
      id: p.id, tip: "prosedur",
      isim: p.baslik,
      silinmeTarihi: p.silinmeTarihi!, silenKullaniciAd: p.silenKullaniciAd,
      modulAdi: MODUL_ADI.prosedur, kaskadIslemId: p.kaskadIslemId,
      geriAlFn:    () => Promise.resolve(prosedurGeri(p.id)),
      kaliciSilFn: () => Promise.resolve(prosedurKal(p.id)),
    }));

    checklistler.filter((c) => c.silindi).forEach((c) => liste.push({
      id: c.id, tip: "checklistMaddesi",
      isim: c.baslik,
      silinmeTarihi: c.silinmeTarihi!, silenKullaniciAd: c.silenKullaniciAd,
      modulAdi: MODUL_ADI.checklistMaddesi, kaskadIslemId: c.kaskadIslemId,
      geriAlFn:    () => Promise.resolve(checkGeri(c.id)),
      kaliciSilFn: () => Promise.resolve(checkKal(c.id)),
    }));

    fonHedefler.filter((h) => h.silindi).forEach((h) => liste.push({
      id: h.id, tip: "acilFonHedef",
      isim: h.ad,
      silinmeTarihi: h.silinmeTarihi!, silenKullaniciAd: h.silenKullaniciAd,
      modulAdi: MODUL_ADI.acilFonHedef, kaskadIslemId: h.kaskadIslemId,
      geriAlFn:    () => fonHGeri(h.id),
      kaliciSilFn: () => fonHKal(h.id),
    }));

    fonIslemler.filter((i) => i.silindi).forEach((i) => liste.push({
      id: i.id, tip: "acilFonIslem",
      isim: `${i.tip === "yatirma" ? "Yatırma" : "Çekme"} — ${(i.tutarKurus / 100).toLocaleString("tr-TR")} ₺`,
      silinmeTarihi: i.silinmeTarihi!, silenKullaniciAd: i.silenKullaniciAd,
      modulAdi: MODUL_ADI.acilFonIslem, kaskadIslemId: i.kaskadIslemId,
      geriAlFn:    () => fonIGeri(i.id),
      kaliciSilFn: () => fonIKal(i.id),
    }));

    giderler.filter((g) => g.silindi).forEach((g) => liste.push({
      id: g.id, tip: "isletmeGideri",
      isim: `${g.kategori} — ${(g.tutarKurus / 100).toLocaleString("tr-TR")} ₺/ay`,
      silinmeTarihi: g.silinmeTarihi!, silenKullaniciAd: g.silenKullaniciAd,
      modulAdi: MODUL_ADI.isletmeGideri, kaskadIslemId: g.kaskadIslemId,
      geriAlFn:    () => giderGeri(g.id),
      kaliciSilFn: () => giderKal(g.id),
    }));

    bildirimListesi.filter((b) => b.silindi).forEach((b) => liste.push({
      id: b.id, tip: "bildirim",
      isim: b.baslik,
      silinmeTarihi: b.silinmeTarihi!, silenKullaniciAd: b.silenKullaniciAd,
      modulAdi: MODUL_ADI.bildirim, kaskadIslemId: b.kaskadIslemId,
      geriAlFn:    async () => { bildGeri(b.id); },
      kaliciSilFn: async () => { bildKal(b.id); },
    }));

    return liste
      .filter((x) => !!x.silinmeTarihi)
      .sort((a, b) => {
        const at = new Date(a.silinmeTarihi).getTime();
        const bt = new Date(b.silinmeTarihi).getTime();
        if (bt !== at) return bt - at;
        if (a.tip !== b.tip) return a.tip.localeCompare(b.tip);
        return a.id.localeCompare(b.id);
      });
  }, [
    nakitIslemler, nakitGeri, nakitKal,
    stokUrunler, stokGeri, stokKal,
    satisKayitlar, satisGeri, satisKal,
    gorevListesi, gorevGeri, gorevKal,
    prosedurListesi, prosedurGeri, prosedurKal,
    checklistler, checkGeri, checkKal,
    fonHedefler, fonHGeri, fonHKal,
    fonIslemler, fonIGeri, fonIKal,
    giderler, giderGeri, giderKal,
    bildirimListesi, bildGeri, bildKal,
  ]);
}
