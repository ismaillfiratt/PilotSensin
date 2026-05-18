import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const OTUZ_GUN_MS = 30 * 24 * 60 * 60 * 1000;

/** company_store içindeki alan adları (JSONB array) */
const SIRKET_ALANLARI = [
  "stok_urunler",
  "satislar",
  "nakit_islemler",
  "gorevler",
  "acil_fon_hedefler",
  "acil_fon_islemler",
  "isletme_giderleri",
  "bildirimler",
  "prosedurler",
  "checklist_items",
];

/** user_store içindeki alan adları (JSONB array) */
const KULLANICI_ALANLARI = [
  "nakit_islemler",
  "bildirimler",
  "prosedurler",
  "checklist_items",
];

type KayitSatiri = Record<string, unknown[]>;

function eskiMi(kayit: Record<string, unknown>): boolean {
  if (!kayit.silindi) return false;
  const tarih = kayit.silinmeTarihi as string | undefined;
  if (!tarih) return false;
  return Date.now() - new Date(tarih).getTime() > OTUZ_GUN_MS;
}

async function tabloTemizle(
  sb: ReturnType<typeof createClient>,
  tablo: string,
  alanlar: string[],
): Promise<{ tablo: string; silinen: number }> {
  const { data, error } = await sb.from(tablo).select("id," + alanlar.join(","));
  if (error || !data) return { tablo, silinen: 0 };

  let toplamSilinen = 0;

  for (const satir of data as KayitSatiri[]) {
    const guncellemeler: Record<string, unknown[]> = {};
    let degisti = false;

    for (const alan of alanlar) {
      const liste = (satir[alan] as Record<string, unknown>[] | undefined) ?? [];
      const temizli = liste.filter((x) => !eskiMi(x));
      if (temizli.length !== liste.length) {
        toplamSilinen += liste.length - temizli.length;
        guncellemeler[alan] = temizli;
        degisti = true;
      }
    }

    if (degisti) {
      await sb.from(tablo).update(guncellemeler).eq("id", satir.id);
    }
  }

  return { tablo, silinen: toplamSilinen };
}

Deno.serve(async (req) => {
  /* Servis rolü doğrulaması */
  const auth = req.headers.get("Authorization") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!auth.includes(serviceKey)) {
    return new Response("Yetkisiz", { status: 401 });
  }

  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    serviceKey,
  );

  const sonuclar = await Promise.all([
    tabloTemizle(sb, "company_store", SIRKET_ALANLARI),
    tabloTemizle(sb, "user_store",    KULLANICI_ALANLARI),
  ]);

  const toplamSilinen = sonuclar.reduce((t, r) => t + r.silinen, 0);

  console.log("[cop-temizle]", sonuclar, "toplam:", toplamSilinen);

  return new Response(
    JSON.stringify({ ok: true, toplamSilinen, sonuclar }),
    { headers: { "Content-Type": "application/json" } },
  );
});
