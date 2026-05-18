import type { BildirimTip } from "@/store/bildirimler";

const sesler: Record<BildirimTip, string> = {
  kritik:  "/sounds/kritik.mp3",
  uyari:   "/sounds/uyari.mp3",
  bilgi:   "/sounds/bilgi.mp3",
  basari:  "/sounds/bilgi.mp3",
};

export function sesCal(tip: BildirimTip): void {
  try {
    const audio = new Audio(sesler[tip]);
    audio.volume = 0.6;
    audio.play().catch(() => null);
  } catch { /* autoplay engeli veya dosya yok — sessiz geç */ }
}
