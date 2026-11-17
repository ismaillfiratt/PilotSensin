import { createClient } from "@supabase/supabase-js";

// Supabase ücretsiz planı 7 gün işlem görmeyen projeyi duraklatır.
// Vercel Cron bu rotayı her gün çağırır; küçük bir sorgu projeyi uyanık tutar.
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ ok: false }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );

  const { error } = await supabase.from("companies").select("id").limit(1);
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });

  return Response.json({ ok: true, at: new Date().toISOString() });
}
