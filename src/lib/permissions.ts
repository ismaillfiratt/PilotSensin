export interface AltSekme {
  key:   string;
  label: string;
  href:  string;
}

export interface Modul {
  key:         string;
  label:       string;
  altSekmeler?: readonly AltSekme[];
}

export const MODULLER: readonly Modul[] = [
  { key: "dashboard",   label: "Dashboard"        },
  {
    key: "nakit-akisi", label: "Nakit Akışı",
    altSekmeler: [
      { key: "borclar", label: "Borçlar", href: "/nakit-akisi/borclar" },
    ],
  },
  { key: "kar-zarar",   label: "Kar-Zarar"        },
  { key: "stok",        label: "Stok Yönetimi"    },
  { key: "gorevler",    label: "Görevler"         },
  { key: "prosedurler", label: "Prosedürler"      },
  { key: "acil-fon",    label: "Acil Durum Fonu"  },
  { key: "ekip",        label: "Ekip Yönetimi"    },
] as const;

export type ModulKey =
  | "dashboard"
  | "nakit-akisi"
  | "kar-zarar"
  | "stok"
  | "gorevler"
  | "prosedurler"
  | "acil-fon"
  | "ekip";

export interface Permissions {
  modules: Record<ModulKey, boolean>;
  canEdit: boolean;
}

export const PILOT_PERMISSIONS: Permissions = {
  modules: {
    "dashboard":   true,
    "nakit-akisi": true,
    "kar-zarar":   true,
    "stok":        true,
    "gorevler":    true,
    "prosedurler": true,
    "acil-fon":    true,
    "ekip":        true,
  },
  canEdit: true,
};

export const COPILOT_PERMISSIONS: Permissions = {
  modules: {
    "dashboard":   true,
    "nakit-akisi": true,
    "kar-zarar":   true,
    "stok":        true,
    "gorevler":    true,
    "prosedurler": true,
    "acil-fon":    true,
    "ekip":        true,
  },
  canEdit: true,
};

export function bosPermissions(): Permissions {
  return {
    modules: {
      "dashboard":   true,
      "nakit-akisi": false,
      "kar-zarar":   false,
      "stok":        false,
      "gorevler":    false,
      "prosedurler": false,
      "acil-fon":    false,
      "ekip":        false,
    },
    canEdit: false,
  };
}

export function modulErisilebilir(permissions: Permissions | null, modul: string): boolean {
  if (!permissions) return false;
  return permissions.modules[modul as ModulKey] ?? false;
}
