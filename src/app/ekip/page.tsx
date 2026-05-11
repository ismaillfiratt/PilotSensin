"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Users, UserPlus, Mail, Copy, Check, Trash2, AlertCircle, Crown, Navigation } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useSirket } from "@/store/sirket";

interface Uye {
  id:        string;
  email:     string;
  role:      "pilot" | "copilot";
  status:    "active" | "inactive";
  joined_at: string | null;
}

interface Davet {
  id:         string;
  email:      string;
  role:       "pilot" | "copilot";
  token:      string;
  expires_at: string;
  accepted_at: string | null;
}

function getSiteUrl() {
  if (typeof window !== "undefined") return window.location.origin;
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://pilotsensin.com";
}

export default function EkipPage() {
  const { companyId, maxUye } = useSirket();
  const [uyeler, setUyeler]   = useState<Uye[]>([]);
  const [davetler, setDavetler] = useState<Davet[]>([]);
  const [email, setEmail]     = useState("");
  const [rol, setRol]         = useState<"copilot" | "pilot">("copilot");
  const [yukleniyor, setYuk]  = useState(false);
  const [hata, setHata]       = useState("");
  const [kopyalandi, setKop]  = useState<string | null>(null);

  const yukle = useCallback(async () => {
    if (!companyId) return;
    const sb = createClient();
    const [{ data: m }, { data: d }] = await Promise.all([
      sb.from("company_members").select("*").eq("company_id", companyId).order("joined_at"),
      sb.from("invitations").select("*").eq("company_id", companyId).is("accepted_at", null).order("created_at", { ascending: false }),
    ]);
    if (m) setUyeler(m as Uye[]);
    if (d) setDavetler(d as Davet[]);
  }, [companyId]);

  useEffect(() => { yukle(); }, [yukle]);

  const davetGonder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !companyId) return;
    setHata("");
    setYuk(true);
    try {
      const sb = createClient();
      const { data: { session } } = await sb.auth.getSession();
      if (!session) return;

      // Üye limiti kontrolü
      const aktifUye = uyeler.filter((u) => u.status === "active").length;
      if (aktifUye >= maxUye) {
        setHata(`Paketiniz en fazla ${maxUye} üyeye izin veriyor.`);
        return;
      }

      const { error } = await sb.from("invitations").insert({
        company_id: companyId,
        email:      email.trim().toLowerCase(),
        role:       rol,
        invited_by: session.user.id,
      });

      if (error) { setHata(error.message); return; }
      setEmail("");
      await yukle();
    } catch {
      setHata("Davet oluşturulamadı.");
    } finally {
      setYuk(false);
    }
  };

  const davetSil = async (id: string) => {
    await createClient().from("invitations").delete().eq("id", id);
    await yukle();
  };

  const uyeDeaktif = async (id: string) => {
    await createClient().from("company_members").update({ status: "inactive" }).eq("id", id);
    await yukle();
  };

  const kopyala = (token: string) => {
    const link = `${getSiteUrl()}/davet/${token}`;
    navigator.clipboard.writeText(link);
    setKop(token);
    setTimeout(() => setKop(null), 2000);
  };

  const aktifUye = uyeler.filter((u) => u.status === "active");

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Başlık */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[rgba(251,192,36,0.12)] border border-[rgba(251,192,36,0.25)] flex items-center justify-center">
          <Users className="w-5 h-5 text-[#fbc024]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Ekip Yönetimi</h1>
          <p className="text-sm text-[#94a3b8]">{aktifUye.length} / {maxUye} üye</p>
        </div>
      </div>

      {/* Davet formu */}
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <UserPlus className="w-4 h-4 text-[#fbc024]" />
          <h2 className="text-sm font-semibold text-white">Yeni Üye Davet Et</h2>
        </div>

        {hata && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.25)]">
            <AlertCircle className="w-4 h-4 text-[#ef4444] shrink-0" />
            <p className="text-sm text-[#ef4444]">{hata}</p>
          </div>
        )}

        <form onSubmit={davetGonder} className="flex gap-3 flex-col sm:flex-row">
          <div className="relative flex-1">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
            <input
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="calisan@isletme.com"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white placeholder-[#94a3b8] focus:outline-none focus:border-[rgba(251,192,36,0.4)] text-sm transition-colors"
            />
          </div>
          <select
            value={rol} onChange={(e) => setRol(e.target.value as "copilot" | "pilot")}
            className="px-3 py-2.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white text-sm focus:outline-none focus:border-[rgba(251,192,36,0.4)]"
          >
            <option value="copilot" className="bg-[#0e172a]">Co-Pilot</option>
            <option value="pilot"   className="bg-[#0e172a]">Pilot</option>
          </select>
          <button
            type="submit" disabled={yukleniyor}
            className="px-5 py-2.5 rounded-xl bg-[#fbc024] text-[#0e172a] text-sm font-bold hover:bg-[#d9a61f] transition-colors disabled:opacity-60"
          >
            {yukleniyor ? "..." : "Davet Et"}
          </button>
        </form>
      </div>

      {/* Bekleyen davetler */}
      {davetler.length > 0 && (
        <div className="glass-card rounded-2xl p-6 space-y-3">
          <h2 className="text-sm font-semibold text-white mb-3">Bekleyen Davetler</h2>
          {davetler.map((d) => (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 p-3 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)]"
            >
              <Mail className="w-4 h-4 text-[#94a3b8] shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{d.email}</p>
                <p className="text-xs text-[#64748b]">
                  {d.role === "pilot" ? "Pilot" : "Co-Pilot"} · {new Date(d.expires_at).toLocaleDateString("tr-TR")} tarihinde sona erer
                </p>
              </div>
              <button
                onClick={() => kopyala(d.token)}
                title="Davet linkini kopyala"
                className="w-8 h-8 flex items-center justify-center rounded-lg text-[#94a3b8] hover:text-[#fbc024] transition-colors"
              >
                {kopyalandi === d.token ? <Check className="w-4 h-4 text-[#22c55e]" /> : <Copy className="w-4 h-4" />}
              </button>
              <button
                onClick={() => davetSil(d.id)}
                title="Daveti iptal et"
                className="w-8 h-8 flex items-center justify-center rounded-lg text-[#94a3b8] hover:text-[#ef4444] transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
          <p className="text-xs text-[#64748b] mt-2">
            💡 Davet linkini kopyalayıp çalışana gönderin — link 7 gün geçerlidir.
          </p>
        </div>
      )}

      {/* Mevcut üyeler */}
      <div className="glass-card rounded-2xl p-6 space-y-3">
        <h2 className="text-sm font-semibold text-white mb-3">Ekip Üyeleri</h2>
        {uyeler.length === 0 ? (
          <p className="text-sm text-[#64748b] text-center py-4">Henüz üye yok</p>
        ) : (
          uyeler.map((u) => (
            <div
              key={u.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)]"
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{ background: u.role === "pilot" ? "rgba(251,192,36,0.15)" : "rgba(148,163,184,0.1)" }}>
                {u.role === "pilot"
                  ? <Crown className="w-4 h-4 text-[#fbc024]" />
                  : <Navigation className="w-4 h-4 text-[#94a3b8]" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${u.status === "inactive" ? "text-[#64748b] line-through" : "text-white"}`}>
                  {u.email}
                </p>
                <p className="text-xs text-[#64748b]">
                  {u.role === "pilot" ? "Pilot" : "Co-Pilot"}
                  {u.status === "inactive" && " · Pasif"}
                  {u.joined_at && ` · ${new Date(u.joined_at).toLocaleDateString("tr-TR")} tarihinden beri`}
                </p>
              </div>
              {u.role !== "pilot" && u.status === "active" && (
                <button
                  onClick={() => uyeDeaktif(u.id)}
                  title="Erişimi kaldır"
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-[#94a3b8] hover:text-[#ef4444] transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
