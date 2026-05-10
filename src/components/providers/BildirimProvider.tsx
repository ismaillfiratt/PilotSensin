"use client";

/**
 * BildirimProvider
 * Arka planda periyodik olarak tüm koşulları kontrol eder ve
 * gerektiğinde otomatik bildirimler oluşturur.
 *
 * Bellek yönetimi: useEffect cleanup ile interval temizlenir.
 * Dedup: Her bildirim günlük sabit ID taşır — aynı gün bir kez eklenir.
 * Gerçek zamanlı: Bildirimler user_store'a yazıldığı anda
 *   Supabase Realtime aracılığıyla diğer cihazlara yayılır.
 */

import { useEffect, useRef } from "react";
import { useStok }        from "@/store/stok";
import { useNakit }       from "@/store/nakit";
import { useProsedurler } from "@/store/prosedurler";
import { useGorevler }    from "@/store/gorevler";
import { useBildirimler } from "@/store/bildirimler";
import {
  stokTetikle,
  nakitTetikle,
  sopTetikle,
  gorevTetikle,
  gunlukOzetTetikle,
} from "@/lib/bildirim-engine";

const KONTROL_ARASI_MS = 10 * 60 * 1000; // 10 dakika
const ILK_GECIKME_MS   =  8 * 1000;      // uygulama açılışından 8 sn sonra ilk kontrol

export default function BildirimProvider() {
  const { urunler }   = useStok();
  const { islemler }  = useNakit();
  const { checklist } = useProsedurler();
  const { gorevler }  = useGorevler();
  const { bildirimler, ekle } = useBildirimler();

  /*
   * Kontrol fonksiyonunu ref'e alıyoruz.
   * Bu sayede interval her zaman güncel store verisini görür,
   * ama interval'i yeniden oluşturmaya gerek kalmaz.
   */
  const kontrol = useRef<() => void>(() => {});

  kontrol.current = () => {
    const tetikleyiciler = [
      ...stokTetikle(urunler, bildirimler),
      ...nakitTetikle(islemler, bildirimler),
      ...sopTetikle(checklist, bildirimler),
      ...gorevTetikle(gorevler, bildirimler),
      ...gunlukOzetTetikle(gorevler, islemler, bildirimler),
    ];

    tetikleyiciler.forEach((b) => ekle(b));
  };

  useEffect(() => {
    // İlk kontrol — uygulamanın tamamen yüklenmesini bekle
    const ilkKontrol = setTimeout(() => kontrol.current(), ILK_GECIKME_MS);

    // Periyodik kontrol — cleanup ile bellek sızıntısı önlenir
    const periyodik  = setInterval(() => kontrol.current(), KONTROL_ARASI_MS);

    return () => {
      clearTimeout(ilkKontrol);
      clearInterval(periyodik); // bellek sızıntısı yok
    };
  }, []); // sadece mount'ta kurulur — kontrol.current ref ile güncellenir

  return null;
}
