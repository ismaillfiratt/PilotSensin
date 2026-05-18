"use client";

import { useEffect } from "react";
import { createClient }        from "@/utils/supabase/client";
import { kanalAyarla }         from "@/lib/realtime";
import { useNakit }            from "@/store/nakit";
import { useGorevler }         from "@/store/gorevler";
import { useStok }             from "@/store/stok";
import { useBildirimler }      from "@/store/bildirimler";
import { useSirket }           from "@/store/sirket";
import { useProsedurler }      from "@/store/prosedurler";
import { useAcilFon }          from "@/store/acilFon";
import { useIsletmeGiderleri } from "@/store/isletmeGiderleri";
import { useSatislar }         from "@/store/satislar";
import { useKdvHavuzu }        from "@/store/kdvHavuzu";
import type { Islem }          from "@/lib/nakit-data";
import type { Gorev }          from "@/lib/gorev-data";
import type { Urun }           from "@/lib/stok-data";
import type { Bildirim }       from "@/store/bildirimler";
import type { GiderItem }      from "@/lib/db";
import type { Prosedur, ChecklistItem } from "@/lib/prosedur-data";
import type { FonHedef, FonIslem }      from "@/lib/acil-fon-data";
import type { SatisKaydi }             from "@/store/satislar";
import type { KdvKaydi }               from "@/store/kdvHavuzu";

export default function RealtimeProvider() {
  const nakitSync      = useNakit((s) => s.syncFromRemote);
  const gorevSync      = useGorevler((s) => s.syncFromRemote);
  const stokSync       = useStok((s) => s.syncFromRemote);
  const bildirimSync   = useBildirimler((s) => s.syncFromRemote);
  const hedefliEkleRef = useBildirimler((s) => s.hedefliEkle);
  const prosedurSync   = useProsedurler((s) => s.syncFromRemote);
  const acilFonSync    = useAcilFon((s) => s.syncFromRemote);
  const giderSync      = useIsletmeGiderleri((s) => s.syncFromRemote);
  const satislarSync   = useSatislar((s) => s.syncFromRemote);
  const kdvSync        = useKdvHavuzu((s) => s.syncFromRemote);
  const mevcutRol      = useSirket((s) => (s.rol || "pilot") as "pilot" | "copilot");

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      const userId = data.user?.id;
      if (!userId) return;

      const kanal = supabase.channel(`pilot:${userId}`, {
        config: { broadcast: { self: false } },
      });

      kanal
        .on("broadcast", { event: "nakit" },
          ({ payload }) => nakitSync(payload as Islem[]))
        .on("broadcast", { event: "gorevler" },
          ({ payload }) => gorevSync(payload as Gorev[]))
        .on("broadcast", { event: "stok" },
          ({ payload }) => stokSync(payload as Urun[]))
        .on("broadcast", { event: "bildirimler" },
          ({ payload }) => bildirimSync(payload as Bildirim[]))
        .on("broadcast", { event: "bildirim" }, ({ payload }) => {
          const { bildirim } = payload as { bildirim: Bildirim };
          if (bildirim) void hedefliEkleRef(bildirim, mevcutRol);
        })
        .on("broadcast", { event: "prosedurler" },
          ({ payload }) => {
            const d = payload as { prosedurler: Prosedur[]; checklist: ChecklistItem[] };
            prosedurSync(d);
          })
        .on("broadcast", { event: "acil-fon" },
          ({ payload }) => {
            const d = payload as { hedefler: FonHedef[]; islemler: FonIslem[]; aktifHedefId: string | null };
            acilFonSync(d);
          })
        .on("broadcast", { event: "isletme-giderleri" },
          ({ payload }) => giderSync(payload as GiderItem[]))
        .on("broadcast", { event: "satislar" },
          ({ payload }) => satislarSync(payload as SatisKaydi[]))
        .on("broadcast", { event: "kdv-havuzu" },
          ({ payload }) => kdvSync(payload as KdvKaydi[]))
        .subscribe((status) => {
          if (status === "SUBSCRIBED") kanalAyarla(kanal as ReturnType<typeof supabase.channel>);
        });

      return () => {
        kanalAyarla(null);
        supabase.removeChannel(kanal);
      };
    });
  }, [nakitSync, gorevSync, stokSync, bildirimSync, hedefliEkleRef, prosedurSync, acilFonSync, giderSync, satislarSync, kdvSync, mevcutRol]);

  return null;
}
