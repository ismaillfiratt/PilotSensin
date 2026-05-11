import { create } from "zustand";
import { createClient } from "@/utils/supabase/client";
import type { Permissions } from "@/lib/permissions";
import { PILOT_PERMISSIONS } from "@/lib/permissions";

export type Rol = "pilot" | "copilot" | string;

interface SirketStore {
  companyId:   string | null;
  rol:         Rol | null;
  rolAdi:      string;
  sirketAdi:   string;
  maxUye:      number;
  permissions: Permissions | null;
  yuklendi:    boolean;

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

  yukle: async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { set({ yuklendi: true }); return; }

    const { data } = await supabase
      .from("company_members")
      .select("company_id, role, permissions, company_roles(name), companies(name, max_members)")
      .eq("user_id", session.user.id)
      .eq("status", "active")
      .maybeSingle();

    if (!data) { set({ yuklendi: true }); return; }

    const company = data.companies as unknown as { name: string; max_members: number } | null;
    const roleObj = data.company_roles as unknown as { name: string } | null;
    const isPilot = data.role === "pilot";

    set({
      companyId:   data.company_id,
      rol:         data.role as Rol,
      rolAdi:      roleObj?.name ?? (isPilot ? "Pilot" : "Co-Pilot"),
      sirketAdi:   company?.name ?? "",
      maxUye:      company?.max_members ?? 3,
      permissions: isPilot
        ? PILOT_PERMISSIONS
        : (data.permissions as Permissions | null),
      yuklendi:    true,
    });
  },

  sifirla: () => set({ companyId: null, rol: null, rolAdi: "", sirketAdi: "", permissions: null, yuklendi: false }),
}));
