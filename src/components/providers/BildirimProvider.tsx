"use client";

import { useEffect, useRef } from "react";
import { useStok }            from "@/store/stok";
import { useNakit }           from "@/store/nakit";
import { useProsedurler }     from "@/store/prosedurler";
import { useGorevler }        from "@/store/gorevler";
import { useBildirimler }     from "@/store/bildirimler";
import { useSirket }          from "@/store/sirket";
import { useNakitAkis }       from "@/store/nakitAkis";
import { useSatislar }        from "@/store/satislar";
import { useIsletmeGiderleri } from "@/store/isletmeGiderleri";
import {
  stokTetikle, nakitTetikle, sopTetikle, gorevTetikle,
  gunlukOzetTetikle, staleIdler, nakitRiskTetikle, karZararTetikle,
} from "@/lib/bildirim-engine";
import {
  kasaBakiyesi, gunlukOrtalamaGider, runway,
  projeksiyon30Gun, kritikGunVarMi, ilkKritikGun,
} from "@/lib/nakitAkis-engine";

const KONTROL_ARASI_MS  = 10 * 60 * 1000;
const ILK_GECIKME_MS    =  8 * 1000;
const SESSIZ_KONTROL_MS =  60 * 1000;

export default function BildirimProvider() {
  const { urunler }                             = useStok();
  const { islemler }                            = useNakit();
  const { checklist }                           = useProsedurler();
  const { gorevler }                            = useGorevler();
  const { bildirimler, sessizModu, ekle, sil, sessizKontrol, eskileriniSil } = useBildirimler();
  const { rol, permissions }                    = useSirket();
  const { kalemler: nakitKalemler, tekrarlayanlar } = useNakitAkis();
  const { kayitlar: satisKayitlari }            = useSatislar();
  const { giderler }                            = useIsletmeGiderleri();

  const kontrol = useRef<() => void>(() => {});

  kontrol.current = () => {
    if (sessizModu) return;

    const pilot = rol === "pilot" || !rol;
    const m     = permissions?.modules;

    const kasa        = kasaBakiyesi(islemler);
    const gunlukGider = gunlukOrtalamaGider(islemler);
    const gun         = runway(kasa, gunlukGider);
    const proj        = projeksiyon30Gun(kasa, nakitKalemler, tekrarlayanlar);
    const kritikVar   = kritikGunVarMi(proj);
    const ilkKritik   = ilkKritikGun(proj);

    const yeniler = [
      ...(pilot || m?.["stok"]        ? stokTetikle(urunler, bildirimler)                                       : []),
      ...(pilot || m?.["nakit-akisi"] ? nakitTetikle(islemler, bildirimler)                                     : []),
      ...(pilot || m?.["nakit-akisi"] ? nakitRiskTetikle(kritikVar, ilkKritik?.etiket ?? null, gun, bildirimler) : []),
      ...(pilot || m?.["prosedurler"] ? sopTetikle(checklist, bildirimler)                                      : []),
      ...(pilot || m?.["gorevler"]    ? gorevTetikle(gorevler, bildirimler)                                     : []),
      ...(pilot || m?.["kar-zarar"]   ? karZararTetikle(satisKayitlari, giderler, bildirimler)                  : []),
      ...(pilot                       ? gunlukOzetTetikle(gorevler, islemler, bildirimler)                      : []),
    ];
    yeniler.forEach((b) => ekle(b));

    const stale = staleIdler(urunler, gorevler, satisKayitlari, giderler, bildirimler);
    stale.forEach((id) => sil(id));
  };

  const gecikmeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tetikleGecikme = () => {
    if (gecikmeRef.current) clearTimeout(gecikmeRef.current);
    gecikmeRef.current = setTimeout(() => kontrol.current(), 1500);
  };

  useEffect(() => { tetikleGecikme(); }, [urunler]);          // eslint-disable-line
  useEffect(() => { tetikleGecikme(); }, [gorevler]);         // eslint-disable-line
  useEffect(() => { tetikleGecikme(); }, [checklist]);        // eslint-disable-line
  useEffect(() => { tetikleGecikme(); }, [islemler]);         // eslint-disable-line
  useEffect(() => { tetikleGecikme(); }, [nakitKalemler]);    // eslint-disable-line
  useEffect(() => { tetikleGecikme(); }, [satisKayitlari]);   // eslint-disable-line
  useEffect(() => { tetikleGecikme(); }, [giderler]);         // eslint-disable-line

  useEffect(() => {
    sessizKontrol();
    eskileriniSil();  // mount'ta bir kere çalıştır

    const ilk           = setTimeout(() => kontrol.current(), ILK_GECIKME_MS);
    const periyodik     = setInterval(() => kontrol.current(), KONTROL_ARASI_MS);
    const sessizTimer   = setInterval(sessizKontrol, SESSIZ_KONTROL_MS);
    const gunlukTemizlik = setInterval(eskileriniSil, 24 * 60 * 60 * 1000);

    return () => {
      clearTimeout(ilk);
      clearInterval(periyodik);
      clearInterval(sessizTimer);
      clearInterval(gunlukTemizlik);
      if (gecikmeRef.current) clearTimeout(gecikmeRef.current);
    };
  }, []); // eslint-disable-line

  return null;
}
