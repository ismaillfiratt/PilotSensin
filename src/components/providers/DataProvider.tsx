"use client";

import { useEffect } from "react";
import { createClient }        from "@/utils/supabase/client";
import { userStoreDB }         from "@/lib/db";
import { useNakit }            from "@/store/nakit";
import { useGorevler }         from "@/store/gorevler";
import { useStok }             from "@/store/stok";
import { useBildirimler }      from "@/store/bildirimler";
import { useProsedurler }      from "@/store/prosedurler";
import { useAcilFon }          from "@/store/acilFon";
import { useIsletmeGiderleri } from "@/store/isletmeGiderleri";
import { useNakitAkis }        from "@/store/nakitAkis";
import { useSatislar }         from "@/store/satislar";

// Modül-seviyesi singleton: sayfa navigasyonlarında yeniden çalışmaz,
// sadece ilk oturumda başlatılır. Bu race condition'ı önler.
let _initialized = false;

async function initDataProvider() {
  if (_initialized) return;
  _initialized = true; // async beklemeden önce kilitle

  const supabase = createClient();
  const { data: sessionData } = await supabase.auth.getSession();

  if (!sessionData.session?.user) {
    _initialized = false; // Oturum yoksa kilidi aç, sonraki mount'ta tekrar dene
    return;
  }
  const userId = sessionData.session.user.id;

  async function yukle() {
    const veri = await userStoreDB.getAll();
    useNakit.getState().syncFromRemote(veri.nakit_islemler);
    useGorevler.getState().syncFromRemote(veri.gorevler);
    useStok.getState().syncFromRemote(veri.stok_urunler);
    useBildirimler.getState().syncFromRemote(veri.bildirimler);
    useProsedurler.getState().syncFromRemote({ prosedurler: veri.prosedurler, checklist: veri.checklist_items });
    useAcilFon.getState().syncFromRemote({ hedefler: veri.acil_fon_hedefler, islemler: veri.acil_fon_islemler, aktifHedefId: null });
    useIsletmeGiderleri.getState().syncFromRemote(veri.isletme_giderleri);
    useNakitAkis.getState().syncFromRemote({ kalemler: veri.nakit_planlanan, tekrarlayanlar: veri.nakit_tekrarlayan });
    useSatislar.getState().syncFromRemote(veri.satislar);
  }

  await yukle();

  // Realtime — user_store değişikliklerini dinle
  supabase
    .channel(`dp_user_store:${userId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "user_store", filter: `user_id=eq.${userId}` },
      () => { yukle(); }
    )
    .subscribe();

  // Realtime — company_store değişikliklerini dinle
  const { data: member } = await supabase
    .from("company_members")
    .select("company_id")
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (member?.company_id) {
    supabase
      .channel(`dp_company_store:${member.company_id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "company_store", filter: `company_id=eq.${member.company_id}` },
        () => { yukle(); }
      )
      .subscribe();
  }
}

export default function DataProvider() {
  useEffect(() => {
    initDataProvider();
  }, []);

  return null;
}
