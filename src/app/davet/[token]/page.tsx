"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Plane, Mail, Lock, Eye, EyeOff, User, AlertCircle, CheckCircle2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useSirket, useSirket as sirketStore } from "@/store/sirket";

interface DavetBilgi {
  email:        string;
  role:         string;
  company_name: string;
  gecersiz:     boolean;
}

export default function DavetPage() {
  const { token }              = useParams<{ token: string }>();
  const router                 = useRouter();
  const { yukle }              = useSirket();
  const [davet, setDavet]      = useState<DavetBilgi | null>(null);
  const [yukleniyor, setYuk]   = useState(true);
  const [form, setForm]        = useState({ email: "", password: "", ad: "", soyad: "" });
  const [goster, setGoster]    = useState(false);
  const [hata, setHata]        = useState("");
  const [islem, setIslem]      = useState(false);
  const [basarili, setBasarili] = useState(false);
  const [mod, setMod]          = useState<"kayit" | "giris">("kayit");

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    const sb = createClient();
    sb.from("invitations")
      .select("email, role, companies(name), accepted_at, expires_at")
      .eq("token", token)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) {
          setDavet({ email: "", role: "", company_name: "", gecersiz: true });
        } else if (data.accepted_at || new Date(data.expires_at) < new Date()) {
          setDavet({ email: data.email, role: data.role, company_name: "", gecersiz: true });
        } else {
          const c = data.companies as unknown as { name: string } | null;
          setDavet({ email: data.email, role: data.role, company_name: c?.name ?? "", gecersiz: false });
          setForm((f) => ({ ...f, email: data.email }));
        }
        setYuk(false);
      });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHata("");
    setIslem(true);
    try {
      const sb = createClient();
      let userId = "";
      let userEmail = form.email;

      if (mod === "kayit") {
        const { data, error } = await sb.auth.signUp({
          email:    form.email,
          password: form.password,
          options: {
            data: { ad: form.ad, soyad: form.soyad, full_name: `${form.ad} ${form.soyad}`.trim() },
          },
        });
        if (error) { setHata(error.message); return; }
        userId = data.user?.id ?? "";
      } else {
        const { data, error } = await sb.auth.signInWithPassword({ email: form.email, password: form.password });
        if (error) { setHata("E-posta veya şifre hatalı."); return; }
        userId    = data.user.id;
        userEmail = data.user.email ?? form.email;
      }

      if (!userId) { setHata("Kullanıcı oluşturulamadı."); return; }

      // Davet kabul API (SECURITY DEFINER — RLS atlar)
      const res = await fetch("/api/davet/kabul", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          token,
          userId,
          email:    userEmail,
          fullName: `${form.ad} ${form.soyad}`.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) { setHata(json.error ?? "Davet kabul edilemedi."); return; }

      // DB yazımının yayılmasını bekle, companyId set olana kadar retry
      let companyBulundu = false;
      for (let i = 0; i < 8; i++) {
        await yukle();
        if (sirketStore.getState().companyId) { companyBulundu = true; break; }
        await new Promise((r) => setTimeout(r, 500));
      }

      if (!companyBulundu) {
        setHata("Şirkete bağlanılamadı. Lütfen tekrar giriş yapın.");
        return;
      }

      setBasarili(true);
      setTimeout(() => router.replace("/dashboard"), 1200);
    } catch {
      setHata("Bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setIslem(false);
    }
  };

  if (yukleniyor) {
    return (
      <div className="min-h-screen bg-[var(--forest)] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--leaf)]/30 border-t-[var(--leaf)] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--forest)] flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-[var(--forest)] opacity-5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-[var(--forest)] opacity-5 blur-3xl" />
      </div>

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="w-full max-w-sm relative">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[var(--forest)] flex items-center justify-center mb-4 shadow-lg shadow-[var(--leaf)]/20">
            <Plane className="w-7 h-7 text-gray-900 rotate-45" />
          </div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">Pilot Sensin</h1>
        </div>

        <div className="card rounded-2xl p-7 space-y-5">
          {davet?.gecersiz ? (
            <div className="text-center space-y-3 py-4">
              <AlertCircle className="w-10 h-10 text-[#ef4444] mx-auto" />
              <p className="text-gray-800 font-semibold">Davet Geçersiz</p>
              <p className="text-sm text-gray-400">Bu davet linki süresi dolmuş veya zaten kullanılmış.</p>
            </div>
          ) : basarili ? (
            <div className="text-center space-y-3 py-4">
              <CheckCircle2 className="w-10 h-10 text-[#22c55e] mx-auto" />
              <p className="text-gray-800 font-semibold">Ekibe katıldınız!</p>
              <p className="text-sm text-gray-400">Dashboard&apos;a yönlendiriliyorsunuz...</p>
            </div>
          ) : (
            <>
              <div>
                <p className="text-xs text-[var(--leaf)] font-semibold uppercase tracking-wide mb-1">Davet</p>
                <h2 className="text-lg font-bold text-gray-800">{davet?.company_name}</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {davet?.role === "pilot" ? "Pilot" : "Co-Pilot"} olarak davet edildiniz
                </p>
              </div>

              {/* Mod seçimi */}
              <div className="flex rounded-xl overflow-hidden border border-gray-200">
                {(["kayit", "giris"] as const).map((m) => (
                  <button key={m} onClick={() => setMod(m)}
                    className="flex-1 py-2.5 text-sm font-medium transition-colors"
                    style={mod === m
                      ? { background: "var(--mint)", color: "var(--leaf)" }
                      : { background: "transparent", color: "#94a3b8" }
                    }>
                    {m === "kayit" ? "Hesap Oluştur" : "Giriş Yap"}
                  </button>
                ))}
              </div>

              {hata && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.25)]">
                  <AlertCircle className="w-4 h-4 text-[#ef4444] shrink-0" />
                  <p className="text-sm text-[#ef4444]">{hata}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Ad/Soyad — sadece kayıt modunda */}
                {mod === "kayit" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-400 font-medium block mb-1">Ad *</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <input required value={form.ad} onChange={(e) => set("ad", e.target.value)}
                          placeholder="Adınız"
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[var(--leaf)] text-sm" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 font-medium block mb-1">Soyad *</label>
                      <input required value={form.soyad} onChange={(e) => set("soyad", e.target.value)}
                        placeholder="Soyadınız"
                        className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[var(--leaf)] text-sm" />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs text-gray-400 font-medium block mb-1">E-posta</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="email" required value={form.email}
                      onChange={(e) => set("email", e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[var(--leaf)] text-sm" />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-400 font-medium block mb-1">Şifre</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type={goster ? "text" : "password"} required
                      value={form.password} onChange={(e) => set("password", e.target.value)}
                      placeholder="••••••••" minLength={6}
                      className="w-full pl-10 pr-11 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[var(--leaf)] text-sm" />
                    <button type="button" onClick={() => setGoster(!goster)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-800 transition-colors">
                      {goster ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={islem}
                  className="w-full py-3 rounded-xl bg-[var(--forest)] text-white text-sm font-bold hover:opacity-90 transition-colors disabled:opacity-60">
                  {islem ? "İşleniyor..." : mod === "kayit" ? "Hesap Oluştur ve Ekibe Katıl" : "Giriş Yap ve Ekibe Katıl"}
                </button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
