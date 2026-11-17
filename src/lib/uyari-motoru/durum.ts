const DEPO_KEY = "pilot-uyari-durumlari-v1";

export interface UyariDurum {
  olayId:            string;
  ilkBildirimTarihi: string;  // ISO
  sonBildirimTarihi: string;  // ISO
  sonMetric:         number;
  bildirimSayisi:    number;
}

function oku(): Record<string, UyariDurum> {
  if (typeof localStorage === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(DEPO_KEY) ?? "{}") as Record<string, UyariDurum>;
  } catch {
    return {};
  }
}

function yaz(data: Record<string, UyariDurum>): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(DEPO_KEY, JSON.stringify(data));
}

export function durumGetir(olayId: string): UyariDurum | undefined {
  return oku()[olayId];
}

export function durumKaydet(olayId: string, durum: UyariDurum): void {
  const data = oku();
  data[olayId] = durum;
  yaz(data);
}

export function durumSil(olayId: string): void {
  const data = oku();
  delete data[olayId];
  yaz(data);
}

export function tumDurumlar(): Record<string, UyariDurum> {
  return oku();
}
