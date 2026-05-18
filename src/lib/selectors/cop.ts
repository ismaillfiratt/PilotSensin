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
};

/** Tüm store'lardan silinen kayıtları birleştirir — yeniden eskiye sıralı. */
export function useTumSilinenler(): SilinmisOge[] {
  const nakitSil   = useNakit((s) => s.silinenler);
  const nakitGeri  = useNakit((s) => s.geriAl);
  const nakitKal   = useNakit((s) => s.kaliciSil);

  const stokSil    = useStok((s) => s.silinenler);
  const stokGeri   = useStok((s) => s.geriAl);
  const stokKal    = useStok((s) => s.kaliciSil);

  const satisSil   = useSatislar((s) => s.silinenler);
  const satisGeri  = useSatislar((s) => s.geriAl);
  const satisKal   = useSatislar((s) => s.kaliciSil);

  const gorevSil   = useGorevler((s) => s.silinenler);
  const gorevGeri  = useGorevler((s) => s.geriAl);
  const gorevKal   = useGorevler((s) => s.kaliciSil);

  const prosedurSil  = useProsedurler((s) => s.prosedurSilinenler);
  const prosedurGeri = useProsedurler((s) => s.prosedurGeriAl);
  const prosedurKal  = useProsedurler((s) => s.prosedurKaliciSil);

  const checkSil     = useProsedurler((s) => s.checklistSilinenler);
  const checkGeri    = useProsedurler((s) => s.checklistGeriAl);
  const checkKal     = useProsedurler((s) => s.checklistKaliciSil);

  const fonHSil  = useAcilFon((s) => s.hedefSilinenler);
  const fonHGeri = useAcilFon((s) => s.hedefGeriAl);
  const fonHKal  = useAcilFon((s) => s.hedefKaliciSil);

  const fonISil  = useAcilFon((s) => s.islemSilinenler);
  const fonIGeri = useAcilFon((s) => s.islemGeriAl);
  const fonIKal  = useAcilFon((s) => s.islemKaliciSil);

  const giderSil  = useIsletmeGiderleri((s) => s.silinenler);
  const giderGeri = useIsletmeGiderleri((s) => s.geriAl);
  const giderKal  = useIsletmeGiderleri((s) => s.kaliciSil);

  const bildSil  = useBildirimler((s) => s.silinenler);
  const bildGeri = useBildirimler((s) => s.geriAl);
  const bildKal  = useBildirimler((s) => s.kaliciSil);

  return useMemo<SilinmisOge[]>(() => {
    const liste: SilinmisOge[] = [];

    nakitSil().forEach((i) => liste.push({
      id: i.id, tip: "nakitIslem",
      isim: `${i.kategori} — ${(i.tutarKurus / 100).toLocaleString("tr-TR")} ₺`,
      silinmeTarihi: i.silinmeTarihi!, silenKullaniciAd: i.silenKullaniciAd,
      modulAdi: MODUL_ADI.nakitIslem, kaskadIslemId: i.kaskadIslemId,
      geriAlFn: () => nakitGeri(i.id),
      kaliciSilFn: () => nakitKal(i.id),
    }));

    stokSil().forEach((u) => liste.push({
      id: u.id, tip: "urun",
      isim: u.ad,
      silinmeTarihi: u.silinmeTarihi!, silenKullaniciAd: u.silenKullaniciAd,
      modulAdi: MODUL_ADI.urun, kaskadIslemId: u.kaskadIslemId,
      geriAlFn: () => stokGeri(u.id),
      kaliciSilFn: () => stokKal(u.id),
    }));

    satisSil().forEach((k) => liste.push({
      id: k.id, tip: "satisKaydi",
      isim: `${k.urunAd} × ${k.adet}`,
      silinmeTarihi: k.silinmeTarihi!, silenKullaniciAd: k.silenKullaniciAd,
      modulAdi: MODUL_ADI.satisKaydi, kaskadIslemId: k.kaskadIslemId,
      geriAlFn: () => satisGeri(k.id),
      kaliciSilFn: () => satisKal(k.id),
    }));

    gorevSil().forEach((g) => liste.push({
      id: g.id, tip: "gorev",
      isim: g.baslik,
      silinmeTarihi: g.silinmeTarihi!, silenKullaniciAd: g.silenKullaniciAd,
      modulAdi: MODUL_ADI.gorev, kaskadIslemId: g.kaskadIslemId,
      geriAlFn: () => gorevGeri(g.id),
      kaliciSilFn: () => gorevKal(g.id),
    }));

    prosedurSil().forEach((p) => liste.push({
      id: p.id, tip: "prosedur",
      isim: p.baslik,
      silinmeTarihi: p.silinmeTarihi!, silenKullaniciAd: p.silenKullaniciAd,
      modulAdi: MODUL_ADI.prosedur, kaskadIslemId: p.kaskadIslemId,
      geriAlFn: async () => { await prosedurGeri(p.id); },
      kaliciSilFn: async () => { await prosedurKal(p.id); },
    }));

    checkSil().forEach((c) => liste.push({
      id: c.id, tip: "checklistMaddesi",
      isim: c.baslik,
      silinmeTarihi: c.silinmeTarihi!, silenKullaniciAd: c.silenKullaniciAd,
      modulAdi: MODUL_ADI.checklistMaddesi, kaskadIslemId: c.kaskadIslemId,
      geriAlFn: async () => { await checkGeri(c.id); },
      kaliciSilFn: async () => { await checkKal(c.id); },
    }));

    fonHSil().forEach((h) => liste.push({
      id: h.id, tip: "acilFonHedef",
      isim: h.ad,
      silinmeTarihi: h.silinmeTarihi!, silenKullaniciAd: h.silenKullaniciAd,
      modulAdi: MODUL_ADI.acilFonHedef, kaskadIslemId: h.kaskadIslemId,
      geriAlFn: () => fonHGeri(h.id),
      kaliciSilFn: () => fonHKal(h.id),
    }));

    fonISil().forEach((i) => liste.push({
      id: i.id, tip: "acilFonIslem",
      isim: `${i.tip === "yatirma" ? "Yatırma" : "Çekme"} — ${(i.tutarKurus / 100).toLocaleString("tr-TR")} ₺`,
      silinmeTarihi: i.silinmeTarihi!, silenKullaniciAd: i.silenKullaniciAd,
      modulAdi: MODUL_ADI.acilFonIslem, kaskadIslemId: i.kaskadIslemId,
      geriAlFn: () => fonIGeri(i.id),
      kaliciSilFn: () => fonIKal(i.id),
    }));

    giderSil().forEach((g) => liste.push({
      id: g.id, tip: "isletmeGideri",
      isim: `${g.kategori} — ${(g.tutarKurus / 100).toLocaleString("tr-TR")} ₺/ay`,
      silinmeTarihi: g.silinmeTarihi!, silenKullaniciAd: g.silenKullaniciAd,
      modulAdi: MODUL_ADI.isletmeGideri, kaskadIslemId: g.kaskadIslemId,
      geriAlFn: () => giderGeri(g.id),
      kaliciSilFn: () => giderKal(g.id),
    }));

    bildSil().forEach((b) => liste.push({
      id: b.id, tip: "bildirim",
      isim: b.baslik,
      silinmeTarihi: b.silinmeTarihi!, silenKullaniciAd: b.silenKullaniciAd,
      modulAdi: MODUL_ADI.bildirim, kaskadIslemId: b.kaskadIslemId,
      geriAlFn:   async () => { bildGeri(b.id); },
      kaliciSilFn: async () => { bildKal(b.id); },
    }));

    return liste
      .filter((x) => !!x.silinmeTarihi)
      .sort((a, b) => b.silinmeTarihi.localeCompare(a.silinmeTarihi));
  }, [
    nakitSil, nakitGeri, nakitKal,
    stokSil, stokGeri, stokKal,
    satisSil, satisGeri, satisKal,
    gorevSil, gorevGeri, gorevKal,
    prosedurSil, prosedurGeri, prosedurKal,
    checkSil, checkGeri, checkKal,
    fonHSil, fonHGeri, fonHKal,
    fonISil, fonIGeri, fonIKal,
    giderSil, giderGeri, giderKal,
    bildSil, bildGeri, bildKal,
  ]);
}
