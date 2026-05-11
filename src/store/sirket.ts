import { create } from "zustand";
import { createClient } from "@/utils/supabase/client";

export type Rol = "pilot" | "copilot";

interface SirketStore {
  companyId:  string | null;
  rol:        Rol | null;
  sirketAdi:  string;
  maxUye:     number;
  yuklendi:   boolean;

  yukle:   () => Promise<void>;
  sifirla: () => void;
}

export const useSirket = create<SirketStore>((set) => ({
  companyId:  null,
  rol:        null,
  sirketAdi:  "",
  maxUye:     3,
  yuklendi:   false,

  yukle: async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { set({ yuklendi: true }); return; }

    const { data } = await supabase
      .from("company_members")
      .select("company_id, role, companies(name, max_members)")
      .eq("user_id", session.user.id)
      .eq("status", "active")
      .maybeSingle();

    if (!data) { set({ yuklendi: true }); return; }

    const c = data.companies as unknown as { name: string; max_members: number } | null;
    set({
      companyId: data.company_id,
      rol:       data.role as Rol,
      sirketAdi: c?.name ?? "",
      maxUye:    c?.max_members ?? 3,
      yuklendi:  true,
    });
  },

  sifirla: () => set({ companyId: null, rol: null, sirketAdi: "", yuklendi: false }),
}));

export function isPilot()   { return useSirket.getState().rol === "pilot"; }
export function isCopilot() { return useSirket.getState().rol === "copilot"; }
