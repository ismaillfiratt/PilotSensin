import { createClient } from "@/utils/supabase/client";

// Aktif kanal — kullanıcıya özgü
let _channel: ReturnType<ReturnType<typeof createClient>["channel"]> | null = null;

export function kanalAyarla(kanal: typeof _channel) {
  _channel = kanal;
}

export type SyncEvent =
  | { tip: "nakit";       veri: unknown }
  | { tip: "gorevler";    veri: unknown }
  | { tip: "stok";        veri: unknown }
  | { tip: "bildirimler"; veri: unknown };

export function yayin(event: SyncEvent) {
  if (!_channel) return;
  _channel.send({ type: "broadcast", event: event.tip, payload: event.veri });
}
