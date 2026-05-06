import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  const pool = new Pool({
    host:     "aws-0-ap-southeast-1.pooler.supabase.com",
    port:     6543,
    user:     "postgres.woyrzmxuahhigfkvkmyh",
    password: "Firat.1998..",
    database: "postgres",
    ssl:      { rejectUnauthorized: false },
    max:      1,
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter } as any);
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
