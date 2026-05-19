"use client";

import Link from "next/link";
import { Scale, FileText, Shield, Cookie, ShoppingCart, Info, RefreshCw, CheckSquare, Gauge } from "lucide-react";
import { useCerez } from "@/store/cerez";

const BELGELER = [
  { icon: Shield,      baslik: "KVKK Aydınlatma Metni",        aciklama: "Kişisel verilerinizin nasıl işlendiği",     href: "/politikalar/kvkk",               renk: "#22c55e" },
  { icon: FileText,    baslik: "Gizlilik Politikası",           aciklama: "Verilerinizi nasıl toplar ve koruruz",      href: "/politikalar/gizlilik",            renk: "#3b82f6" },
  { icon: Scale,       baslik: "Kullanım Koşulları",            aciklama: "Platform kullanım şartları ve haklar",      href: "/politikalar/kullanim-kosullari",  renk: "#a855f7" },
  { icon: Cookie,      baslik: "Çerez Politikası",              aciklama: "Çerezler ve tercihlerinizi yönetin",        href: "/politikalar/cerez",               renk: "#f97316" },
  { icon: ShoppingCart,baslik: "Mesafeli Satış Sözleşmesi",     aciklama: "Abonelik satış sözleşmesi",                 href: "/politikalar/mesafeli-satis",      renk: "var(--leaf)" },
  { icon: Info,        baslik: "Ön Bilgilendirme Formu",        aciklama: "Ödeme öncesi bilgilendirme",                href: "/politikalar/on-bilgilendirme",    renk: "#06b6d4" },
  { icon: RefreshCw,   baslik: "İade & İptal Politikası",       aciklama: "İptal ve iade koşulları",                   href: "/politikalar/iade-iptal",          renk: "#ef4444" },
  { icon: CheckSquare, baslik: "Açık Rıza Metni",               aciklama: "KVKK md. 9 veri aktarım rızası",           href: "/politikalar/acik-riza",           renk: "#8b5cf6" },
  { icon: Gauge,       baslik: "Hizmet Seviyesi (SLA)",         aciklama: "Uptime garantisi ve destek süreleri",       href: "/politikalar/sla",                 renk: "#14b8a6" },
];

export default function YasalBilgiler() {
  const { bannerAc } = useCerez();
  return (
    <div className="card rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-lg bg-[var(--mint)] border border-[var(--forest-100, #D9F2E4)] flex items-center justify-center">
          <Scale className="w-4 h-4 text-[var(--leaf)]" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-gray-800">Yasal & Gizlilik</h2>
          <p className="text-xs text-gray-400">Tüm yasal belgeler ve gizlilik ayarları</p>
        </div>
      </div>

      <div className="space-y-2">
        {BELGELER.map(({ icon: Icon, baslik, aciklama, href, renk }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 p-3.5 rounded-xl border transition-all group hover:border-[var(--forest-100, #D9F2E4)]"
            style={{ borderColor: "var(--border-subtle)", background: "var(--input-bg)" }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${renk}1a` }}
            >
              <Icon className="w-4 h-4" style={{ color: renk }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 group-hover:text-[var(--leaf)] transition-colors">
                {baslik}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{aciklama}</p>
            </div>
            <span className="text-gray-400 group-hover:text-[var(--leaf)] transition-colors text-xs shrink-0">›</span>
          </Link>
        ))}
      </div>

      <button
        onClick={bannerAc}
        className="w-full mt-3 py-2 rounded-xl border border-gray-200 text-gray-500 text-xs hover:border-[var(--forest-200, #B3E8C8)] hover:text-[var(--leaf)] transition-all"
      >
        🍪 Çerez Tercihlerini Güncelle
      </button>
    </div>
  );
}
