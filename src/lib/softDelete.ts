import { getKullaniciId } from "@/lib/auth";
import type { Silinebilir } from "@/lib/silinebilir";

export interface SilOpts {
  kaskadIslemId?: string;
}

/** Bir kaydı soft delete için işaretler — silindi/silinmeTarihi/silenKullaniciId doldurur. */
export async function softDeletePatch(opts?: SilOpts): Promise<Partial<Silinebilir>> {
  const kullaniciId = await getKullaniciId().catch(() => "");
  return {
    silindi:          true,
    silinmeTarihi:    new Date().toISOString(),
    silenKullaniciId: kullaniciId || undefined,
    kaskadIslemId:    opts?.kaskadIslemId,
  };
}

/** Bir kaydın soft delete alanlarını temizler (geri al). */
export function softDeleteTemizle(): Partial<Silinebilir> {
  return {
    silindi:          false,
    silinmeTarihi:    undefined,
    silenKullaniciId: undefined,
    kaskadIslemId:    undefined,
  };
}
