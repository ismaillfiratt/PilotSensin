const DEPO_KEY = "pilot-modul-aksiyonlari-v1";

function oku(): Record<string, string> {
  if (typeof localStorage === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(DEPO_KEY) ?? "{}") as Record<string, string>;
  } catch {
    return {};
  }
}

export function aksiyonKaydet(modul: string): void {
  if (typeof localStorage === "undefined") return;
  const data = oku();
  data[modul] = new Date().toISOString();
  localStorage.setItem(DEPO_KEY, JSON.stringify(data));
}

export function sonAksiyonTarihi(modul: string): string | null {
  return oku()[modul] ?? null;
}
