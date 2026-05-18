import type { Bildirim } from "@/store/bildirimler";

export async function pushIzniIste(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied")  return false;
  const sonuc = await Notification.requestPermission();
  return sonuc === "granted";
}

export function pushGonder(b: Bildirim): void {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  const n = new Notification(b.baslik, {
    body:                b.mesaj,
    icon:                "/icon-192.png",
    badge:               "/icon-72.png",
    tag:                 b.id,
    requireInteraction:  b.tip === "kritik",
  });
  n.onclick = () => {
    window.focus();
    if (b.ilgiliLink) window.location.href = b.ilgiliLink;
  };
}
