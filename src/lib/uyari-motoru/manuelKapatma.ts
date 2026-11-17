const STORAGE_KEY = "pilot-uyari-manuel-kapali-v1";

interface ManuelKapali {
  olayId: string;
  kapatmaTarihi: string;
}

function oku(): Record<string, ManuelKapali> {
  if (typeof localStorage === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function yaz(veri: Record<string, ManuelKapali>): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(veri));
}

export function manuelKapat(olayId: string): void {
  const veri = oku();
  veri[olayId] = { olayId, kapatmaTarihi: new Date().toISOString() };
  yaz(veri);
}

export function manuelKapaliMi(olayId: string): boolean {
  return !!oku()[olayId];
}

export function manuelKapaliKaldir(olayId: string): void {
  const veri = oku();
  delete veri[olayId];
  yaz(veri);
}

export function manuelKapaliListe(): ManuelKapali[] {
  return Object.values(oku());
}
