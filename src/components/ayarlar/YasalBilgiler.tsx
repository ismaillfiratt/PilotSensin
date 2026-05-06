"use client";

import Link from "next/link";
import { Scale, FileText, Shield } from "lucide-react";

const BELGELER = [
  {
    icon: Shield,
    baslik: "KVKK Aydınlatma Metni",
    aciklama: "Kişisel verilerinizin nasıl işlendiği",
    href: "/politikalar/kvkk",
    renk: "#22c55e",
  },
  {
    icon: FileText,
    baslik: "Gizlilik Politikası",
    aciklama: "Verilerinizi nasıl toplar ve koruruz",
    href: "/politikalar/gizlilik",
    renk: "#3b82f6",
  },
  {
    icon: Scale,
    baslik: "Kullanım Koşulları",
    aciklama: "Platform kullanım şartları ve haklar",
    href: "/politikalar/kullanim-kosullari",
    renk: "#a855f7",
  },
];

export default function YasalBilgiler() {
  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-lg bg-[rgba(251,192,36,0.12)] border border-[rgba(251,192,36,0.2)] flex items-center justify-center">
          <Scale className="w-4 h-4 text-[#fbc024]" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white">Yasal & Gizlilik</h2>
          <p className="text-xs text-[#94a3b8]">KVKK, gizlilik ve kullanım koşulları</p>
        </div>
      </div>

      <div className="space-y-2">
        {BELGELER.map(({ icon: Icon, baslik, aciklama, href, renk }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 p-3.5 rounded-xl border transition-all group hover:border-[rgba(251,192,36,0.2)]"
            style={{ borderColor: "var(--border-subtle)", background: "var(--input-bg)" }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${renk}1a` }}
            >
              <Icon className="w-4 h-4" style={{ color: renk }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white group-hover:text-[#fbc024] transition-colors">
                {baslik}
              </p>
              <p className="text-xs text-[#94a3b8] mt-0.5">{aciklama}</p>
            </div>
            <span className="text-[#94a3b8] group-hover:text-[#fbc024] transition-colors text-xs shrink-0">›</span>
          </Link>
        ))}
      </div>

      <p className="text-[11px] text-[#94a3b8] mt-4 text-center leading-relaxed">
        Platformu kullanarak{" "}
        <Link href="/politikalar/kullanim-kosullari" className="text-[#fbc024] hover:underline">
          Kullanım Koşulları
        </Link>
        &apos;nı ve{" "}
        <Link href="/politikalar/kvkk" className="text-[#fbc024] hover:underline">
          KVKK Aydınlatma Metni
        </Link>
        &apos;ni kabul etmiş sayılırsınız.
      </p>
    </div>
  );
}
