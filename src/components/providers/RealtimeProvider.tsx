"use client";

import { useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { kanalAyarla } from "@/lib/realtime";
import { useNakit }            from "@/store/nakit";
import { useGorevler }         from "@/store/gorevler";
import { useStok }             from "@/store/stok";
import { useBildirimler }      from "@/store/bildirimler";
import { useProsedurler }      from "@/store/prosedurler";
import { useAcilFon }          from "@/store/acilFon";
import { useIsletmeGiderleri } from "@/store/isletmeGiderleri";
import type { Islem }          from "@/lib/nakit-data";
import type { Gorev }          from "@/lib/gorev-data";
import type { Urun }           from "@/lib/stok-data";
import type { Bildirim }       from "@/store/bildirimler";
import type { IsletmeGideri }  from "@/lib/kar-zarar-data";

export default function RealtimeProvider() {
  const nakitSync        = useNakit((s) => s.syncFromRemote);
  const gorevSync        = useGorevler((s) => s.syncFromRemote);
  const stokSync         = useStok((s) => s.syncFromRemote);
  const bildirimSync     = useBildirimler((s) => s.syncFromRemote);
  const prosedurSync     = useProsedurler((s) => s.syncFromRemote);
  const acilFonSync      = useAcilFon((s) => s.syncFromRemote);
  const giderSync        = useIsletmeGiderleri((s) => s.syncFromRemote);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      const userId = data.user?.id;
      if (!userId) return;

      const kanal = supabase.channel(`pilot:${userId}`, {
        config: { broadcast: { self: false } },
      });

      kanal
        .on("broadcast", { event: "nakit" },            ({ payload }) => nakitSync(payload as Islem[]))
        .on("broadcast", { event: "gorevler" },          ({ payload }) => gorevSync(payload as Gorev[]))
        .on("broadcast", { event: "stok" },              ({ payload }) => stokSync(payload as Urun[]))
        .on("broadcast", { event: "bildirimler" },       ({ payload }) => bildirimSync(payload as Bildirim[]))
        .on("broadcast", { event: "prosedurler" },       ({ payload }) => prosedurSync(payload as any))
        .on("broadcast", { event: "acil-fon" },          ({ payload }) => acilFonSync(payload as any))
        .on("broadcast", { event: "isletme-giderleri" }, ({ payload }) => giderSync(payload as any))
        .subscribe((status) => {
          if (status === "SUBSCRIBED") kanalAyarla(kanal as any);
        });

      return () => {
        kanalAyarla(null);
        supabase.removeChannel(kanal);
      };
    });
  }, [nakitSync, gorevSync, stokSync, bildirimSync, prosedurSync, acilFonSync, giderSync]);

  return null;
}
