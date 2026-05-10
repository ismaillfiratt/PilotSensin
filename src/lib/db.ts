/**
 * Supabase CRUD — tüm kullanıcı verisi user_store tablosunda JSONB olarak tutulur.
 * RLS sayesinde kullanıcı yalnızca kendi verisini görür/değiştirebilir.
 */
import { createClient } from "@/utils/supabase/client";
import type { Islem }          from "./nakit-data";
import type { Gorev }          from "./gorev-data";
import type { Urun }           from "./stok-data";
import type { Bildirim }       from "@/store/bildirimler";
import type { Prosedur, ChecklistItem } from "./prosedur-data";
import type { FonIslem, FonHedef }      from "./acil-fon-data";
import type { IsletmeGideri }           from "./kar-zarar-data";

const sb = () => createClient();

function kontrol(hata: unknown, islem: string) {
  if (hata) {
    const err = hata as { message?: string; code?: string; details?: string };
    const mesaj = err.message ?? String(hata);
    console.error(`[DB Hatası] ${islem}:`, mesaj, { code: err.code, details: err.details });
    if (typeof window !== "undefined") {
      window.__dbHata = `[${islem}] ${mesaj}${err.code ? ` (${err.code})` : ""}`;
    }
  }
}

declare global { interface Window { __dbHata?: string } }

/* ─── Tip tanımları ─── */

export type GiderItem = IsletmeGideri & { id: string };

export interface UserStoreData {
  nakit_islemler:    Islem[];
  gorevler:          Gorev[];
  stok_urunler:      Urun[];
  bildirimler:       Bildirim[];
  prosedurler:       Prosedur[];
  checklist_items:   ChecklistItem[];
  acil_fon_hedefler: FonHedef[];
  acil_fon_islemler: FonIslem[];
  isletme_giderleri: GiderItem[];
}

const BOŞ: UserStoreData = {
  nakit_islemler:    [],
  gorevler:          [],
  stok_urunler:      [],
  bildirimler:       [],
  prosedurler:       [],
  checklist_items:   [],
  acil_fon_hedefler: [],
  acil_fon_islemler: [],
  isletme_giderleri: [],
};

/* ─── Ana DB nesnesi ─── */

export const userStoreDB = {
  /** Kullanıcının tüm verisini çeker */
  getAll: async (): Promise<UserStoreData> => {
    const { data, error } = await sb()
      .from("user_store")
      .select("*")
      .maybeSingle();
    kontrol(error, "userStore.getAll");
    if (!data) return { ...BOŞ };
    return {
      nakit_islemler:    data.nakit_islemler    ?? [],
      gorevler:          data.gorevler          ?? [],
      stok_urunler:      data.stok_urunler      ?? [],
      bildirimler:       data.bildirimler       ?? [],
      prosedurler:       data.prosedurler       ?? [],
      checklist_items:   data.checklist_items   ?? [],
      acil_fon_hedefler: data.acil_fon_hedefler ?? [],
      acil_fon_islemler: data.acil_fon_islemler ?? [],
      isletme_giderleri: data.isletme_giderleri ?? [],
    };
  },

  /** Tek bir alanı günceller (upsert) */
  kaydet: async <K extends keyof UserStoreData>(
    userId: string,
    alan: K,
    veri: UserStoreData[K]
  ): Promise<void> => {
    const { error } = await sb()
      .from("user_store")
      .upsert(
        { user_id: userId, [alan]: veri },
        { onConflict: "user_id" }
      );
    kontrol(error, `userStore.kaydet(${alan})`);
  },
};
