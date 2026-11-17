import { createClient } from "@/utils/supabase/client";

interface AktiviteParams {
  modul: string;
  eylem: string;
  ozet:  string;
  meta?: Record<string, unknown>;
}

/**
 * Fire-and-forget aktivite kaydı.
 * await edilmeyebilir — hata olsa bile ana akışı durdurmaz.
 */
export async function aktiviteKaydet(params: AktiviteParams): Promise<void> {
  try {
    const sb = createClient();

    const { data: { user } } = await sb.auth.getUser();
    if (!user) return;

    const { data: member } = await sb
      .from("company_members")
      .select("company_id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    await sb.from("activity_log").insert({
      user_id:    user.id,
      company_id: member?.company_id ?? null,
      modul:      params.modul,
      eylem:      params.eylem,
      ozet:       params.ozet,
      meta:       params.meta ?? null,
    });
  } catch (e) {
    console.warn("[aktiviteLog] kayıt başarısız:", e);
  }
}
