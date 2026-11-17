// O/0/I/1 karışıklığı önlenmiş alfabe
const ALFABE = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** 10 rastgele karakter → XXXX-XXXX-XX formatında recovery kodu */
export function uretRecoveryCode(): string {
  const bytes = new Uint8Array(10);
  crypto.getRandomValues(bytes);
  const chars = Array.from(bytes, (b) => ALFABE[b % ALFABE.length]);
  // Format: 4-4-2
  return `${chars.slice(0, 4).join("")}-${chars.slice(4, 8).join("")}-${chars.slice(8).join("")}`;
}

/** Web Crypto API ile SHA-256 → hex string (client + server universal) */
export async function sha256Hex(metin: string): Promise<string> {
  const encoded = new TextEncoder().encode(metin);
  const hashBuf = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(hashBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** 64 karakter base64url rastgele token (trusted device cookie için) */
export function uretTrustedToken(): string {
  const bytes = new Uint8Array(48);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "")
    .slice(0, 64);
}

/** Cookie'den trusted device token'ını oku (client-side only) */
export function trustedTokenOku(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((c) => c.startsWith("pilot-trusted-device="));
  return match ? decodeURIComponent(match.split("=")[1]) : null;
}

/** User-Agent string'inden okunabilir cihaz etiketi üret */
export function parseDeviceLabel(ua: string): string {
  const browser =
    /Edg\//.test(ua) ? "Edge" :
    /Chrome\//.test(ua) ? "Chrome" :
    /Firefox\//.test(ua) ? "Firefox" :
    /Safari\//.test(ua) ? "Safari" : "Tarayıcı";

  const os =
    /Windows/.test(ua) ? "Windows" :
    /Mac OS X/.test(ua) ? "macOS" :
    /Linux/.test(ua) ? "Linux" :
    /iPhone|iPad/.test(ua) ? "iOS" :
    /Android/.test(ua) ? "Android" : "Cihaz";

  return `${browser} on ${os}`;
}
