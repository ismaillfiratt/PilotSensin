import { create } from "zustand";
import { createClient } from "@/utils/supabase/client";
import type { Permissions } from "@/lib/permissions";
import { PILOT_PERMISSIONS } from "@/lib/permissions";

export type Rol = "pilot" | "copilot" | string;

interface SirketStore {
  companyId:    string | null;
  rol:          Rol | null;
  rolAdi:       string;
  sirketAdi:    string;
  maxUye:       number;
  permissions:  Permissions | null;
  yuklendi:     boolean;
  isPremium:    boolean;
  trialEndsAt:  Date | null;

  yukle:   () => Promise<void>;
  sifirla: () => void;
}

export const useSirket = create<SirketStore>((set) => ({
  companyId:   null,
  rol:         null,
  rolAdi:      "",
  sirketAdi:   "",
  maxUye:      3,
  permissions: null,
  yuklendi:    false,
  isPremium:   true,
  trialEndsAt: null,

  yukle: async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { set({ yuklendi: true }); return; }

    // Önce abonelik alanlarıyla dene; migration henüz uygulanmamışsa fallback'e geç
    const { data, error } = await supabase
      .from("company_members")
      .select("company_id, role, permissions, company_roles(name), companies(name, max_members, is_premium, trial_ends_at)")
      .eq("user_id", session.user.id)
      .eq("status", "active")
      .maybeSingle();

    // Kolon yoksa (migration uygulanmamış) temel sorguyla tekrar dene
    if (error) {
      const { data: basicData } = await supabase
        .from("company_members")
        .select("company_id, role, permissions, company_roles(name), companies(name, max_members)")
        .eq("user_id", session.user.id)
        .eq("status", "active")
        .maybeSingle();

      if (!basicData) { set({ yuklendi: true }); return; }

      const company  = basicData.companies as unknown as { name: string; max_members: number } | null;
      const roleObj  = basicData.company_roles as unknown as { name: string } | null;
      const isPilot  = basicData.role === "pilot";

      set({
        companyId:   basicData.company_id,
        rol:         basicData.role as Rol,
        rolAdi:      roleObj?.name ?? (isPilot ? "Pilot" : "Co-Pilot"),
        sirketAdi:   company?.name ?? "",
        maxUye:      company?.max_members ?? 3,
        permissions: isPilot ? PILOT_PERMISSIONS : (basicData.permissions as Permissions | null),
        yuklendi:    true,
        isPremium:   true,   // migration uygulanmamış → premium say, kilitlenmesin
        trialEndsAt: null,
      });
      return;
    }

    if (!data) { set({ yuklendi: true }); return; }

    const company = data.companies as unknown as {
      name: string; max_members: number;
      is_premium: boolean; trial_ends_at: string | null;
    } | null;
    const roleObj = data.company_roles as unknown as { name: string } | null;
    const isPilot = data.role === "pilot";

    set({
      companyId:   data.company_id,
      rol:         data.role as Rol,
      rolAdi:      roleObj?.name ?? (isPilot ? "Pilot" : "Co-Pilot"),
      sirketAdi:   company?.name ?? "",
      maxUye:      company?.max_members ?? 3,
      permissions: isPilot ? PILOT_PERMISSIONS : (data.permissions as Permissions | null),
      yuklendi:    true,
      isPremium:   company?.is_premium ?? true,
      trialEndsAt: company?.trial_ends_at ? new Date(company.trial_ends_at) : null,
    });
  },

  sifirla: () => set({
    companyId: null, rol: null, rolAdi: "", sirketAdi: "",
    permissions: null, yuklendi: false, isPremium: true, trialEndsAt: null,
  }),
}));

/* ─── Yardımcı fonksiyonlar ─────────────────────────────────────────────── */

export function trialGunKaldi(trialEndsAt: Date | null): number {
  if (!trialEndsAt) return 0;
  const ms = trialEndsAt.getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export function trialAktif(isPremium: boolean, trialEndsAt: Date | null): boolean {
  if (isPremium) return true;
  if (!trialEndsAt) return false;
  return trialEndsAt.getTime() > Date.now();
}

export function aylikTutar(aktifCoPilotSayisi: number): number {
  return 499 + Math.max(0, aktifCoPilotSayisi - 3) * 100;
}
