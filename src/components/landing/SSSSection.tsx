"use client";

import { useState } from "react";

const SORULAR = [
  {
    soru: "Teknik bilgi gerekiyor mu?",
    cevap: "Hayır. PilotSensin sıfır kurulum ile çalışır. Hesap açtıktan sonra tarayıcıdan direkt kullanmaya başlarsınız — hiçbir yazılım yüklemenize gerek yok.",
  },
  {
    soru: "Verilerim güvende mi?",
    cevap: "Tüm veriler Supabase altyapısında şifrelenmiş olarak saklanır. Rol bazlı erişim kontrolü sayesinde sadece yetkili kişiler sisteme girebilir.",
  },
  {
    soru: "7 günlük deneme süresinde kredi kartı gerekiyor mu?",
    cevap: "Hayır. Deneme süresi boyunca hiçbir ödeme bilgisi talep edilmez. Sadece e-posta adresinizle hesap açın, kullanmaya başlayın.",
  },
  {
    soru: "Co-Pilot nedir, kaç kişi ekleyebilirim?",
    cevap: "Co-Pilot, sizin belirlediğiniz yetki sınırları içinde sistemi kullanan çalışan hesabıdır. Paket 3 Co-Pilot içerir; her ek Co-Pilot için 100 TL/ay eklenir.",
  },
  {
    soru: "Mevcut muhasebe sistemimden veri aktarabilir miyim?",
    cevap: "Evet. Excel / CSV formatındaki stok, işlem ve ürün verilerini sisteme aktarabilirsiniz. Detaylı rehber giriş yaptıktan sonra Yardım bölümünde mevcuttur.",
  },
  {
    soru: "İstediğim zaman iptal edebilir miyim?",
    cevap: "Evet. Herhangi bir taahhüt yoktur. Ayarlar > Tehlike Zonu bölümünden hesabınızı istediğiniz zaman silebilir veya aboneliğinizi durdurabilirsiniz.",
  },
];

export default function SSSSection() {
  const [acik, setAcik] = useState<number | null>(null);

  return (
    <section className="max-w-3xl mx-auto px-6 py-24">
      <div className="text-center mb-12">
        <p className="label-caps mb-3">SSS</p>
        <h2 className="text-3xl font-bold text-gray-900">
          Sık sorulan sorular
        </h2>
      </div>

      <div className="divide-y divide-gray-100">
        {SORULAR.map((s, i) => (
          <div key={i}>
            <button
              onClick={() => setAcik(acik === i ? null : i)}
              className="w-full flex items-center justify-between py-5 text-left gap-4"
            >
              <span className="text-sm font-semibold text-gray-800">{s.soru}</span>
              <span
                className="text-lg shrink-0 transition-transform"
                style={{
                  color: "var(--leaf)",
                  transform: acik === i ? "rotate(45deg)" : "rotate(0deg)",
                }}
              >
                +
              </span>
            </button>
            {acik === i && (
              <p className="pb-5 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {s.cevap}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
