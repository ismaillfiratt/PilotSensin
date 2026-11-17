import {
  Package, TrendingDown, Calendar, Shield,
  CheckSquare, ClipboardList, Receipt, Users,
} from "lucide-react";

const BAR_HEIGHTS = ["50%", "65%", "85%", "75%", "95%", "100%", "80%", "60%"] as const;
const BAR_COLORS  = [
  "rgba(255,255,255,0.25)", "rgba(255,255,255,0.35)", "rgba(255,255,255,0.50)",
  "rgba(255,255,255,0.40)", "rgba(255,255,255,0.65)", "#ffffff",
  "rgba(255,255,255,0.45)", "rgba(255,255,255,0.35)",
] as const;

const KUCUK_KARTLAR = [
  { Icon: Package,       title: "Stok",        desc: "Kritik uyarı"     },
  { Icon: TrendingDown,  title: "Kar-Zarar",   desc: "Marj erimesi"     },
  { Icon: Calendar,      title: "Borçlar",     desc: "Vade öncesi"      },
  { Icon: Shield,        title: "Acil Fon",    desc: "Yedek alarmı"     },
  { Icon: CheckSquare,   title: "Görevler",    desc: "İş aksaması"      },
  { Icon: ClipboardList, title: "Prosedürler", desc: "Disiplin"         },
  { Icon: Receipt,       title: "KDV",         desc: "Beyan alarmı"     },
  { Icon: Users,         title: "Ekip",        desc: "Rol belirsizliği" },
] as const;

export default function ModulesBento() {
  return (
    <section style={{ background: "#FAFAFA" }} className="py-20 px-6">
      <div className="max-w-6xl mx-auto">

        {/* Centered header */}
        <div className="text-center mb-12">
          <p style={{ color: "#1F5C44", letterSpacing: "0.1em", textTransform: "uppercase", fontSize: 11, fontWeight: 500, marginBottom: 10 }}>
            9 Erken Uyarı Modülü
          </p>
          <h2 style={{ fontSize: 36, fontWeight: 600, color: "#1a1a1a", letterSpacing: "-0.025em", lineHeight: 1.15, margin: 0 }}>
            Her modül bir risk dedektörü.
          </h2>
          <p style={{ fontSize: 14, color: "#525252", marginTop: 12, maxWidth: 560, marginLeft: "auto", marginRight: "auto" }}>
            İşletmenin farklı alanlarında ne olduğunu sürekli takip eder.
          </p>
        </div>

        {/* Featured — Nakit Akışı */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center rounded-2xl mb-2.5"
          style={{ background: "#1F5C44", padding: 24 }}
        >
          <div>
            <span style={{ display: "inline-block", fontSize: 10, color: "#1F5C44", background: "#ffffff", padding: "3px 9px", borderRadius: 999, fontWeight: 500, marginBottom: 10 }}>
              En kritik modül
            </span>
            <h3 style={{ fontSize: 22, color: "#ffffff", fontWeight: 500, marginBottom: 8 }}>Nakit Akışı</h3>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 1.5, marginBottom: 12 }}>
              Can suyun kaç gün? Kasanın ne zaman boşalacağını projeksiyonla önceden bilirsin.
            </p>
            <span style={{ fontSize: 11, color: "#ffffff", fontWeight: 500 }}>Detaylar →</span>
          </div>

          <div className="flex items-end gap-1.5" style={{ height: 70 }}>
            {BAR_HEIGHTS.map((h, i) => (
              <div key={i} className="flex-1 rounded-sm" style={{ height: h, background: BAR_COLORS[i] }} />
            ))}
          </div>
        </div>

        {/* 8 küçük kart */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          {KUCUK_KARTLAR.map(({ Icon, title, desc }) => (
            <div key={title} className="rounded-lg" style={{ padding: 14, background: "#ffffff", border: "0.5px solid rgba(0,0,0,0.05)" }}>
              <Icon style={{ width: 18, height: 18, color: "#1F5C44" }} />
              <p style={{ fontSize: 13, fontWeight: 500, color: "#0a0a0a", marginTop: 8, marginBottom: 2 }}>{title}</p>
              <p style={{ fontSize: 11, color: "#525252" }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
