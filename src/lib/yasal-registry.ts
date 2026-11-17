import dynamic from "next/dynamic";
import { Shield, FileText, Scale, Cookie, ShoppingCart, Info, RefreshCw, CheckSquare, Gauge } from "lucide-react";

export const YASAL_SLUGLAR = [
  "kvkk", "gizlilik", "kullanim-kosullari", "cerez",
  "mesafeli-satis", "on-bilgilendirme", "iade-iptal",
  "acik-riza", "sla",
] as const;

export type YasalSlug = (typeof YASAL_SLUGLAR)[number];

export const YASAL_BELGELER: {
  slug:     YasalSlug;
  baslik:   string;
  aciklama: string;
  icon:     typeof Shield;
  renk:     string;
}[] = [
  { slug: "kvkk",               baslik: "KVKK Aydınlatma Metni",      aciklama: "Kişisel verilerin işlenmesi",      icon: Shield,       renk: "#22c55e"       },
  { slug: "gizlilik",           baslik: "Gizlilik Politikası",        aciklama: "Verileri nasıl toplar ve koruruz", icon: FileText,     renk: "#3b82f6"       },
  { slug: "kullanim-kosullari", baslik: "Kullanım Koşulları",         aciklama: "Platform kullanım şartları",       icon: Scale,        renk: "#a855f7"       },
  { slug: "cerez",              baslik: "Çerez Politikası",           aciklama: "Çerezler ve tercihler",            icon: Cookie,       renk: "#f97316"       },
  { slug: "mesafeli-satis",     baslik: "Mesafeli Satış Sözleşmesi",  aciklama: "Abonelik satış sözleşmesi",        icon: ShoppingCart, renk: "var(--leaf)"   },
  { slug: "on-bilgilendirme",   baslik: "Ön Bilgilendirme Formu",     aciklama: "Ödeme öncesi bilgilendirme",       icon: Info,         renk: "#06b6d4"       },
  { slug: "iade-iptal",         baslik: "İade & İptal Politikası",    aciklama: "İptal ve iade koşulları",          icon: RefreshCw,    renk: "#ef4444"       },
  { slug: "acik-riza",          baslik: "Açık Rıza Metni",            aciklama: "KVKK md. 9 veri aktarım rızası",  icon: CheckSquare,  renk: "#8b5cf6"       },
  { slug: "sla",                baslik: "Hizmet Seviyesi (SLA)",      aciklama: "Uptime garantisi ve destek",       icon: Gauge,        renk: "#14b8a6"       },
];

export const YASAL_BELGE_BILESENLERI: Record<YasalSlug, React.ComponentType> = {
  "kvkk":               dynamic(() => import("@/components/yasal/belge/KvkkBelge")),
  "gizlilik":           dynamic(() => import("@/components/yasal/belge/GizlilikBelge")),
  "kullanim-kosullari": dynamic(() => import("@/components/yasal/belge/KullanimKosullariBelge")),
  "cerez":              dynamic(() => import("@/components/yasal/belge/CerezBelge")),
  "mesafeli-satis":     dynamic(() => import("@/components/yasal/belge/MesafeliSatisBelge")),
  "on-bilgilendirme":   dynamic(() => import("@/components/yasal/belge/OnBilgilendirmeBelge")),
  "iade-iptal":         dynamic(() => import("@/components/yasal/belge/IadeIptalBelge")),
  "acik-riza":          dynamic(() => import("@/components/yasal/belge/AcikRizaBelge")),
  "sla":                dynamic(() => import("@/components/yasal/belge/SLABelge")),
};
