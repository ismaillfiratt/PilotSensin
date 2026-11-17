"use client";

import { useState }              from "react";
import Link                      from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Mail }     from "lucide-react";

const SORULAR = [
  {
    soru: "Verilerim güvende mi?",
    cevap: "Evet. Tüm veriler Supabase altyapısında şifreli olarak saklanır. Bağlantılar TLS/HTTPS ile korunur. Şifreniz hiçbir zaman düz metin olarak tutulmaz ve verileriniz üçüncü taraflarla paylaşılmaz.",
  },
  {
    soru: "Kaydettiğim işletme verileri başkaları tarafından görülebilir mi?",
    cevap: "Hayır. Nakit akışı, stok, kar-zarar gibi tüm işletme verileri yalnızca sizin hesabınıza aittir. Pilot Sensin ekibi dahil hiç kimse bu verilere erişemez.",
  },
  {
    soru: "Şifremi unuttum, ne yapmalıyım?",
    cevap: "Giriş ekranındaki \"Şifremi Unuttum\" bağlantısına tıklayın. Kayıtlı e-posta adresinize sıfırlama bağlantısı gönderilecektir. Bağlantı 1 saat geçerlidir.",
  },
  {
    soru: "Hesabımı nasıl silebilirim?",
    cevap: "Ayarlar sayfasındaki \"Tehlike\" bölümünden hesabınızı kalıcı olarak silebilirsiniz. Bu işlem geri alınamaz; tüm verileriniz silinir.",
  },
  {
    soru: "Verilerimi dışa aktarabilir miyim?",
    cevap: "Evet. Ayarlar → Verilerimi İndir bölümünden tüm verilerinizi JSON, CSV veya Excel formatında indirebilirsiniz.",
  },
  {
    soru: "Pilot Sensin'i mobil cihazdan kullanabilir miyim?",
    cevap: "Platform, mobil tarayıcılarla uyumludur. Tam özellikli mobil uygulama yol haritamızda yer almaktadır.",
  },
  {
    soru: "Birden fazla kullanıcı ekleyebilir miyim?",
    cevap: "Evet. Ekip yönetimi mevcut. İlk 3 ekip üyesi plana dahil, her ek üye için +₺100/ay ücretlendirme yapılır.",
  },
  {
    soru: "Fiyatlandırma ve ödeme nasıl işliyor?",
    cevap: "PilotSensin Pro planı aylık ₺499'dır ve 3 ekip üyesi dahildir. Yeni hesaplar için ilk 7 gün ücretsiz deneme sunulmaktadır. Ödeme altyapısı yakında aktif edilecektir.",
  },
  {
    soru: "Teknik destek almak için kimi aramalıyım?",
    cevap: "destek@pilotsensin.com adresine e-posta gönderebilirsiniz. İş günlerinde 24 saat içinde dönüş yapılmaktadır.",
  },
];

const KART_STIL = { border: "0.5px solid rgba(0,0,0,0.08)" };

export default function SssPanel() {
  const [acik, setAcik] = useState<number | null>(null);

  return (
    <div className="space-y-4">

      {/* Panel başlık */}
      <div>
        <p className="label-caps">YARDIM</p>
        <h2 className="text-xl font-medium text-gray-900 mt-1">Sıkça Sorulan Sorular</h2>
        <p className="text-sm text-gray-500 mt-1">Merak ettiklerine hızlıca ulaş</p>
      </div>

      {/* ── KART 1 — Soru listesi ── */}
      <div className="bg-white rounded-xl overflow-hidden" style={KART_STIL}>
        {SORULAR.map((item, i) => {
          const acikMi = acik === i;
          return (
            <div
              key={i}
              className="transition-colors"
              style={{
                borderTop:       i > 0 ? "0.5px solid rgba(0,0,0,0.06)" : undefined,
                backgroundColor: acikMi ? "rgba(15,61,46,0.04)" : "transparent",
              }}
            >
              <button
                onClick={() => setAcik(acikMi ? null : i)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left"
              >
                <span className="text-sm font-medium text-gray-800">{item.soru}</span>
                <motion.div
                  animate={{ rotate: acikMi ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="shrink-0"
                >
                  <ChevronDown
                    className="w-4 h-4"
                    style={{ color: acikMi ? "var(--forest)" : "#94a3b8" }}
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
                    <p
                      className="px-4 pb-4 text-sm text-gray-600 leading-relaxed pt-3"
                      style={{ borderTop: "0.5px solid rgba(0,0,0,0.06)" }}
                    >
                      {item.cevap}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* ── KART 2 — Destek iletişim ── */}
      <div
        className="bg-white rounded-xl p-4 flex items-center justify-between gap-4"
        style={KART_STIL}
      >
        <div className="flex items-center gap-3 min-w-0">
          <Mail className="w-4 h-4 text-gray-400 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-800">Sorunuz burada yok mu?</p>
            <a
              href="mailto:destek@pilotsensin.com"
              className="text-xs hover:underline transition-colors"
              style={{ color: "var(--forest)" }}
            >
              destek@pilotsensin.com
            </a>
          </div>
        </div>
        <Link
          href="/ayarlar?tab=iletisim"
          className="shrink-0 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all whitespace-nowrap"
          style={{ background: "#fff", border: "0.5px solid rgba(0,0,0,0.15)" }}
        >
          İletişim sayfası →
        </Link>
      </div>

    </div>
  );
}
