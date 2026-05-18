import type { Metadata } from "next";
import Link from "next/link";
import {
  Shield, Eye, FileText, Cookie, ShoppingCart,
  Info, RefreshCw, CheckSquare, Gauge,
} from "lucide-react";

export const metadata: Metadata = { title: "Yasal Bilgiler – PilotSensin" };

const POLITIKALAR = [
  {
    href:     "/politikalar/kvkk",
    ikon:     Shield,
    baslik:   "KVKK Aydınlatma Metni",
    aciklama: "Kişisel verilerinizin nasıl işlendiğine ilişkin yasal bilgilendirme",
    renk:     "#3b82f6",
  },
  {
    href:     "/politikalar/gizlilik",
    ikon:     Eye,
    baslik:   "Gizlilik Politikası",
    aciklama: "Hangi verileri topladığımız ve nasıl kullandığımıza dair detaylar",
    renk:     "#8b5cf6",
  },
  {
    href:     "/politikalar/kullanim-kosullari",
    ikon:     FileText,
    baslik:   "Kullanım Koşulları",
    aciklama: "Platformu kullanırken geçerli olan hak ve yükümlülükler",
    renk:     "#fbc024",
  },
  {
    href:     "/politikalar/cerez",
    ikon:     Cookie,
    baslik:   "Çerez Politikası",
    aciklama: "Kullandığımız çerezler ve tercihlerinizi nasıl yönetebilirsiniz",
    renk:     "#f97316",
  },
  {
    href:     "/politikalar/mesafeli-satis",
    ikon:     ShoppingCart,
    baslik:   "Mesafeli Satış Sözleşmesi",
    aciklama: "6502 sayılı Tüketici Kanunu kapsamında abonelik sözleşmesi",
    renk:     "#22c55e",
  },
  {
    href:     "/politikalar/on-bilgilendirme",
    ikon:     Info,
    baslik:   "Ön Bilgilendirme Formu",
    aciklama: "Ödeme öncesinde sunulan zorunlu bilgilendirme belgesi",
    renk:     "#06b6d4",
  },
  {
    href:     "/politikalar/iade-iptal",
    ikon:     RefreshCw,
    baslik:   "İade & İptal Politikası",
    aciklama: "Abonelik iptali ve istisnai iade koşulları",
    renk:     "#ef4444",
  },
  {
    href:     "/politikalar/acik-riza",
    ikon:     CheckSquare,
    baslik:   "Açık Rıza Metni",
    aciklama: "KVKK madde 9 kapsamında veri aktarımına ilişkin rıza belgesi",
    renk:     "#a855f7",
  },
  {
    href:     "/politikalar/sla",
    ikon:     Gauge,
    baslik:   "Hizmet Seviyesi Sözleşmesi",
    aciklama: "Uptime garantisi, yanıt süreleri ve hizmet taahhütleri",
    renk:     "#14b8a6",
  },
];

export default function PolitikalarPage() {
  return (
    <div className="space-y-6">
      <div className="glass-card rounded-2xl p-6 md:p-8">
        <h1 className="text-2xl font-bold text-white mb-1">📋 Yasal Bilgiler</h1>
        <p className="text-sm text-[#94a3b8] mt-2">
          PilotSensin hizmetine ilişkin tüm yasal belgelere buradan ulaşabilirsiniz.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {POLITIKALAR.map(({ href, ikon: Ikon, baslik, aciklama, renk }) => (
          <Link key={href} href={href}
            className="glass-card rounded-2xl p-5 hover:bg-[rgba(255,255,255,0.02)] transition-all hover:scale-[1.01] group border border-transparent hover:border-[rgba(255,255,255,0.08)]">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
              style={{ backgroundColor: renk + "20", border: `1px solid ${renk}40` }}>
              <Ikon className="w-4 h-4" style={{ color: renk }} />
            </div>
            <p className="text-sm font-semibold text-white group-hover:text-[#e2e8f0] transition-colors leading-snug mb-1">
              {baslik}
            </p>
            <p className="text-xs text-[#64748b] leading-relaxed">{aciklama}</p>
          </Link>
        ))}
      </div>

      <div className="glass-card rounded-2xl p-5 text-center">
        <p className="text-xs text-[#64748b]">
          Sorularınız için{" "}
          <Link href="mailto:destek@pilotsensin.com" className="text-[#fbc024] hover:underline">
            destek@pilotsensin.com
          </Link>
          {" "}adresine yazabilirsiniz.
        </p>
      </div>
    </div>
  );
}
