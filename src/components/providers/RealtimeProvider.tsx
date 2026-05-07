"use client";

import { useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { kanalAyarla } from "@/lib/realtime";
import { useNakit }       from "@/store/nakit";
import { useGorevler }    from "@/store/gorevler";
import { useStok }        from "@/store/stok";
import { useBildirimler } from "@/store/bildirimler";
import type { Islem }     from "@/lib/nakit-data";
import type { Gorev }     from "@/lib/gorev-data";
import type { Urun }      from "@/lib/stok-data";
import type { Bildirim }  from "@/store/bildirimler";

export default function RealtimeProvider() {
  const nakitSync       = useNakit((s) => s.syncFromRemote);
  const gorevSync       = useGorevler((s) => s.syncFromRemote);
  const stokSync        = useStok((s) => s.syncFromRemote);
  const bildirimSync    = useBildirimler((s) => s.syncFromRemote);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      const userId = data.user?.id;
      if (!userId) return;

      const kanal = supabase.channel(`pilot:${userId}`, {
        config: { broadcast: { self: false } },
      });

      // Gelen yayınları dinle
      kanal
        .on("broadcast", { event: "nakit" },       ({ payload }) => nakitSync(payload as Islem[]))
        .on("broadcast", { event: "gorevler" },     ({ payload }) => gorevSync(payload as Gorev[]))
        .on("broadcast", { event: "stok" },         ({ payload }) => stokSync(payload as Urun[]))
        .on("broadcast", { event: "bildirimler" },  ({ payload }) => bildirimSync(payload as Bildirim[]))
        .subscribe((status) => {
          if (status === "SUBSCRIBED") kanalAyarla(kanal as any);
        });

      return () => {
        kanalAyarla(null);
        supabase.removeChannel(kanal);
      };
    });
  }, [nakitSync, gorevSync, stokSync, bildirimSync]);

  return null;
}
