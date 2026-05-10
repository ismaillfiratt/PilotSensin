"use client";

import { useEffect, useRef } from "react";
import { useStok }        from "@/store/stok";
import { useNakit }       from "@/store/nakit";
import { useProsedurler } from "@/store/prosedurler";
import { useGorevler }    from "@/store/gorevler";
import { useBildirimler } from "@/store/bildirimler";
import {
  stokTetikle, nakitTetikle, sopTetikle,
  gorevTetikle, gunlukOzetTetikle,
} from "@/lib/bildirim-engine";

const KONTROL_ARASI_MS = 10 * 60 * 1000; // 10 dakika
const ILK_GECIKME_MS   =  8 * 1000;      // ilk kontrol gecikmesi
const SESSIZ_KONTROL_MS =  60 * 1000;    // sessiz mod süre kontrolü: her 1 dk

export default function BildirimProvider() {
  const { urunler }   = useStok();
  const { islemler }  = useNakit();
  const { checklist } = useProsedurler();
  const { gorevler }  = useGorevler();
  const { bildirimler, sessizModu, ekle, sessizKontrol } = useBildirimler();

  // Ref pattern — interval her zaman güncel veriyi görür, yeniden oluşturulmaz
  const kontrol = useRef<() => void>(() => {});

  kontrol.current = () => {
    // Sessiz modda bildirim oluşturma
    if (sessizModu) return;

    const yeniler = [
      ...stokTetikle(urunler, bildirimler),
      ...nakitTetikle(islemler, bildirimler),
      ...sopTetikle(checklist, bildirimler),
      ...gorevTetikle(gorevler, bildirimler),
      ...gunlukOzetTetikle(gorevler, islemler, bildirimler),
    ];
    yeniler.forEach((b) => ekle(b));
  };

  useEffect(() => {
    // Uygulama açılışında sessiz mod süresini hemen kontrol et
    sessizKontrol();

    // İlk bildirim kontrolü
    const ilk       = setTimeout(() => kontrol.current(), ILK_GECIKME_MS);

    // Periyodik bildirim kontrolü
    const periyodik = setInterval(() => kontrol.current(), KONTROL_ARASI_MS);

    // Sessiz mod süre kontrolü (1 dk'da bir)
    const sessizTimer = setInterval(sessizKontrol, SESSIZ_KONTROL_MS);

    return () => {
      clearTimeout(ilk);
      clearInterval(periyodik);
      clearInterval(sessizTimer);   // bellek sızıntısı yok
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
