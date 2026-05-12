"use client";

import { useEffect, useRef } from "react";
import { useStok }        from "@/store/stok";
import { useNakit }       from "@/store/nakit";
import { useProsedurler } from "@/store/prosedurler";
import { useGorevler }    from "@/store/gorevler";
import { useBildirimler } from "@/store/bildirimler";
import { useSirket }      from "@/store/sirket";
import {
  stokTetikle, nakitTetikle, sopTetikle,
  gorevTetikle, gunlukOzetTetikle,
} from "@/lib/bildirim-engine";

const KONTROL_ARASI_MS  = 10 * 60 * 1000;
const ILK_GECIKME_MS    =  8 * 1000;
const SESSIZ_KONTROL_MS =  60 * 1000;

export default function BildirimProvider() {
  const { urunler }   = useStok();
  const { islemler }  = useNakit();
  const { checklist } = useProsedurler();
  const { gorevler }  = useGorevler();
  const { bildirimler, sessizModu, ekle, sessizKontrol } = useBildirimler();
  const { rol, permissions } = useSirket();

  const kontrol = useRef<() => void>(() => {});

  kontrol.current = () => {
    if (sessizModu) return;

    const pilot = rol === "pilot" || !rol;
    const m     = permissions?.modules;

    const yeniler = [
      // Stok — izinli ise
      ...(pilot || m?.["stok"]        ? stokTetikle(urunler, bildirimler)                      : []),
      // Nakit — izinli ise
      ...(pilot || m?.["nakit-akisi"] ? nakitTetikle(islemler, bildirimler)                    : []),
      // SOP — izinli ise
      ...(pilot || m?.["prosedurler"] ? sopTetikle(checklist, bildirimler)                     : []),
      // Görevler — izinli ise
      ...(pilot || m?.["gorevler"]    ? gorevTetikle(gorevler, bildirimler)                    : []),
      // Günlük özet — sadece pilot
      ...(pilot                       ? gunlukOzetTetikle(gorevler, islemler, bildirimler)     : []),
    ];
    yeniler.forEach((b) => ekle(b));
  };

  useEffect(() => {
    sessizKontrol();
    const ilk       = setTimeout(() => kontrol.current(), ILK_GECIKME_MS);
    const periyodik = setInterval(() => kontrol.current(), KONTROL_ARASI_MS);
    const sessizTimer = setInterval(sessizKontrol, SESSIZ_KONTROL_MS);
    return () => {
      clearTimeout(ilk);
      clearInterval(periyodik);
      clearInterval(sessizTimer);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
