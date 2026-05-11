/**
 * Supabase CRUD — şirket verisi company_store tablosunda JSONB olarak tutulur.
 * Tüm şirket üyeleri (pilot + copilot) aynı company_store satırını okur/yazar.
 * Kullanıcıya özel veriler (bildirimler) hâlâ user_store'da kalır.
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

/* ─── Şirket veri deposu ─── */

export const userStoreDB = {
  getAll: async (): Promise<UserStoreData> => {
    // Önce company_store'dan çek (şirket üyesi ise)
    const { data: cs } = await sb()
      .from("company_store")
      .select("*")
      .maybeSingle();

    if (cs) {
      return {
        nakit_islemler:    cs.nakit_islemler    ?? [],
        gorevler:          cs.gorevler          ?? [],
        stok_urunler:      cs.stok_urunler      ?? [],
        bildirimler:       [],  // bildirimler kullanıcıya özel: user_store'dan gelir
        prosedurler:       cs.prosedurler       ?? [],
        checklist_items:   cs.checklist_items   ?? [],
        acil_fon_hedefler: cs.acil_fon_hedefler ?? [],
        acil_fon_islemler: cs.acil_fon_islemler ?? [],
        isletme_giderleri: cs.isletme_giderleri ?? [],
      };
    }

    // Şirket yoksa user_store'a geri düş (eski kullanıcı / onboarding öncesi)
    const { data: us, error } = await sb()
      .from("user_store")
      .select("*")
      .maybeSingle();
    kontrol(error, "userStore.getAll");
    if (!us) return { ...BOŞ };
    return {
      nakit_islemler:    us.nakit_islemler    ?? [],
      gorevler:          us.gorevler          ?? [],
      stok_urunler:      us.stok_urunler      ?? [],
      bildirimler:       us.bildirimler       ?? [],
      prosedurler:       us.prosedurler       ?? [],
      checklist_items:   us.checklist_items   ?? [],
      acil_fon_hedefler: us.acil_fon_hedefler ?? [],
      acil_fon_islemler: us.acil_fon_islemler ?? [],
      isletme_giderleri: us.isletme_giderleri ?? [],
    };
  },

  kaydet: async <K extends keyof UserStoreData>(
    userOrCompanyId: string,
    alan: K,
    veri: UserStoreData[K]
  ): Promise<void> => {
    // Bildirimler her zaman user_store'a gider
    if (alan === "bildirimler") {
      const { error } = await sb()
        .from("user_store")
        .upsert({ user_id: userOrCompanyId, [alan]: veri }, { onConflict: "user_id" });
      kontrol(error, `userStore.kaydet(${alan})`);
      return;
    }

    // Diğer veriler: company_store varsa oraya, yoksa user_store'a
    const { data: member } = await sb()
      .from("company_members")
      .select("company_id")
      .eq("user_id", userOrCompanyId)
      .eq("status", "active")
      .maybeSingle();

    if (member?.company_id) {
      const { error } = await sb()
        .from("company_store")
        .upsert({ company_id: member.company_id, [alan]: veri }, { onConflict: "company_id" });
      kontrol(error, `companyStore.kaydet(${alan})`);
    } else {
      const { error } = await sb()
        .from("user_store")
        .upsert({ user_id: userOrCompanyId, [alan]: veri }, { onConflict: "user_id" });
      kontrol(error, `userStore.kaydet(${alan})`);
    }
  },
};

/* ─── Şirket yönetimi ─── */

export const sirketDB = {
  /** Şirket kur + owner olarak üye ekle + user_store verisini company_store'a taşı */
  kur: async (userId: string, sirketAdi: string): Promise<string | null> => {
    // 1. Şirket oluştur
    const { data: company, error: ce } = await sb()
      .from("companies")
      .insert({ name: sirketAdi, owner_id: userId })
      .select("id")
      .single();
    if (ce || !company) { kontrol(ce, "sirket.kur"); return null; }

    // 2. Owner'ı pilot olarak ekle
    await sb().from("company_members").insert({
      company_id: company.id,
      user_id:    userId,
      email:      (await sb().auth.getUser()).data.user?.email ?? "",
      role:       "pilot",
      status:     "active",
      joined_at:  new Date().toISOString(),
    });

    // 3. Eski user_store verisini company_store'a taşı
    const { data: us } = await sb().from("user_store").select("*").maybeSingle();
    if (us) {
      await sb().from("company_store").upsert({
        company_id:        company.id,
        nakit_islemler:    us.nakit_islemler    ?? [],
        gorevler:          us.gorevler          ?? [],
        stok_urunler:      us.stok_urunler      ?? [],
        prosedurler:       us.prosedurler       ?? [],
        checklist_items:   us.checklist_items   ?? [],
        acil_fon_hedefler: us.acil_fon_hedefler ?? [],
        acil_fon_islemler: us.acil_fon_islemler ?? [],
        isletme_giderleri: us.isletme_giderleri ?? [],
      }, { onConflict: "company_id" });
    }

    return company.id;
  },

  /** Davet token'ı ile üye oluştur */
  davetKabul: async (token: string, userId: string, email: string): Promise<boolean> => {
    const { data: inv } = await sb()
      .from("invitations")
      .select("*")
      .eq("token", token)
      .is("accepted_at", null)
      .gte("expires_at", new Date().toISOString())
      .maybeSingle();
    if (!inv) return false;

    // Üye ekle
    await sb().from("company_members").upsert({
      company_id: inv.company_id,
      user_id:    userId,
      email,
      role:       inv.role,
      status:     "active",
      joined_at:  new Date().toISOString(),
    }, { onConflict: "company_id,email" });

    // Daveti kapat
    await sb().from("invitations").update({ accepted_at: new Date().toISOString() }).eq("id", inv.id);
    return true;
  },
};
