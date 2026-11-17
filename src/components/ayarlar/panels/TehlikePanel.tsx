"use client";

import { useState }              from "react";
import { useRouter }             from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle, ArrowRight, X,
  Trash2, ShieldOff, LogOut,
} from "lucide-react";
import { createClient }   from "@/utils/supabase/client";
import { aktiviteKaydet } from "@/lib/aktiviteLog";
import { toast }          from "@/store/toast";
import { storesSifirla }  from "@/lib/auth-temizlik";

const KARAT      = "#C97676";
const KART_STIL  = { border: "0.5px solid rgba(0,0,0,0.08)" };

// ── Ortak modal bileşeni ─────────────────────────────────────────────────────
interface ModalProps {
  acik:         boolean;
  kapat:        () => void;
  ikon:         React.ReactNode;
  baslik:       string;
  aciklama:     React.ReactNode;
  onayMetni:    string;
  butonEtiket:  string;
  onOnay:       (onay: string) => Promise<void>;
  yukleniyor:   boolean;
}

function SilModal({
  acik, kapat, ikon, baslik, aciklama,
  onayMetni, butonEtiket, onOnay, yukleniyor,
}: ModalProps) {
  const [girilen, setGirilen] = useState("");
  const [hata,    setHata]    = useState("");
  const eslesme = girilen === onayMetni;

  const handleKapat = () => { kapat(); setGirilen(""); setHata(""); };

  const handleOnay = async () => {
    if (!eslesme) return;
    setHata("");
    try {
      await onOnay(girilen);
    } catch (e) {
      setHata((e as Error).message ?? "Bir hata oluştu.");
    }
  };

  return (
    <AnimatePresence>
      {acik && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && handleKapat()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.18 }}
            className="w-full max-w-sm bg-white rounded-2xl p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(201,118,118,0.12)", border: "1px solid rgba(201,118,118,0.25)" }}
              >
                {ikon}
              </div>
              <button
                onClick={handleKapat}
                className="text-gray-400 hover:text-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <h3 className="text-base font-bold text-gray-800 mb-3">{baslik}</h3>
            <div className="text-xs text-gray-500 leading-relaxed mb-4">{aciklama}</div>

            {hata && (
              <div
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg mb-3 text-xs"
                style={{ background: "rgba(201,118,118,0.08)", color: KARAT }}
              >
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                {hata}
              </div>
            )}

            <p className="text-xs text-gray-500 mb-2">
              Onaylamak için aşağıya{" "}
              <span className="font-bold text-gray-800">{onayMetni}</span> yaz:
            </p>
            <input
              value={girilen}
              onChange={(e) => setGirilen(e.target.value)}
              placeholder={onayMetni}
              className="w-full px-3 py-2.5 rounded-xl bg-gray-50 text-sm text-gray-800 placeholder-gray-400 focus:outline-none transition-colors mb-4"
              style={{
                border: `1px solid ${eslesme && girilen ? "rgba(201,118,118,0.5)" : "rgba(201,118,118,0.25)"}`,
              }}
            />

            <div className="flex gap-3">
              <button
                onClick={handleKapat}
                disabled={yukleniyor}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                İptal
              </button>
              <button
                onClick={handleOnay}
                disabled={!eslesme || yukleniyor}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: "rgba(201,118,118,0.15)", color: KARAT }}
              >
                {yukleniyor ? "İşleniyor..." : butonEtiket}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Ana panel ────────────────────────────────────────────────────────────────
export default function TehlikePanel() {
  const router = useRouter();
  const [silModal,   setSilModal]   = useState(false);
  const [rizaModal,  setRizaModal]  = useState(false);
  const [yukleniyor, setYukleniyor] = useState(false);

  const handleCikis = async () => {
    storesSifirla();
    await createClient().auth.signOut();
    router.push("/giris");
    router.refresh();
  };

  const silmeIslemi = async (onayMetni: string) => {
    setYukleniyor(true);
    try {
      const res = await fetch("/api/hesap-sil", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ onay: onayMetni }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Hesap silinemedi.");

      // Log atıldıktan sonra logout
      void aktiviteKaydet({ modul: "profil", eylem: "hesap-sil", ozet: "Hesap silindi" });
      storesSifirla();
      await createClient().auth.signOut();
      toast.basari("Hesabın silindi. PilotSensin'i kullandığın için teşekkürler.");

      setTimeout(() => router.push("/giris"), 2000);
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <>
      <div className="space-y-4">

        {/* Panel başlık */}
        <div>
          <p className="label-caps" style={{ color: KARAT }}>TEHLİKE</p>
          <h2 className="text-xl font-medium mt-1" style={{ color: KARAT }}>Hesabı Sil</h2>
          <p className="text-sm text-gray-500 mt-1">Geri alınamaz işlemler — dikkatli ol</p>
        </div>

        {/* ── KART 1 — Veri indirme uyarısı ── */}
        <div
          className="bg-white rounded-xl p-4 flex items-center justify-between gap-4"
          style={{ background: "rgba(180,83,9,0.04)", border: "0.5px solid rgba(180,83,9,0.2)" }}
        >
          <div className="flex items-start gap-3 min-w-0">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#B45309" }} />
            <div>
              <p className="text-sm font-medium" style={{ color: "#B45309" }}>
                Önce verilerini yedekle
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Silmeden önce verilerini JSON/Excel olarak indirebilirsin
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push("/ayarlar?tab=veri-indir")}
            className="shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap"
            style={{ background: "rgba(180,83,9,0.1)", color: "#B45309" }}
          >
            Verilerimi indir →
          </button>
        </div>

        {/* ── KART 2 — Oturum kapatma ── */}
        <div
          className="bg-white rounded-xl p-4 flex items-center justify-between gap-4"
          style={KART_STIL}
        >
          <div>
            <p className="text-sm font-medium text-gray-800">Oturumu Kapat</p>
            <p className="text-xs text-gray-400 mt-0.5">Mevcut tarayıcıdan çıkış yap</p>
          </div>
          <button
            onClick={handleCikis}
            className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
            style={{ background: "#fff", border: "0.5px solid rgba(0,0,0,0.15)" }}
          >
            <LogOut className="w-3.5 h-3.5" />
            Çıkış Yap
          </button>
        </div>

        {/* ── KART 3 — Açık rıza geri çekme ── */}
        <div
          className="bg-white rounded-xl p-4 flex items-center justify-between gap-4"
          style={{ background: "rgba(201,118,118,0.04)", border: "0.5px solid rgba(201,118,118,0.15)" }}
        >
          <div className="min-w-0 flex-1 pr-4">
            <p className="text-sm font-medium" style={{ color: KARAT }}>
              Açık Rıza Geri Çekme
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              KVKK kapsamında kayıt sırasında verdiğin açık rızayı geri çek — hesap kapatılır
            </p>
          </div>
          <button
            onClick={() => setRizaModal(true)}
            className="shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-all"
            style={{ background: "rgba(201,118,118,0.1)", color: KARAT }}
          >
            Geri Çek
          </button>
        </div>

        {/* ── KART 4 — Hesabı kalıcı sil ── */}
        <div
          className="bg-white rounded-xl p-5 space-y-3"
          style={{ background: "rgba(201,118,118,0.06)", border: "0.5px solid rgba(201,118,118,0.25)" }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium" style={{ color: KARAT }}>
                Hesabı Kalıcı Olarak Sil
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Tüm verilerin kalıcı olarak silinir. Bu işlem{" "}
                <span className="font-semibold">GERİ ALINAMAZ</span>.
              </p>
              <ul className="mt-2 space-y-1">
                {[
                  "Profil ve kişisel bilgiler",
                  "Tüm modüllerdeki veriler (stok, görev, satış vb.)",
                  "Aktivite geçmişi",
                  "Aktif abonelik (varsa iptal edilir)",
                ].map((m) => (
                  <li key={m} className="flex items-start gap-1.5 text-xs text-gray-500">
                    <ArrowRight className="w-3 h-3 shrink-0 mt-0.5 text-gray-400" />
                    {m}
                  </li>
                ))}
              </ul>
              <p className="text-[10px] mt-2" style={{ color: "#B45309" }}>
                Mali kayıtlar VUK gereği 10 yıl saklanmak zorundadır — anonimleştirilir ama silinmez.
              </p>
            </div>
            <button
              onClick={() => setSilModal(true)}
              className="shrink-0 px-4 py-2 rounded-lg text-sm font-bold transition-all"
              style={{ background: "rgba(201,118,118,0.15)", color: KARAT }}
            >
              Hesabı Sil
            </button>
          </div>
        </div>

      </div>

      {/* ── Modal: Rıza geri çekme ── */}
      <SilModal
        acik={rizaModal}
        kapat={() => setRizaModal(false)}
        ikon={<ShieldOff className="w-6 h-6" style={{ color: KARAT }} />}
        baslik="Açık Rızayı Geri Çek"
        aciklama={
          <div className="space-y-2">
            <p>Bu işlem geri alınamaz. Devam etmen durumunda:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Tüm hesap verilerin silinir</li>
              <li>Mali kayıtlar VUK gereği 10 yıl daha saklanır (anonimleştirilir)</li>
              <li>Bu işlem geri alınamaz</li>
            </ul>
          </div>
        }
        onayMetni="RIZAYI GERİ ÇEKİYORUM"
        butonEtiket="Rızayı Geri Çek ve Sil"
        onOnay={silmeIslemi}
        yukleniyor={yukleniyor}
      />

      {/* ── Modal: Hesabı sil ── */}
      <SilModal
        acik={silModal}
        kapat={() => setSilModal(false)}
        ikon={<Trash2 className="w-6 h-6" style={{ color: KARAT }} />}
        baslik="Hesabı Kalıcı Olarak Sil"
        aciklama={
          <div className="space-y-2">
            <p>Bu işlem <strong>GERİ ALINAMAZ</strong>. Tüm veriler silinir:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Profil bilgilerin</li>
              <li>Tüm işletme verilerin</li>
              <li>Geçmiş aktiviteler</li>
            </ul>
            <p className="mt-2 p-2 rounded-lg text-[10px]" style={{ background: "rgba(180,83,9,0.08)", color: "#B45309" }}>
              Eğer aktif aboneliğin varsa, ödeme dönemi sonuna kadar geri ödemeye hak kazanamazsın.
            </p>
          </div>
        }
        onayMetni="SİL"
        butonEtiket="Hesabı Kalıcı Sil"
        onOnay={silmeIslemi}
        yukleniyor={yukleniyor}
      />
    </>
  );
}
