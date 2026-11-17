const LS_KEY = "pilotsensin-uyari-snooze-v1";

interface SnoozeKayit { [uyariId: string]: { sonBitis: number } }

function oku(): SnoozeKayit {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function yaz(kayit: SnoozeKayit) {
  localStorage.setItem(LS_KEY, JSON.stringify(kayit));
}

export function snoozeAl(uyariId: string, saatSayisi: number = 4): void {
  const kayit = oku();
  kayit[uyariId] = { sonBitis: Date.now() + saatSayisi * 3_600_000 };
  yaz(kayit);
}

export function snoozeMi(uyariId: string): boolean {
  const kayit = oku();
  const giris = kayit[uyariId];
  if (!giris) return false;

  if (giris.sonBitis > Date.now()) return true;

  // Süresi dolmuş — temizle
  const temiz = { ...kayit };
  delete temiz[uyariId];
  yaz(temiz);
  return false;
}

export function snoozeTemizle(uyariId: string): void {
  const kayit = oku();
  if (!kayit[uyariId]) return;
  const temiz = { ...kayit };
  delete temiz[uyariId];
  yaz(temiz);
}
