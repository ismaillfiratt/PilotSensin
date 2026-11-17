import Link from "next/link";
import { BellRing, AlertTriangle, X } from "lucide-react";

export default function Hero() {
  return (
    <section style={{ background: "#ffffff" }} className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        {/* KVKK badges */}
        <div className="flex flex-wrap gap-2 mb-5">
          {[
            { Icon: BellRing,      label: "Risk varsa anında uyarı" },
            { Icon: AlertTriangle, label: "9 erken uyarı modülü" },
            { Icon: X,             label: "Taahhüt yok, iptal serbest" },
          ].map(({ Icon, label }) => (
            <span key={label} style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              fontSize: 11, padding: "4px 10px", borderRadius: 999,
              background: "#EAF3DE", color: "#27500A", fontWeight: 600,
            }}>
              <Icon size={12} />
              {label}
            </span>
          ))}
        </div>

        {/* H1 */}
        <h1 style={{
          fontSize: "clamp(28px, 5vw, 48px)", fontWeight: 600,
          color: "#1a1a1a", letterSpacing: "-0.025em", lineHeight: 1.1,
          margin: "0 0 16px 0", maxWidth: 900,
        }}>
          Batan işletmelerin{" "}
          <span style={{ color: "#C97676" }}>%82&rsquo;si</span>{" "}
          <span style={{ color: "#C97676" }}>nakit akış yüzünden batıyor</span>.
          <br />
          <span style={{ color: "#1F5C44" }}>Sinyalleri önceden görün, batmadan müdahale edin.</span>
        </h1>

        {/* Subtitle */}
        <p style={{ fontSize: 15, lineHeight: 1.6, color: "#525252", margin: "0 0 24px 0", maxWidth: 580 }}>
          PilotSensin stok, nakit, kar, borç ve ekip alanlarında işletmenizin sağlığını sürekli ölçer, gözden kaçanı sizden önce yakalar.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/kayit" style={{
            padding: "13px 24px", background: "#1F5C44", color: "#ffffff",
            WebkitTextFillColor: "#ffffff", border: "none", borderRadius: 10,
            fontSize: 14, fontWeight: 600, textDecoration: "none", display: "inline-block",
          }}>7 gün ücretsiz dene</Link>
          <span style={{ fontSize: 12, color: "#737373" }}>Kredi kartı gerekmez</span>
        </div>
      </div>
    </section>
  );
}
