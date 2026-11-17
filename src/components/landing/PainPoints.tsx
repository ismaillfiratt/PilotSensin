import { Wallet, Package, TrendingDown, ShieldOff } from "lucide-react";

const KARTLAR = [
  { Icon: Wallet,       title: "Yarın kasa yetecek mi?",   desc: "Nakit yetersizliği işletmenin kalp krizidir." },
  { Icon: Package,      title: "Stok ne zaman biter?",     desc: "Tükendiğinde müşteri kaybedersin."           },
  { Icon: TrendingDown, title: "Marjın eriyor mu?",         desc: "Gizli maliyet sessizce kârı yer."           },
  { Icon: ShieldOff,    title: "Acil gidere hazır mısın?", desc: "Tek arıza işletmeni batırabilir."            },
] as const;

export default function PainPoints() {
  return (
    <section style={{ background: "#FAFAFA" }} className="py-20 px-6">
      <div className="max-w-6xl mx-auto">

        {/* Centered header */}
        <div className="text-center mb-12">
          <h2 style={{ fontSize: 36, fontWeight: 600, color: "#1a1a1a", letterSpacing: "-0.025em", lineHeight: 1.15, margin: 0 }}>
            Bir yerden tanıdık geliyor mu?
          </h2>
        </div>

        {/* Kart grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {KARTLAR.map(({ Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-lg"
              style={{ padding: "16px 12px", background: "#ffffff", borderTop: "2px solid #C97676" }}
            >
              <Icon style={{ width: 22, height: 22, color: "#C97676" }} />
              <p style={{ fontSize: 13, fontWeight: 500, color: "#1a1a1a", marginTop: 10, marginBottom: 4 }}>
                {title}
              </p>
              <p style={{ fontSize: 11, color: "#737373", lineHeight: 1.4 }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
