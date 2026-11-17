import * as XLSX              from "xlsx";
import JSZip                  from "jszip";
import { useStok }             from "@/store/stok";
import { useGorevler }         from "@/store/gorevler";
import { useNakit }            from "@/store/nakit";
import { useSatislar }         from "@/store/satislar";
import { useIsletmeGiderleri } from "@/store/isletmeGiderleri";
import { useAcilFon }          from "@/store/acilFon";
import { useProsedurler }      from "@/store/prosedurler";
import { useKdvHavuzu }        from "@/store/kdvHavuzu";
import { createClient }        from "@/utils/supabase/client";

// ── Metadata ─────────────────────────────────────────────────────────────────

export const MODUL_SHEET: Record<string, string> = {
  urunler:      "Ürünler",
  gorevler:     "Görevler",
  nakit:        "Nakit",
  satislar:     "Satışlar",
  giderler:     "Giderler",
  acilFonHedef: "Acil Fon Hedef",
  acilFonIslem: "Acil Fon İşlem",
  prosedurler:  "Prosedürler",
  checklist:    "Kontrol Listesi",
  kdvHavuzu:    "KDV",
  profil:       "Profil",
};

export const MODUL_DOSYA: Record<string, string> = {
  urunler:      "urunler",
  gorevler:     "gorevler",
  nakit:        "nakit",
  satislar:     "satislar",
  giderler:     "giderler",
  acilFonHedef: "acil-fon-hedef",
  acilFonIslem: "acil-fon-islem",
  prosedurler:  "prosedurler",
  checklist:    "checklist",
  kdvHavuzu:    "kdv",
  profil:       "profil",
};

// ── Yardımcılar ───────────────────────────────────────────────────────────────

function bugunTarih(): string {
  return new Date().toISOString().slice(0, 10);
}

function triggerDownload(blob: Blob, dosyaAdi: string): void {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement("a");
  a.href     = url;
  a.download = dosyaAdi;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function serializeDates(obj: unknown): Record<string, unknown> {
  if (!obj || typeof obj !== "object") return {};
  return Object.fromEntries(
    Object.entries(obj as Record<string, unknown>).map(([k, v]) => [
      k,
      v instanceof Date ? v.toISOString() : v,
    ])
  );
}

function csvEscape(val: unknown): string {
  if (val === null || val === undefined)  return "";
  if (val instanceof Date)               return `"${val.toISOString()}"`;
  if (typeof val === "object")           return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
  if (typeof val === "string")           return `"${val.replace(/"/g, '""')}"`;
  return String(val);
}

function arrayToCSV(arr: unknown[]): string {
  if (!arr.length) return "";
  const keys   = Object.keys(arr[0] as object);
  const header = keys.join(",");
  const rows   = (arr as Record<string, unknown>[]).map(
    (obj) => keys.map((k) => csvEscape(obj[k])).join(",")
  );
  return header + "\r\n" + rows.join("\r\n");
}

type Snapshot = Awaited<ReturnType<typeof tumVeriToplaSnapshot>>;

function toArray(val: Snapshot[keyof Snapshot]): Record<string, unknown>[] {
  if (!val)                return [];
  if (Array.isArray(val))  return (val as unknown as Record<string, unknown>[]).map(serializeDates);
  return [serializeDates(val)];
}

// ── Ana snapshot fonksiyonu ───────────────────────────────────────────────────

export async function tumVeriToplaSnapshot() {
  const { data: { user } } = await createClient().auth.getUser();

  return {
    profil: user ? {
      email:         user.email         ?? "",
      full_name:     user.user_metadata?.ad        ?? "",
      phone:         user.user_metadata?.telefon   ?? "",
      created_at:    user.created_at,
      export_tarihi: new Date().toISOString(),
    } : null,
    urunler:      useStok.getState().urunler.filter(u => !u.silindi),
    gorevler:     useGorevler.getState().gorevler.filter(g => !g.silindi),
    nakit:        useNakit.getState().islemler.filter(i => !i.silindi),
    satislar:     useSatislar.getState().kayitlar.filter(k => !k.silindi),
    giderler:     useIsletmeGiderleri.getState().giderler.filter(g => !g.silindi),
    acilFonHedef: useAcilFon.getState().hedefler.filter(h => !h.silindi),
    acilFonIslem: useAcilFon.getState().islemler.filter(i => !i.silindi),
    prosedurler:  useProsedurler.getState().prosedurler.filter(p => !p.silindi),
    checklist:    useProsedurler.getState().checklist.filter(c => !c.silindi),
    kdvHavuzu:    useKdvHavuzu.getState().kayitlar,
  };
}

// ── Export fonksiyonları ──────────────────────────────────────────────────────

export async function indirJSON(secilenModuller: string[]): Promise<string> {
  const snap = await tumVeriToplaSnapshot();
  const filtreli: Record<string, unknown> = {};
  for (const m of secilenModuller) {
    filtreli[m] = (snap as Record<string, unknown>)[m];
  }
  const json = JSON.stringify(
    filtreli,
    (_, val) => val instanceof Date ? val.toISOString() : val,
    2,
  );
  const blob     = new Blob([json], { type: "application/json" });
  const dosyaAdi = `pilotsensin-veri-${bugunTarih()}.json`;
  triggerDownload(blob, dosyaAdi);
  return dosyaAdi;
}

export async function indirExcel(secilenModuller: string[]): Promise<string> {
  const snap     = await tumVeriToplaSnapshot();
  const wb       = XLSX.utils.book_new();
  const dosyaAdi = `pilotsensin-veri-${bugunTarih()}.xlsx`;

  for (const m of secilenModuller) {
    const arr = toArray((snap as Record<string, unknown>)[m] as Snapshot[keyof Snapshot]);
    const ws  = XLSX.utils.json_to_sheet(arr.length ? arr : [{}]);
    XLSX.utils.book_append_sheet(wb, ws, MODUL_SHEET[m] ?? m);
  }

  XLSX.writeFile(wb, dosyaAdi);
  return dosyaAdi;
}

export async function indirCSVZip(secilenModuller: string[]): Promise<string> {
  const snap     = await tumVeriToplaSnapshot();
  const zip      = new JSZip();
  const dosyaAdi = `pilotsensin-veri-${bugunTarih()}.zip`;

  for (const m of secilenModuller) {
    const arr = toArray((snap as Record<string, unknown>)[m] as Snapshot[keyof Snapshot]);
    zip.file(`${MODUL_DOSYA[m] ?? m}.csv`, arrayToCSV(arr));
  }

  const blob = await zip.generateAsync({ type: "blob" });
  triggerDownload(blob, dosyaAdi);
  return dosyaAdi;
}
