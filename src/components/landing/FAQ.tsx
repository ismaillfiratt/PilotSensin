"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";

const SORULAR = [
  {
    soru:  "Bu bir muhasebe programı mı?",
    cevap: "Hayır. PilotSensin bir erken uyarı sistemi. Mali müşavirinizin yerini almaz, ona düzenli sinyaller göndererek işini kolaylaştırır.",
  },
  {
    soru:  "İstediğim zaman iptal edebilir miyim?",
    cevap: "Evet, herhangi bir aboneliği aylık iptal edebilirsin. Taahhüt yok, ön ödeme iadesi mümkün.",
  },
  {
    soru:  "Ekibimi nasıl eklerim?",
    cevap: "Ayarlar > Ekip Yönetimi > Üye Davet Et. E-mail ile davet gönderirsin, üye tıklayıp kayıt olur. Pilot/Co-Pilot rol seçeneği var.",
  },
  {
    soru:  "Pilot Skoru nasıl hesaplanır?",
    cevap: "9 modülün verisinden ağırlıklı ortalama. Nakit Akışı %30, Kar-Zarar %20, Stok %15, Acil Fon %10, Görevler %10, Prosedürler %5, KDV %5, Borçlar %3, Ekip %2 ağırlık.",
  },
] as const;

export default function FAQ() {
  const [acik, setAcik] = useState<number | null>(0);

  return (
    <section style={{ background: "#ffffff" }} className="py-20 px-6">
      <div className="max-w-6xl mx-auto">

        {/* Centered header */}
        <div className="text-center mb-12">
          <h2 style={{ fontSize: 36, fontWeight: 600, color: "#1a1a1a", letterSpacing: "-0.02em", lineHeight: 1.15, margin: 0 }}>
            Sıkça Sorulan Sorular
          </h2>
        </div>

        {/* Accordion — max-w-3xl centered */}
        <div className="max-w-3xl mx-auto">
          {SORULAR.map((item, i) => {
            const isAcik   = acik === i;
            const sonuncu  = i === SORULAR.length - 1;
            return (
              <div key={item.soru} style={{ borderBottom: sonuncu ? "none" : "0.5px solid #e5e5e5" }}>
                <button
                  onClick={() => setAcik(isAcik ? null : i)}
                  className="flex items-center justify-between w-full text-left"
                  style={{ padding: "16px 0", cursor: "pointer", background: "transparent", border: "none", gap: 12 }}
                >
                  <span style={{ fontSize: 14, color: "#0a0a0a", fontWeight: 500 }}>{item.soru}</span>
                  {isAcik
                    ? <Minus style={{ width: 16, height: 16, color: "#525252", flexShrink: 0 }} />
                    : <Plus  style={{ width: 16, height: 16, color: "#525252", flexShrink: 0 }} />
                  }
                </button>
                {isAcik && (
                  <p style={{ fontSize: 13, color: "#525252", lineHeight: 1.6, margin: "0 0 16px 0", maxWidth: 580 }}>
                    {item.cevap}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
