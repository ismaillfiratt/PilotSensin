"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserPlus, Mail, Copy, Check, Trash2, AlertCircle,
  Crown, ShieldCheck, Plus, X, Settings, UserX, UserCheck,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useSirket } from "@/store/sirket";
import { MODULLER, bosPermissions, COPILOT_PERMISSIONS, type Permissions, type ModulKey } from "@/lib/permissions";
import { onaylaSil } from "@/lib/onay";

interface Rol {
  id:          string;
  name:        string;
  is_owner:    boolean;
  permissions: Permissions;
}

interface Uye {
  id:               string;
  user_id:          string;
  email:            string;
  full_name:        string | null;
  role:             string;
  role_id:          string | null;
  status:           "active" | "inactive" | "pending" | "suspended";
  joined_at:        string | null;
  invited_at:       string;
  last_sign_in_at:  string | null;
  company_roles:    { name: string } | null;
}

interface Davet {
  id:          string;
  email:       string;
  role:        string;
  token:       string;
  expires_at:  string;
  accepted_at: string | null;
  created_at?: string;
}

function getSiteUrl() {
  if (typeof window !== "undefined") return window.location.origin;
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://pilotsensin.com";
}

function gorunenZaman(iso?: string | null) {
  if (!iso) return "—";
  const simdi  = new Date();
  const tarih  = new Date(iso);
  const diff   = simdi.getTime() - tarih.getTime();
  const min    = Math.floor(diff / 60_000);
  const hr     = Math.floor(min / 60);
  const gun    = Math.floor(hr / 24);
  const saat   = tarih.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });

  if (min < 1)  return "Az önce";
  if (min < 60) return `${min}dk önce`;
  if (hr  < 24) return `${hr} saat önce`;

  const bugunBaslangic = new Date(simdi); bugunBaslangic.setHours(0, 0, 0, 0);
  const dunBaslangic   = new Date(bugunBaslangic); dunBaslangic.setDate(dunBaslangic.getDate() - 1);

  if (tarih >= bugunBaslangic) return `Bugün ${saat}`;
  if (tarih >= dunBaslangic)   return `Dün ${saat}`;
  if (gun < 7)                 return `${gun} gün önce, ${saat}`;
  return `${tarih.toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" })} ${saat}`;
}

function initials(u: Uye) {
  if (u.full_name) {
    const parts = u.full_name.trim().split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }
  return u.email.slice(0, 2).toUpperCase();
}

type Sekme = "uyeler" | "davetler" | "roller" | "izinler";

export default function EkipPage() {
  const { companyId, maxUye } = useSirket();
  const [sekme,        setSekme]        = useState<Sekme>("uyeler");
  const [uyeler,       setUyeler]       = useState<Uye[]>([]);
  const [davetler,     setDavetler]     = useState<Davet[]>([]);
  const [roller,       setRoller]       = useState<Rol[]>([]);
  const [email,        setEmail]        = useState("");
  const [secilenRolId, setSecRol]       = useState("");
  const [yukleniyor,   setYuk]          = useState(false);
  const [hata,         setHata]         = useState("");
  const [rolHata,      setRolHata]      = useState("");
  const [kopyalandi,   setKop]          = useState<string | null>(null);
  const [davetModal,   setDavetModal]   = useState(false);

  const [yeniRolAdi,   setYeniRolAdi]   = useState("");
  const [yeniRolPerms, setYeniRolPerms] = useState<Permissions>(bosPermissions());
  const [rolFormu,     setRolFormu]     = useState(false);

  const yukle = useCallback(async () => {
    if (!companyId) return;
    const sb = createClient();
    const [{ data: m }, { data: d }, { data: r }] = await Promise.all([
      sb.from("company_members")
        .select("*, company_roles(name)")
        .eq("company_id", companyId)
        .order("invited_at"),
      sb.from("invitations")
        .select("*")
        .eq("company_id", companyId)
        .is("accepted_at", null)
        .order("created_at", { ascending: false }),
      sb.from("company_roles")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at"),
    ]);

    if (m) {
      setUyeler(m as Uye[]);

      // Sonradan last_sign_in_at + full_name zenginleştir (RPC fail olursa üyeler yine görünür)
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const userIds = (m as any[]).map((row) => row.user_id).filter(Boolean);
        if (userIds.length > 0) {
          const { data: enriched, error: rpcErr } = await sb.rpc("get_uye_zenginlestirme", { user_ids: userIds });
          if (!rpcErr && enriched) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const enrichMap = new Map((enriched as any[]).map((e) => [e.user_id, e]));
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const merged = (m as any[]).map((row) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const ext = enrichMap.get(row.user_id) as any;
              return {
                ...row,
                last_sign_in_at: ext?.last_sign_in_at ?? row.last_sign_in_at ?? null,
                full_name:       ext?.full_name       ?? row.full_name       ?? null,
              };
            });
            setUyeler(merged as Uye[]);
          }
        }
      } catch (e) {
        console.warn("Üye zenginleştirme RPC hatası:", e);
      }
    }

    if (d) setDavetler(d as Davet[]);
    if (r) setRoller(r as Rol[]);
    if (r && r.length > 0 && !secilenRolId) {
      const ilk = r.find((x: Rol) => !x.is_owner);
      if (ilk) setSecRol(ilk.id);
    }
  }, [companyId, secilenRolId]);

  useEffect(() => {
    if (!companyId) return;
    yukle();
    const interval = setInterval(() => yukle(), 60_000);
    const handleFocus = () => yukle();
    window.addEventListener("focus", handleFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [companyId, yukle]);

  const davetGonder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !companyId) return;
    setHata(""); setYuk(true);
    try {
      const sb = createClient();
      const { data: { session } } = await sb.auth.getSession();
      if (!session) return;
      const aktif = uyeler.filter((u) => u.status === "active").length;
      if (aktif >= maxUye) { setHata(`Paketiniz en fazla ${maxUye} üyeye izin veriyor.`); return; }
      const rol = roller.find((r) => r.id === secilenRolId);
      const { error } = await sb.from("invitations").insert({
        company_id: companyId, email: email.trim().toLowerCase(),
        role: rol?.is_owner ? "pilot" : "copilot", invited_by: session.user.id,
      });
      if (error) { setHata(error.message); return; }
      await sb.from("company_members").upsert({
        company_id: companyId, email: email.trim().toLowerCase(),
        role: rol?.is_owner ? "pilot" : "copilot", role_id: secilenRolId || null,
        permissions: rol?.permissions ?? COPILOT_PERMISSIONS, status: "pending",
      }, { onConflict: "company_id,email" });
      setEmail(""); setDavetModal(false); await yukle();
    } catch { setHata("Davet oluşturulamadı."); }
    finally { setYuk(false); }
  };

  const uyeDurumGuncelle = async (id: string, status: string) => {
    await createClient().from("company_members").update({ status }).eq("id", id);
    await yukle();
  };

  const uyeSil = async (id: string) => {
    const uye = uyeler.find(u => u.id === id);
    const { onaylandi } = await onaylaSil({ tip: "ekipUye", isim: uye?.full_name ?? uye?.email ?? "Üye" });
    if (!onaylandi) return;
    await createClient().from("company_members").delete().eq("id", id);
    await yukle();
  };

  const davetSil = async (id: string) => {
    const davet = davetler.find(d => d.id === id);
    const { onaylandi } = await onaylaSil({ tip: "davet", isim: davet?.email ?? "Davet" });
    if (!onaylandi) return;
    await createClient().from("invitations").delete().eq("id", id);
    await yukle();
  };

  const kopyala = (token: string) => {
    navigator.clipboard.writeText(`${getSiteUrl()}/davet/${token}`);
    setKop(token); setTimeout(() => setKop(null), 2000);
  };

  const rolKaydet = async () => {
    if (!yeniRolAdi.trim()) { setRolHata("Rol adı zorunlu."); return; }
    if (!companyId) { setRolHata("Şirket bilgisi yüklenemedi, sayfayı yenileyin."); return; }
    setRolHata("");
    const sb = createClient();
    const { error } = await sb.from("company_roles").insert({
      company_id: companyId, name: yeniRolAdi.trim(), permissions: yeniRolPerms,
    });
    if (error) { setRolHata(error.message); return; }
    setYeniRolAdi(""); setYeniRolPerms(bosPermissions()); setRolFormu(false);
    await yukle();
  };

  const rolSil = async (id: string) => {
    const rol = roller.find(r => r.id === id);
    const { onaylandi } = await onaylaSil({ tip: "ekipUye", isim: `${rol?.name ?? "Rol"} rolü` });
    if (!onaylandi) return;
    await createClient().from("company_roles").delete().eq("id", id);
    await yukle();
  };

  const rolPermGuncelle = async (rolId: string, perms: Permissions) => {
    const sb = createClient();
    await sb.from("company_roles").update({ permissions: perms }).eq("id", rolId);
    await sb.from("company_members").update({ permissions: perms }).eq("role_id", rolId);
    await yukle();
  };

  // ── Hesaplamalar ──
  const aktifUye   = uyeler.filter(u => u.status === "active").length;
  const pilotSay   = uyeler.filter(u => u.role === "pilot").length;
  const copilotSay = uyeler.filter(u => u.role !== "pilot").length;
  const ozelRolSay = roller.filter(r => !r.is_owner).length;

  const buHaftaSay = uyeler.filter(u => {
    if (!u.last_sign_in_at) return false;
    return new Date(u.last_sign_in_at) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  }).length;
  const hasSignIn  = uyeler.some(u => u.last_sign_in_at != null);

  const enEskiDavetTarih = davetler.length > 0
    ? davetler.reduce((min, d) => {
        const t = d.created_at ?? d.expires_at;
        return !min || t < min ? t : min;
      }, "")
    : null;
  const enEskiGun = enEskiDavetTarih
    ? Math.floor((Date.now() - new Date(enEskiDavetTarih).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const SEKMELER: { value: Sekme; label: string; sayac: number }[] = [
    { value: "uyeler",   label: "Üyeler",           sayac: uyeler.length   },
    { value: "davetler", label: "Bekleyen Davetler", sayac: davetler.length },
    { value: "roller",   label: "Roller",            sayac: roller.length   },
    { value: "izinler",  label: "Rol İzinleri",      sayac: roller.length   },
  ];

  return (
    <div className="max-w-6xl mx-auto px-2">

      {/* ── HERO ── */}
      <section className="py-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <p className="label-caps">EKİP YÖNETİMİ</p>
            <div className="flex items-baseline gap-2">
              <span className="hero-number font-number">{aktifUye}</span>
              <span className="text-base text-gray-500">aktif üye</span>
            </div>
            <p className="text-sm text-gray-500">
              {pilotSay} Pilot · {copilotSay} Co-Pilot
              {davetler.length > 0 && (
                <span style={{ color: "#B45309" }}> · {davetler.length} bekleyen davet</span>
              )}
            </p>
          </div>
          <button
            onClick={() => { setHata(""); setDavetModal(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-(--forest) text-white text-sm font-bold hover:opacity-90 transition-colors shrink-0"
          >
            <UserPlus className="w-4 h-4" /> Üye Davet Et
          </button>
        </div>
      </section>

      <hr className="section-rule" />

      {/* ── 4 STAT STRIP ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 py-4">
        {/* Aktif Üye */}
        <div className="stat-card rounded-2xl p-4">
          <p className="label-caps">AKTİF ÜYE</p>
          <p className="font-number font-semibold text-xl text-gray-950 tabular-nums mt-1">{aktifUye}</p>
          <p className="text-xs font-medium mt-0.5"
            style={{ color: aktifUye >= maxUye ? "#ef4444" : aktifUye >= maxUye * 0.8 ? "#B45309" : "#22c55e" }}>
            {aktifUye} / {maxUye} limit
          </p>
        </div>
        {/* Bekleyen Davet */}
        <div className="stat-card rounded-2xl p-4">
          <p className="label-caps">BEKLEYEN DAVET</p>
          <p className="font-number font-semibold text-xl tabular-nums mt-1"
            style={{ color: davetler.length > 0 ? "#B45309" : "#94a3b8" }}>
            {davetler.length}
          </p>
          <p className="text-xs font-medium mt-0.5"
            style={{ color: enEskiGun > 0 ? "#B45309" : "#94a3b8" }}>
            {enEskiGun > 0 ? `${enEskiGun} gün önce gönderildi` : "Bekleyen davet yok"}
          </p>
        </div>
        {/* Bu Hafta Giriş */}
        <div className="stat-card rounded-2xl p-4">
          <p className="label-caps">BU HAFTA GİRİŞ</p>
          <p className="font-number font-semibold text-xl tabular-nums mt-1"
            style={{ color: hasSignIn ? (buHaftaSay > 0 ? "#0F172A" : "#94a3b8") : "#94a3b8" }}>
            {hasSignIn ? buHaftaSay : "—"}
          </p>
          <p className="text-xs font-medium mt-0.5"
            style={{ color: hasSignIn && buHaftaSay > 0 ? "#22c55e" : "#94a3b8" }}>
            {hasSignIn ? `${buHaftaSay} üye aktif` : "Veri yok"}
          </p>
        </div>
        {/* Toplam Rol */}
        <div className="stat-card rounded-2xl p-4">
          <p className="label-caps">TOPLAM ROL</p>
          <p className="font-number font-semibold text-xl text-gray-950 tabular-nums mt-1">{roller.length}</p>
          <p className="text-xs font-medium mt-0.5" style={{ color: "var(--leaf)" }}>
            Pilot + {ozelRolSay} özel rol
          </p>
        </div>
      </div>

      <hr className="section-rule" />

      {/* ── SEKME BAR ── */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-gray-50 border border-gray-200 mb-4 overflow-x-auto scrollbar-hide">
        {SEKMELER.map(({ value, label, sayac }) => (
          <button key={value} onClick={() => setSekme(value)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all shrink-0"
            style={{
              backgroundColor: sekme === value ? "var(--mint)" : "transparent",
              color:           sekme === value ? "var(--leaf)" : "#94a3b8",
              border:          sekme === value ? "1px solid var(--forest-200, #B3E8C8)" : "1px solid transparent",
            }}>
            {label}
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold"
              style={{
                backgroundColor: sekme === value ? "rgba(74,166,101,0.15)" : "rgba(0,0,0,0.06)",
                color:           sekme === value ? "var(--leaf)" : "#94a3b8",
              }}>
              {sayac}
            </span>
          </button>
        ))}
      </div>

      {/* ── F.1 ÜYELER ── */}
      {sekme === "uyeler" && (
        <div className="card rounded-2xl overflow-hidden">
          {/* Başlık */}
          <div className="grid gap-3 px-5 py-3 bg-gray-50 border-b border-gray-100"
            style={{ gridTemplateColumns: "minmax(160px,1.4fr) 90px 1fr 80px" }}>
            {["ÜYE", "ROL", "SON GİRİŞ", "AKSİYON"].map((h, i) => (
              <span key={h}
                className={`text-[10px] font-semibold text-gray-400 uppercase tracking-wider ${i === 3 ? "text-right" : ""}`}>
                {h}
              </span>
            ))}
          </div>

          {uyeler.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-sm">
              Henüz üye yok.{" "}
              <button onClick={() => setDavetModal(true)} className="text-(--leaf) hover:underline">
                + Üye Davet Et
              </button>
            </div>
          ) : uyeler.map((u) => {
            const isPilot = u.role === "pilot";
            const rolAdi  = u.company_roles?.name ?? (isPilot ? "Pilot" : "Co-Pilot");
            return (
              <div key={u.id}
                className="grid gap-3 px-5 py-3.5 items-center hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                style={{ gridTemplateColumns: "minmax(160px,1.4fr) 90px 1fr 80px" }}>

                {/* Avatar + isim */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold text-white"
                    style={{ backgroundColor: isPilot ? "var(--forest)" : "#94a3b8" }}>
                    {initials(u)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate leading-snug">
                      {u.full_name ?? u.email.split("@")[0]}
                    </p>
                    {u.full_name && <p className="text-[11px] text-gray-500 truncate">{u.email}</p>}
                    {u.status === "pending" && (
                      <span className="text-[10px] font-medium" style={{ color: "#B45309" }}>Davet bekleniyor</span>
                    )}
                  </div>
                </div>

                {/* Rol pill */}
                <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-lg w-fit truncate"
                  style={isPilot
                    ? { background: "var(--mint)", color: "var(--leaf)", border: "1px solid var(--forest-200, #B3E8C8)" }
                    : { background: "rgba(148,163,184,0.08)", color: "#64748b", border: "1px solid rgba(148,163,184,0.15)" }
                  }>
                  {isPilot && <Crown className="w-2.5 h-2.5 shrink-0" />}
                  {rolAdi}
                </span>

                {/* Son giriş */}
                <span className="text-xs"
                  style={{ color: u.last_sign_in_at ? "var(--text-secondary)" : "#cbd5e1" }}>
                  {u.last_sign_in_at ? gorunenZaman(u.last_sign_in_at) : "Henüz giriş yapmadı"}
                </span>

                {/* Aksiyon */}
                <div className="flex items-center justify-end gap-1">
                  {isPilot ? (
                    <span className="text-xs text-gray-300">—</span>
                  ) : (
                    <>
                      {u.status === "active" && (
                        <button onClick={() => uyeDurumGuncelle(u.id, "suspended")} title="Askıya al"
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 border border-gray-200 hover:border-amber-200 hover:text-amber-500 transition-all">
                          <UserX className="w-3 h-3" />
                        </button>
                      )}
                      {u.status === "suspended" && (
                        <button onClick={() => uyeDurumGuncelle(u.id, "active")} title="Yeniden aktif et"
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 border border-gray-200 hover:border-green-200 hover:text-[#22c55e] transition-all">
                          <UserCheck className="w-3 h-3" />
                        </button>
                      )}
                      <button onClick={() => uyeSil(u.id)} title="Üyeyi kaldır"
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 border border-gray-200 hover:border-red-200 hover:text-[#ef4444] transition-all">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── F.2 BEKLEYEN DAVETLER ── */}
      {sekme === "davetler" && (
        <div className="card rounded-2xl overflow-hidden">
          <div className="grid gap-3 px-5 py-3 bg-gray-50 border-b border-gray-100"
            style={{ gridTemplateColumns: "minmax(160px,1fr) 80px 110px 100px 56px" }}>
            {["EMAIL", "ROL", "GÖNDERİLDİ", "BAĞLANTI", ""].map((h, i) => (
              <span key={i} className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{h}</span>
            ))}
          </div>

          {davetler.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-sm">Bekleyen davet yok.</div>
          ) : davetler.map((d) => {
            const gunFarki = d.created_at
              ? Math.floor((Date.now() - new Date(d.created_at).getTime()) / (1000 * 60 * 60 * 24))
              : null;
            return (
              <div key={d.id}
                className="grid gap-3 px-5 py-3.5 items-center hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                style={{ gridTemplateColumns: "minmax(160px,1fr) 80px 110px 100px 56px" }}>

                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{d.email}</p>
                  <p className="text-[10px] font-medium mt-0.5" style={{ color: "#B45309" }}>
                    Davet bekleniyor{gunFarki != null ? ` · ${gunFarki} gün` : ""}
                  </p>
                </div>

                <span className="text-[10px] font-medium px-2 py-1 rounded-lg w-fit"
                  style={{ background: "rgba(148,163,184,0.08)", color: "#64748b", border: "1px solid rgba(148,163,184,0.15)" }}>
                  {d.role === "pilot" ? "Pilot" : "Co-Pilot"}
                </span>

                <span className="text-xs text-gray-600">{gorunenZaman(d.created_at)}</span>

                <button onClick={() => kopyala(d.token)}
                  className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:border-(--forest-200,#B3E8C8) hover:text-(--leaf) transition-all w-fit">
                  {kopyalandi === d.token
                    ? <><Check className="w-3 h-3 text-[#22c55e]" /><span className="text-[#22c55e]">Kopyalandı</span></>
                    : <><Copy className="w-3 h-3" />Kopyala</>}
                </button>

                <div className="flex items-center justify-end">
                  <button onClick={() => davetSil(d.id)} title="İptal et"
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 border border-gray-200 hover:border-red-200 hover:text-[#ef4444] transition-all">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── F.3 ROLLER ── */}
      {sekme === "roller" && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button onClick={() => setRolFormu(!rolFormu)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-(--forest) text-white text-sm font-bold hover:opacity-90 transition-colors">
              <Plus className="w-4 h-4" /> Yeni Rol
            </button>
          </div>

          <AnimatePresence>
            {rolFormu && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="card rounded-2xl p-5 space-y-4 border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-800">Yeni Rol Oluştur</h3>
                <input value={yeniRolAdi} onChange={(e) => setYeniRolAdi(e.target.value)}
                  placeholder="Rol adı (örn: Stok Sorumlusu)"
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-(--leaf) text-sm" />
                <div>
                  <p className="label-caps mb-2">Modül Erişimi</p>
                  <div className="grid grid-cols-2 gap-2">
                    {MODULLER.filter(m => m.key !== "ekip").map(({ key, label }) => (
                      <label key={key} className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={yeniRolPerms.modules[key as ModulKey] ?? false}
                          onChange={(e) => setYeniRolPerms(p => ({ ...p, modules: { ...p.modules, [key]: e.target.checked } }))}
                          className="w-4 h-4 rounded accent-(--leaf)" />
                        <span className="text-sm text-gray-500">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={yeniRolPerms.canEdit}
                    onChange={(e) => setYeniRolPerms(p => ({ ...p, canEdit: e.target.checked }))}
                    className="w-4 h-4 rounded accent-(--leaf)" />
                  <span className="text-sm text-gray-700 font-medium">Düzenleme yetkisi (veri ekleyebilir/silebilir)</span>
                </label>
                {rolHata && (
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.25)]">
                    <AlertCircle className="w-4 h-4 text-[#ef4444] shrink-0" />
                    <p className="text-sm text-[#ef4444]">{rolHata}</p>
                  </div>
                )}
                <div className="flex gap-3">
                  <button onClick={rolKaydet}
                    className="flex-1 py-2.5 rounded-xl bg-(--forest) text-white text-sm font-bold hover:opacity-90 transition-colors">
                    Kaydet
                  </button>
                  <button onClick={() => { setRolFormu(false); setRolHata(""); }}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-400 text-sm hover:bg-gray-50 transition-colors">
                    İptal
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {roller.length === 0 && !rolFormu && (
            <div className="py-16 text-center text-gray-400 text-sm card rounded-2xl">Henüz rol yok.</div>
          )}
          {roller.map((r) => (
            <RolKart key={r.id} rol={r} uyeler={uyeler} onSil={rolSil} onGuncelle={rolPermGuncelle} />
          ))}
        </div>
      )}

      {/* ── F.4 ROL İZİNLERİ ── */}
      {sekme === "izinler" && (
        <div className="card rounded-2xl overflow-hidden">
          {roller.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-sm">
              Henüz özel rol yok.{" "}
              <button onClick={() => { setSekme("roller"); setRolFormu(true); }} className="text-(--leaf) hover:underline">
                + Yeni Rol oluşturun
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left py-3 px-5 text-gray-400 font-semibold uppercase tracking-wider w-44">Modül</th>
                    {roller.map(r => (
                      <th key={r.id} className="py-3 px-4 text-center text-gray-400 font-semibold uppercase tracking-wider whitespace-nowrap">
                        {r.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {MODULLER.map(({ key, label }) => (
                    <tr key={key} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-5 text-gray-700 font-medium">{label}</td>
                      {roller.map(r => {
                        const erisim = r.is_owner || (r.permissions.modules?.[key as ModulKey] ?? false);
                        return (
                          <td key={r.id} className="py-3 px-4 text-center">
                            {erisim
                              ? <Check className="w-4 h-4 text-[#22c55e] mx-auto" />
                              : <span className="text-gray-300">—</span>}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  <tr className="hover:bg-gray-50 transition-colors border-t-2 border-gray-200">
                    <td className="py-3 px-5 text-gray-700 font-medium">Düzenleme</td>
                    {roller.map(r => {
                      const erisim = r.is_owner || (r.permissions.canEdit ?? false);
                      return (
                        <td key={r.id} className="py-3 px-4 text-center">
                          {erisim
                            ? <Check className="w-4 h-4 text-[#22c55e] mx-auto" />
                            : <span className="text-gray-300">—</span>}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── DAVET MODAL ── */}
      <AnimatePresence>
        {davetModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setDavetModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }} transition={{ duration: 0.18 }}
              className="w-full max-w-sm bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-semibold text-gray-800">Yeni Üye Davet Et</h3>
                <button onClick={() => setDavetModal(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-800 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {hata && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] mb-4">
                  <AlertCircle className="w-4 h-4 text-[#ef4444] shrink-0" />
                  <p className="text-sm text-[#ef4444]">{hata}</p>
                </div>
              )}

              {roller.filter(r => !r.is_owner).length === 0 ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-500">Davet etmek için önce bir rol oluşturun.</p>
                  <button onClick={() => { setDavetModal(false); setSekme("roller"); setRolFormu(true); }}
                    className="w-full py-2.5 rounded-xl bg-(--forest) text-white text-sm font-bold hover:opacity-90 transition-colors">
                    Rol Oluştur
                  </button>
                </div>
              ) : (
                <form onSubmit={davetGonder} className="space-y-3">
                  <div>
                    <label className="label-caps block mb-1.5">Email Adresi</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                        placeholder="calisan@isletme.com"
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-(--leaf) text-sm transition-colors" />
                    </div>
                  </div>
                  <div>
                    <label className="label-caps block mb-1.5">Rol</label>
                    <select value={secilenRolId} onChange={(e) => setSecRol(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 text-sm focus:outline-none focus:border-(--leaf)">
                      {roller.filter(r => !r.is_owner).map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-3 pt-1">
                    <button type="button" onClick={() => setDavetModal(false)}
                      className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-400 text-sm font-medium hover:bg-gray-50 transition-colors">
                      İptal
                    </button>
                    <button type="submit" disabled={yukleniyor}
                      className="flex-1 py-2.5 rounded-xl bg-(--forest) text-white text-sm font-bold hover:opacity-90 transition-colors disabled:opacity-60">
                      {yukleniyor ? "Gönderiliyor..." : "Davet Et"}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── RolKart bileşeni ──────────────────────────────────────────────────────────
function RolKart({ rol, uyeler, onSil, onGuncelle }: {
  rol:        Rol;
  uyeler:     Uye[];
  onSil:      (id: string) => void;
  onGuncelle: (id: string, p: Permissions) => void;
}) {
  const [acik,  setAcik]  = useState(false);
  const [perms, setPerms] = useState<Permissions>(rol.permissions);

  const uyeSayisi   = uyeler.filter(u => rol.is_owner ? u.role === "pilot" : u.role_id === rol.id).length;
  const modulSayisi = rol.is_owner
    ? MODULLER.length
    : MODULLER.filter(m => perms.modules?.[m.key as ModulKey]).length;

  return (
    <div className="card rounded-2xl overflow-hidden">
      <button type="button"
        onClick={() => !rol.is_owner && setAcik(!acik)}
        className={`w-full flex items-center justify-between px-5 py-4 transition-colors ${!rol.is_owner ? "hover:bg-gray-50 cursor-pointer" : "cursor-default"}`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{
              background: rol.is_owner ? "var(--mint)" : "rgba(148,163,184,0.1)",
              border: "1px solid rgba(148,163,184,0.15)",
            }}>
            {rol.is_owner
              ? <Crown className="w-4 h-4 text-(--leaf)" />
              : <ShieldCheck className="w-4 h-4 text-gray-400" />}
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-gray-900">{rol.name}</p>
              {rol.is_owner && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                  style={{ background: "var(--mint)", color: "var(--leaf)" }}>
                  Sahip
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500">
              {uyeSayisi} üye · {modulSayisi}/{MODULLER.length} modül
              {!rol.is_owner && perms.canEdit && " · Düzenleyebilir"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {!rol.is_owner && (
            <>
              <motion.div animate={{ rotate: acik ? 90 : 0 }} transition={{ duration: 0.15 }}>
                <Settings className="w-3.5 h-3.5 text-gray-400" />
              </motion.div>
              <button type="button" onClick={(e) => { e.stopPropagation(); onSil(rol.id); }}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 border border-gray-200 hover:border-red-200 hover:text-[#ef4444] transition-all">
                <Trash2 className="w-3 h-3" />
              </button>
            </>
          )}
        </div>
      </button>

      {/* Modül etiketleri — kapalıyken */}
      {!acik && (
        <div className="flex flex-wrap gap-1.5 px-5 pb-4">
          {MODULLER.filter(m => rol.is_owner || perms.modules?.[m.key as ModulKey]).map(({ key, label }) => (
            <span key={key} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200">
              {label}
            </span>
          ))}
          {!rol.is_owner && perms.canEdit && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[rgba(34,197,94,0.08)] text-[#22c55e] border border-[rgba(34,197,94,0.15)]">
              Düzenleyebilir
            </span>
          )}
        </div>
      )}

      {/* Açık panel — izin ayarları */}
      <AnimatePresence>
        {acik && !rol.is_owner && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="px-5 pb-5 border-t border-gray-200 space-y-4 pt-4">
              <p className="label-caps">Modül Erişimi</p>
              <div className="grid grid-cols-2 gap-2">
                {MODULLER.filter(m => m.key !== "ekip").map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={perms.modules?.[key as ModulKey] ?? false}
                      onChange={(e) => setPerms(p => ({ ...p, modules: { ...p.modules, [key]: e.target.checked } }))}
                      className="w-4 h-4 rounded accent-(--leaf)" />
                    <span className="text-sm text-gray-500">{label}</span>
                  </label>
                ))}
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={perms.canEdit ?? false}
                  onChange={(e) => setPerms(p => ({ ...p, canEdit: e.target.checked }))}
                  className="w-4 h-4 rounded accent-(--leaf)" />
                <span className="text-sm text-gray-700 font-medium">Düzenleme yetkisi</span>
              </label>
              <button onClick={() => { onGuncelle(rol.id, perms); setAcik(false); }}
                className="w-full py-2.5 rounded-xl bg-(--forest) text-white text-sm font-bold hover:opacity-90 transition-colors">
                Kaydet
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
