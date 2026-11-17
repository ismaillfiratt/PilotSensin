const ADIMLAR = [
  { no: "1", title: "Verini ekle",     desc: "5 dakikada kurulur. Stok, kasa, görev bilgilerini gir."           },
  { no: "2", title: "Otomatik analiz", desc: "9 modül sürekli izler, Pilot Skoru hesaplanır."                   },
  { no: "3", title: "Erken uyarı al",  desc: "Risk varsa anında bildirim — geç kalmadan müdahale et."           },
  { no: "4", title: "Sağlam kal",      desc: "Pilot Skorun yüksek kalır, işletmen ayakta durur."                },
] as const;

export default function HowItWorks() {
  return (
    <section style={{ background: "#ffffff" }} className="py-20 px-6">
      <div className="max-w-6xl mx-auto">

        {/* Centered header */}
        <div className="text-center mb-12">
          <p style={{ color: "#1F5C44", letterSpacing: "0.1em", textTransform: "uppercase", fontSize: 11, fontWeight: 500, marginBottom: 10 }}>
            Nasıl Çalışır
          </p>
          <h2 style={{ fontSize: 36, fontWeight: 600, color: "#1a1a1a", letterSpacing: "-0.025em", lineHeight: 1.15, margin: 0 }}>
            5 dakikada kurulur, sürekli izler.
          </h2>
        </div>

        {/* Timeline */}
        <div className="relative">
          <div
            className="hidden md:block absolute"
            style={{ top: 18, left: "5%", right: "5%", height: 1, background: "#e5e5e5", zIndex: 0 }}
          />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative" style={{ zIndex: 1 }}>
            {ADIMLAR.map(({ no, title, desc }) => (
              <div key={no} className="flex flex-col items-center text-center">
                <div
                  className="inline-flex items-center justify-center rounded-full"
                  style={{ width: 36, height: 36, background: "#1F5C44", color: "#ffffff", WebkitTextFillColor: "#ffffff", fontSize: 14, fontWeight: 600, marginBottom: 12, flexShrink: 0 }}
                >
                  {no}
                </div>
                <p style={{ fontSize: 13, fontWeight: 500, color: "#0a0a0a", marginBottom: 4 }}>{title}</p>
                <p style={{ fontSize: 11, color: "#525252", lineHeight: 1.5 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
