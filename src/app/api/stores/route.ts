import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

async function getUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return (session?.user as any)?.id ?? null;
}

// GET /api/stores — tüm store verilerini döner
export async function GET() {
  const userId = await getUserId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await prisma.userStore.findMany({ where: { userId } });

  const data: Record<string, unknown> = {};
  for (const row of rows) data[row.storeKey] = row.data;

  return Response.json({ data, userId });
}

// POST /api/stores — bir store'u kaydeder
export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { storeKey, data } = await req.json();
  if (!storeKey || data === undefined)
    return Response.json({ error: "Bad request" }, { status: 400 });

  await prisma.userStore.upsert({
    where:  { userId_storeKey: { userId, storeKey } },
    create: { id: `${userId}-${storeKey}`, userId, storeKey, data },
    update: { data },
  });

  return Response.json({ ok: true });
}
