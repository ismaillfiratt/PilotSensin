"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle, ChevronDown, Mail } from "lucide-react";

const SORULAR = [
  {
    soru: "Verilerim güvende mi?",
    cevap:
      "Evet. Tüm veriler Supabase altyapısında şifreli olarak saklanır. Bağlantılar TLS/HTTPS ile korunur. Şifreniz hiçbir zaman düz metin olarak tutulmaz ve verileriniz üçüncü taraflarla paylaşılmaz.",
  },
  {
    soru: "Kaydettiğim işletme verileri başkaları tarafından görülebilir mi?",
    cevap:
      "Hayır. Nakit akışı, stok, kar-zarar gibi tüm işletme verileri yalnızca sizin hesabınıza aittir. Pilot Sensin ekibi dahil hiç kimse bu verilere erişemez.",
  },
  {
    soru: "Şifremi unuttum, ne yapmalıyım?",
    cevap:
      'Giriş ekranındaki "Şifremi Unuttum" bağlantısına tıklayın. Kayıtlı e-posta adresinize sıfırlama bağlantısı gönderilecektir. Bağlantı 1 saat geçerlidir.',
  },
  {
    soru: "Hesabımı nasıl silebilirim?",
    cevap:
      'Bu sayfanın en altındaki "Tehlike Zonu" bölümünden hesabınızı kalıcı olarak silebilirsiniz. Bu işlem geri alınamaz; tüm verileriniz silinir.',
  },
  {
    soru: "Verilerimi dışa aktarabilir miyim?",
    cevap:
      "Veri dışa aktarma özelliği yakında eklenecektir. Şu an için destek ekibimizle iletişime geçerek verilerinizin CSV formatında size iletilmesini talep edebilirsiniz.",
  },
  {
    soru: "Pilot Sensin'i mobil cihazdan kullanabilir miyim?",
    cevap:
      "Platform, mobil tarayıcılarla uyumludur. Tam özellikli mobil uygulama yol haritamızda yer almaktadır.",
  },
  {
    soru: "Birden fazla kullanıcı ekleyebilir miyim?",
    cevap:
      "Çoklu kullanıcı (ekip) desteği yakında gelecek bir özellik olarak planlanmaktadır. Şu an her işletme için tek hesap kullanılmaktadır.",
  },
  {
    soru: "Fiyatlandırma ve ödeme nasıl işliyor?",
    cevap:
      "Pilot Sensin şu an beta sürecinde ücretsiz sunulmaktadır. Ücretli planlar devreye girmeden önce hesabınıza kayıtlı e-posta adresinize bildirim gönderilecektir.",
  },
  {
    soru: "Teknik destek almak için kimi aramalıyım?",
    cevap:
      "destek@pilotsensin.com adresine e-posta gönderebilirsiniz. İş günlerinde 24 saat içinde dönüş yapılmaktadır.",
  },
];

export default function SSSAyarlari() {
  const [acik, setAcik] = useState<number | null>(null);

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-lg bg-[rgba(59,130,246,0.12)] border border-[rgba(59,130,246,0.2)] flex items-center justify-center">
          <HelpCircle className="w-4 h-4 text-[#3b82f6]" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white">Sıkça Sorulan Sorular</h2>
          <p className="text-xs text-[#94a3b8]">Merak ettiklerinize hızlıca ulaşın</p>
        </div>
      </div>

      <div className="space-y-2">
        {SORULAR.map((item, i) => {
          const acikMi = acik === i;
          return (
            <div
              key={i}
              className="rounded-xl border overflow-hidden transition-colors"
              style={{
                borderColor: acikMi ? "rgba(251,192,36,0.3)" : "var(--border-subtle)",
                background: acikMi ? "rgba(251,192,36,0.04)" : "var(--input-bg)",
              }}
            >
              <button
                onClick={() => setAcik(acikMi ? null : i)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left"
              >
                <span className="text-sm font-medium text-white">{item.soru}</span>
                <motion.div
                  animate={{ rotate: acikMi ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="shrink-0"
                >
                  <ChevronDown
                    className="w-4 h-4"
                    style={{ color: acikMi ? "#fbc024" : "#64748b" }}
                  />
                </motion.div>
              </button>

              <AnimatePresence initial={false}>
                {acikMi && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: "easeInOut" }}
                    style={{ overflow: "hidden" }}
                  >
                    <p className="px-4 pb-4 text-sm text-[#94a3b8] leading-relaxed border-t border-[rgba(255,255,255,0.06)] pt-3">
                      {item.cevap}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Destek */}
      <div
        className="flex items-center gap-3 mt-4 p-3.5 rounded-xl border"
        style={{ borderColor: "var(--border-subtle)", background: "var(--input-bg)" }}
      >
        <div className="w-8 h-8 rounded-lg bg-[rgba(251,192,36,0.12)] flex items-center justify-center shrink-0">
          <Mail className="w-4 h-4 text-[#fbc024]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-white">Sorunuz burada yok mu?</p>
          <p className="text-[11px] text-[#94a3b8] mt-0.5">
            <a href="mailto:destek@pilotsensin.com" className="text-[#fbc024] hover:underline">
              destek@pilotsensin.com
            </a>{" "}
            adresinden bize ulaşın.
          </p>
        </div>
      </div>
    </div>
  );
}
