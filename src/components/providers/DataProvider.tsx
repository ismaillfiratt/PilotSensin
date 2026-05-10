"use client";

/**
 * DataProvider — Uygulama açıldığında user_store'dan tüm kullanıcı
 * verisini çekip Zustand store'larına yükler.
 * Supabase Realtime ile değişiklikleri anlık olarak dinler.
 */

import { useEffect, useRef } from "react";
import { createClient }       from "@/utils/supabase/client";
import { userStoreDB }        from "@/lib/db";
import { useNakit }           from "@/store/nakit";
import { useGorevler }        from "@/store/gorevler";
import { useStok }            from "@/store/stok";
import { useBildirimler }     from "@/store/bildirimler";
import { useProsedurler }     from "@/store/prosedurler";
import { useAcilFon }         from "@/store/acilFon";
import { useIsletmeGiderleri } from "@/store/isletmeGiderleri";

export default function DataProvider() {
  const yuklendi = useRef(false);

  const nakitSync    = useNakit((s) => s.syncFromRemote);
  const gorevSync    = useGorevler((s) => s.syncFromRemote);
  const stokSync     = useStok((s) => s.syncFromRemote);
  const bildirimSync = useBildirimler((s) => s.syncFromRemote);
  const prosedurSync = useProsedurler((s) => s.syncFromRemote);
  const acilFonSync  = useAcilFon((s) => s.syncFromRemote);
  const giderSync    = useIsletmeGiderleri((s) => s.syncFromRemote);

  useEffect(() => {
    if (yuklendi.current) return;
    yuklendi.current = true;

    const supabase = createClient();

    supabase.auth.getSession().then(async ({ data: sessionData }) => {
      if (!sessionData.session?.user) return;
      const userId = sessionData.session.user.id;

      async function yukle() {
        const veri = await userStoreDB.getAll();
        nakitSync(veri.nakit_islemler);
        gorevSync(veri.gorevler);
        stokSync(veri.stok_urunler);
        bildirimSync(veri.bildirimler);
        prosedurSync({ prosedurler: veri.prosedurler, checklist: veri.checklist_items });
        acilFonSync({ hedefler: veri.acil_fon_hedefler, islemler: veri.acil_fon_islemler, aktifHedefId: null });
        giderSync(veri.isletme_giderleri);
      }

      // İlk yükleme
      await yukle();

      // Realtime — user_store'daki her değişiklikte yeniden yükle
      const kanal = supabase
        .channel(`user_store:${userId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "user_store",
            filter: `user_id=eq.${userId}`,
          },
          async () => { await yukle(); }
        )
        .subscribe();

      return () => { supabase.removeChannel(kanal); };
    });
  }, [nakitSync, gorevSync, stokSync, bildirimSync, prosedurSync, acilFonSync, giderSync]);

  return null;
}
