import { Check } from "lucide-react";

const MADDELER = [
  "Her sabah açtığında ne durumdasın",
  "Kritik uyarılar üst sırada",
  "Düşüyorsa nereden düşüyor — biliyorsun",
] as const;

const METRIKLER = [
  { label: "ACİL FON",  value: "%12", color: "#A32D2D" },
  { label: "PROSEDÜR",  value: "%0",  color: "#BA7517" },
  { label: "NAKİT",     value: "%83", color: "#1F5C44" },
  { label: "STOK",      value: "%92", color: "#1F5C44" },
] as const;

const SCORE_R       = 28;
const CIRCUMFERENCE = 2 * Math.PI * SCORE_R;
const DASH_OFFSET   = CIRCUMFERENCE * (1 - 0.77);

export default function SolutionDashboard() {
  return (
    <section style={{ background: "#ffffff" }} className="py-20 px-6">
      <div className="max-w-6xl mx-auto">

        {/* Centered header */}
        <div className="text-center mb-12">
          <p style={{ color: "#1F5C44", letterSpacing: "0.1em", textTransform: "uppercase", fontSize: 11, fontWeight: 500, marginBottom: 10 }}>
            İşte Çözüm
          </p>
          <h2 style={{ fontSize: 36, fontWeight: 600, color: "#1a1a1a", letterSpacing: "-0.025em", lineHeight: 1.15, margin: 0 }}>
            Pilot Skoru — işletmenin sağlık endeksi.
          </h2>
        </div>

        {/* Split layout */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1.2fr] gap-7 items-center">

          {/* Sol: madde listesi */}
          <ul className="flex flex-col gap-2">
            {MADDELER.map((m) => (
              <li key={m} className="flex items-start gap-2">
                <Check style={{ width: 14, height: 14, color: "#1F5C44", marginTop: 2, flexShrink: 0 }} />
                <span style={{ fontSize: 14, color: "#525252" }}>{m}</span>
              </li>
            ))}
          </ul>

          {/* Sağ: Browser mockup */}
          <div style={{ borderRadius: 12, overflow: "hidden", border: "0.5px solid rgba(0,0,0,0.10)" }}>
            {/* Chrome bar */}
            <div className="flex items-center justify-between" style={{ background: "#F1EFE8", padding: "8px 12px" }}>
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#D3D1C7" }} />
                ))}
              </div>
              <span style={{ fontSize: 10, color: "#737373" }}>pilotsensin.com/dashboard</span>
            </div>

            {/* Body */}
            <div style={{ background: "#ffffff", padding: 18 }}>
              <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
                <span style={{ fontSize: 11, color: "#737373", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Hoş geldin, Ismail
                </span>
                <span style={{ fontSize: 10, color: "#BA7517", background: "#FAEEDA", padding: "3px 8px", borderRadius: 999, fontWeight: 500 }}>
                  2 uyarı
                </span>
              </div>

              <div className="flex items-center gap-4" style={{ marginBottom: 14 }}>
                <svg width={70} height={70} viewBox="0 0 70 70" style={{ flexShrink: 0 }}>
                  <circle cx={35} cy={35} r={SCORE_R} fill="none" stroke="#F1EFE8" strokeWidth={6} />
                  <circle
                    cx={35} cy={35} r={SCORE_R}
                    fill="none" stroke="#EF9F27" strokeWidth={6}
                    strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
                    strokeDashoffset={DASH_OFFSET}
                    strokeLinecap="round"
                    transform="rotate(-90 35 35)"
                  />
                  <text x={35} y={35} dominantBaseline="middle" textAnchor="middle" fontSize={18} fontWeight={500} fill="#0a0a0a">
                    %77
                  </text>
                </svg>
                <div>
                  <p style={{ fontSize: 11, color: "#737373", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>
                    Pilot Skoru
                  </p>
                  <p style={{ fontSize: 18, fontWeight: 500, color: "#0a0a0a" }}>Dikkat seviyesinde</p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                {METRIKLER.map(({ label, value, color }) => (
                  <div key={label} style={{ padding: 8, background: "#FAFAFA", borderRadius: 6 }}>
                    <p style={{ fontSize: 9, color: "#737373", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>
                      {label}
                    </p>
                    <p style={{ fontSize: 13, fontWeight: 500, color }}>{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
