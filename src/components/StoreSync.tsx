"use client";

import { useEffect, useRef } from "react";
import { createClient }   from "@/utils/supabase/client";
import { useStok }        from "@/store/stok";
import { useNakit }       from "@/store/nakit";
import { useGorevler }    from "@/store/gorevler";
import { useProsedurler } from "@/store/prosedurler";
import { useAcilFon }     from "@/store/acilFon";

const TABLE = "UserStore";
const USER_KEY = "pilot-current-user";

function extractData(state: Record<string, unknown>) {
  try { return JSON.parse(JSON.stringify(state)); } catch { return null; }
}

const STORES = [
  { key: "pilot-stok",        store: useStok        },
  { key: "pilot-nakit",       store: useNakit       },
  { key: "pilot-gorevler",    store: useGorevler    },
  { key: "pilot-prosedurler", store: useProsedurler },
  { key: "pilot-acil-fon-v2", store: useAcilFon     },
] as const;

const BOSLUK: Record<string, Record<string, unknown>> = {
  "pilot-stok":        { urunler: [] },
  "pilot-nakit":       { islemler: [] },
  "pilot-gorevler":    { gorevler: [] },
  "pilot-prosedurler": {
    prosedurler: [], checklist: [], ozelKategoriler: [], ozelSorumlular: [],
    gizliVarsayilanKategoriler: [], gizliVarsayilanSorumlular: [],
    silinenSablonMaddeleri: [], ozelSablonMaddeleri: [],
    ozelGrupAdlari: {}, ozelSablonGruplari: [],
    silinenSopSablonMaddeleri: [], ozelSopSablonMaddeleri: [],
    ozelSopGrupAdlari: {}, ozelSopSablonGruplari: [],
  },
  "pilot-acil-fon-v2": { hedefler: [], islemler: [], aktifHedefId: null },
};

export default function StoreSync() {
  const isLoadingRef = useRef(true);
  const timersRef    = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    let currentUserId: string | null = null;

    const save = (userId: string, key: string, state: Record<string, unknown>) => {
      if (isLoadingRef.current) return;
      clearTimeout(timersRef.current[key]);
      timersRef.current[key] = setTimeout(async () => {
        const data = extractData(state);
        if (!data) return;
        const supabase = createClient();
        await supabase.from(TABLE).upsert(
          { id: `${userId}-${key}`, userId, storeKey: key, data, updatedAt: new Date().toISOString() },
          { onConflict: "userId,storeKey" }
        );
      }, 1500);
    };

    // Store değişimlerini dinle — userId set edilene kadar save engellidir
    const unsubs = STORES.map(({ key, store }) =>
      (store as any).subscribe((s: Record<string, unknown>) => {
        if (currentUserId) save(currentUserId, key, s);
      })
    );

    // NextAuth session'dan userId al
    fetch("/api/auth/session")
      .then(r => r.json())
      .then(async (session) => {
        const userId: string | undefined = (session?.user as any)?.id;
        if (!userId) return;

        currentUserId = userId;
        const supabase = createClient();

        // Farklı kullanıcıysa store'ları sıfırla
        const lastUserId = localStorage.getItem(USER_KEY);
        if (lastUserId && lastUserId !== userId) {
          for (const { key, store } of STORES) {
            const bos = BOSLUK[key];
            if (bos) (store as any).setState(bos);
          }
        }
        localStorage.setItem(USER_KEY, userId);

        // Supabase'den kullanıcı verilerini yükle
        const { data: rows, error } = await supabase
          .from(TABLE)
          .select("storeKey, data")
          .eq("userId", userId);

        if (!error && rows) {
          for (const row of rows) {
            const entry = STORES.find(s => s.key === row.storeKey);
            if (entry && row.data && typeof row.data === "object") {
              (entry.store as any).setState(row.data);
            }
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        isLoadingRef.current = false;
      });

    return () => {
      unsubs.forEach(u => u());
      Object.values(timersRef.current).forEach(clearTimeout);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
