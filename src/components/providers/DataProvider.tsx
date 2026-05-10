"use client";

/**
 * DataProvider — Uygulama açıldığında Supabase'den tüm kullanıcı
 * verilerini çekip Zustand store'larına yükler.
 * Ayrıca Supabase Realtime ile tablolardaki değişiklikleri dinler.
 */

import { useEffect, useRef } from "react";
import { createClient }      from "@/utils/supabase/client";
import { useNakit }           from "@/store/nakit";
import { useGorevler }        from "@/store/gorevler";
import { useStok }            from "@/store/stok";
import { useBildirimler }     from "@/store/bildirimler";
import { useProsedurler }     from "@/store/prosedurler";
import { useAcilFon }         from "@/store/acilFon";
import { useIsletmeGiderleri } from "@/store/isletmeGiderleri";
import {
  nakitDB, gorevlerDB, stokDB, bildirimlerDB,
  prosedurlerDB, checklistDB,
  acilFonHedeflerDB, acilFonIslemlerDB,
  isletmeGiderleriDB,
} from "@/lib/db";

export default function DataProvider() {
  const yuklendi = useRef(false);

  const nakitSync      = useNakit((s) => s.syncFromRemote);
  const gorevSync      = useGorevler((s) => s.syncFromRemote);
  const stokSync       = useStok((s) => s.syncFromRemote);
  const bildirimSync   = useBildirimler((s) => s.syncFromRemote);
  const prosedurSync   = useProsedurler((s) => s.syncFromRemote);
  const acilFonSync    = useAcilFon((s) => s.syncFromRemote);
  const giderSync      = useIsletmeGiderleri((s) => s.syncFromRemote);

  useEffect(() => {
    if (yuklendi.current) return;
    yuklendi.current = true;

    const supabase = createClient();

    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;

      // 1. Tüm verileri paralel olarak çek
      const [
        islemler, gorevler, urunler, bildirimler,
        prosedurler, checklist,
        hedefler, fonIslemler, giderler,
      ] = await Promise.all([
        nakitDB.getAll(),
        gorevlerDB.getAll(),
        stokDB.getAll(),
        bildirimlerDB.getAll(),
        prosedurlerDB.getAll(),
        checklistDB.getAll(),
        acilFonHedeflerDB.getAll(),
        acilFonIslemlerDB.getAll(),
        isletmeGiderleriDB.getAll(),
      ]);

      // 2. Store'lara yükle
      nakitSync(islemler);
      gorevSync(gorevler);
      stokSync(urunler);
      bildirimSync(bildirimler);
      prosedurSync({ prosedurler, checklist });
      acilFonSync({ hedefler, islemler: fonIslemler, aktifHedefId: null });
      giderSync(giderler.map(({ dbId, ...g }) => ({ ...g, dbId })));

      // 3. Realtime — tablolardaki değişiklikleri dinle
      const kanal = supabase
        .channel(`db:${data.user.id}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "nakit_islemler", filter: `user_id=eq.${data.user.id}` }, async () => {
          nakitSync(await nakitDB.getAll());
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "gorevler", filter: `user_id=eq.${data.user.id}` }, async () => {
          gorevSync(await gorevlerDB.getAll());
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "stok_urunler", filter: `user_id=eq.${data.user.id}` }, async () => {
          stokSync(await stokDB.getAll());
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "bildirimler", filter: `user_id=eq.${data.user.id}` }, async () => {
          bildirimSync(await bildirimlerDB.getAll());
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "prosedurler", filter: `user_id=eq.${data.user.id}` }, async () => {
          const [p, c] = await Promise.all([prosedurlerDB.getAll(), checklistDB.getAll()]);
          prosedurSync({ prosedurler: p, checklist: c });
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "checklist_items", filter: `user_id=eq.${data.user.id}` }, async () => {
          const [p, c] = await Promise.all([prosedurlerDB.getAll(), checklistDB.getAll()]);
          prosedurSync({ prosedurler: p, checklist: c });
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "acil_fon_hedefler", filter: `user_id=eq.${data.user.id}` }, async () => {
          const [h, fi] = await Promise.all([acilFonHedeflerDB.getAll(), acilFonIslemlerDB.getAll()]);
          acilFonSync({ hedefler: h, islemler: fi, aktifHedefId: useAcilFon.getState().aktifHedefId });
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "acil_fon_islemler", filter: `user_id=eq.${data.user.id}` }, async () => {
          const [h, fi] = await Promise.all([acilFonHedeflerDB.getAll(), acilFonIslemlerDB.getAll()]);
          acilFonSync({ hedefler: h, islemler: fi, aktifHedefId: useAcilFon.getState().aktifHedefId });
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "isletme_giderleri", filter: `user_id=eq.${data.user.id}` }, async () => {
          const g = await isletmeGiderleriDB.getAll();
          giderSync(g.map(({ dbId, ...x }) => ({ ...x, dbId })));
        })
        .subscribe();

      return () => { supabase.removeChannel(kanal); };
    });
  }, [nakitSync, gorevSync, stokSync, bildirimSync, prosedurSync, acilFonSync, giderSync]);

  return null;
}
