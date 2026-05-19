"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, UserPlus, Mail, Copy, Check, Trash2, AlertCircle,
  Crown, ShieldCheck, Plus, X, Settings, UserX, UserCheck,
  Clock, CheckCircle2,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useSirket } from "@/store/sirket";
import { MODULLER, bosPermissions, COPILOT_PERMISSIONS, type Permissions } from "@/lib/permissions";
import { onaylaSil } from "@/lib/onay";

interface Rol {
  id:          string;
  name:        string;
  is_owner:    boolean;
  permissions: Permissions;
}

interface Uye {
  id:            string;
  email:         string;
  full_name:     string | null;
  role:          string;
  role_id:       string | null;
  status:        "active" | "inactive" | "pending" | "suspended";
  joined_at:     string | null;
  invited_at:    string;
  company_roles: { name: string } | null;
}

interface Davet {
  id:          string;
  email:       string;
  role:        string;
  token:       string;
  expires_at:  string;
  accepted_at: string | null;
}

function getSiteUrl() {
  if (typeof window !== "undefined") return window.location.origin;
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://pilotsensin.com";
}

const DURUM_ETIKET: Record<string, { label: string; color: string }> = {
  active:    { label: "Aktif",     color: "#22c55e" },
  pending:   { label: "Beklemede", color: "var(--leaf)" },
  suspended: { label: "Askıda",    color: "#ef4444" },
  inactive:  { label: "Pasif",     color: "#64748b" },
};

export default function EkipPage() {
  const { companyId, maxUye } = useSirket();
  const [sekme, setSekme]       = useState<"uyeler" | "roller">("uyeler");
  const [uyeler, setUyeler]     = useState<Uye[]>([]);
  const [davetler, setDavetler] = useState<Davet[]>([]);
  const [roller, setRoller]     = useState<Rol[]>([]);
  const [email, setEmail]       = useState("");
  const [secilenRolId, setSecRol] = useState("");
  const [yukleniyor, setYuk]    = useState(false);
  const [hata, setHata]         = useState("");
  const [rolHata, setRolHata]   = useState("");
  const [kopyalandi, setKop]    = useState<string | null>(null);

  // Yeni rol formu
  const [yeniRolAdi, setYeniRolAdi]   = useState("");
  const [yeniRolPerms, setYeniRolPerms] = useState<Permissions>(bosPermissions());
  const [rolFormu, setRolFormu]         = useState(false);

  const yukle = useCallback(async () => {
    if (!companyId) return;
    const sb = createClient();
    const [{ data: m }, { data: d }, { data: r }] = await Promise.all([
      sb.from("company_members").select("*, company_roles(name)").eq("company_id", companyId).order("invited_at"),
      sb.from("invitations").select("*").eq("company_id", companyId).is("accepted_at", null).order("created_at", { ascending: false }),
      sb.from("company_roles").select("*").eq("company_id", companyId).order("created_at"),
    ]);
    if (m) setUyeler(m as Uye[]);
    if (d) setDavetler(d as Davet[]);
    if (r) setRoller(r as Rol[]);
    if (r && r.length > 0 && !secilenRolId) {
      const ilk = r.find((x: Rol) => !x.is_owner);
      if (ilk) setSecRol(ilk.id);
    }
  }, [companyId, secilenRolId]);

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
      const aktif = uyeler.filter((u) => u.status === "active").length;
      if (aktif >= maxUye) { setHata(`Paketiniz en fazla ${maxUye} üyeye izin veriyor.`); return; }

      const rol = roller.find((r) => r.id === secilenRolId);
      const { error } = await sb.from("invitations").insert({
        company_id: companyId,
        email:      email.trim().toLowerCase(),
        role:       rol?.is_owner ? "pilot" : "copilot",
        invited_by: session.user.id,
      });
      if (error) { setHata(error.message); return; }

      // Bekleyen üye kaydı oluştur
      await sb.from("company_members").upsert({
        company_id:  companyId,
        email:       email.trim().toLowerCase(),
        role:        rol?.is_owner ? "pilot" : "copilot",
        role_id:     secilenRolId || null,
        permissions: rol?.permissions ?? COPILOT_PERMISSIONS,
        status:      "pending",
      }, { onConflict: "company_id,email" });

      setEmail("");
      await yukle();
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
    setKop(token);
    setTimeout(() => setKop(null), 2000);
  };

  const rolKaydet = async () => {
    if (!yeniRolAdi.trim()) { setRolHata("Rol adı zorunlu."); return; }
    if (!companyId) { setRolHata("Şirket bilgisi yüklenemedi, sayfayı yenileyin."); return; }
    setRolHata("");
    const sb = createClient();
    const { error } = await sb.from("company_roles").insert({
      company_id:  companyId,
      name:        yeniRolAdi.trim(),
      permissions: yeniRolPerms,
    });
    if (error) { setRolHata(error.message); return; }
    setYeniRolAdi("");
    setYeniRolPerms(bosPermissions());
    setRolFormu(false);
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

  const aktifUye = uyeler.filter((u) => u.status === "active").length;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Başlık */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--mint)] border border-[var(--forest-200, #B3E8C8)] flex items-center justify-center">
            <Users className="w-5 h-5 text-[var(--leaf)]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Ekip Yönetimi</h1>
            <p className="text-sm text-gray-400">{aktifUye} / {maxUye} aktif üye</p>
          </div>
        </div>

        {/* Sekmeler */}
        <div className="flex rounded-xl overflow-hidden border border-gray-200">
          {(["uyeler", "roller"] as const).map((s) => (
            <button key={s} onClick={() => setSekme(s)}
              className="px-4 py-2.5 min-h-11 text-sm font-medium transition-colors"
              style={sekme === s
                ? { background: "var(--mint)", color: "var(--leaf)" }
                : { background: "transparent", color: "#94a3b8" }
              }>
              {s === "uyeler" ? "Üyeler" : "Roller"}
            </button>
          ))}
        </div>
      </div>

      {/* ─── ÜYELER SEKMESİ ─── */}
      {sekme === "uyeler" && (
        <>
          {/* Davet formu */}
          <div className="card rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-[var(--leaf)]" />
              <h2 className="text-sm font-semibold text-gray-800">Yeni Üye Davet Et</h2>
            </div>
            {hata && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.25)]">
                <AlertCircle className="w-4 h-4 text-[#ef4444] shrink-0" />
                <p className="text-sm text-[#ef4444]">{hata}</p>
              </div>
            )}
            {roller.filter((r) => !r.is_owner).length === 0 ? (
              /* Hiç rol yoksa → Rol Ekle butonu */
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--mint)] border border-[var(--mint)]">
                <AlertCircle className="w-4 h-4 text-[var(--leaf)] shrink-0" />
                <p className="text-sm text-gray-400 flex-1">Davet etmek için önce bir rol oluşturun.</p>
                <button
                  type="button"
                  onClick={() => { setSekme("roller"); setRolFormu(true); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--forest)] text-gray-900 text-xs font-bold hover:opacity-90 transition-colors shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Rol Ekle
                </button>
              </div>
            ) : (
              <form onSubmit={davetGonder} className="flex gap-3 flex-col sm:flex-row">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="calisan@isletme.com"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder-[#94a3b8] focus:outline-none focus:border-[var(--leaf)] text-sm transition-colors" />
                </div>
                <select value={secilenRolId} onChange={(e) => setSecRol(e.target.value)}
                  className="px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 text-sm focus:outline-none focus:border-[var(--leaf)]">
                  {roller.filter((r) => !r.is_owner).map((r) => (
                    <option key={r.id} value={r.id} className="bg-[var(--forest)]">{r.name}</option>
                  ))}
                </select>
                <button type="submit" disabled={yukleniyor}
                  className="px-5 py-2.5 rounded-xl bg-[var(--forest)] text-gray-800 text-sm font-bold hover:opacity-90 transition-colors disabled:opacity-60">
                  {yukleniyor ? "..." : "Davet Et"}
                </button>
              </form>
            )}
          </div>

          {/* Bekleyen davetler */}
          {davetler.length > 0 && (
            <div className="card rounded-2xl p-6 space-y-3">
              <h2 className="text-sm font-semibold text-gray-800 mb-3">Bekleyen Davetler</h2>
              {davetler.map((d) => (
                <div key={d.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200">
                  <Clock className="w-4 h-4 text-[var(--leaf)] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 truncate">{d.email}</p>
                    <p className="text-xs text-gray-500">{new Date(d.expires_at).toLocaleDateString("tr-TR")} tarihinde sona erer</p>
                  </div>
                  <button onClick={() => kopyala(d.token)} title="Linki kopyala"
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-[var(--leaf)] transition-colors">
                    {kopyalandi === d.token ? <Check className="w-4 h-4 text-[#22c55e]" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button onClick={() => davetSil(d.id)} title="İptal et"
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-[#ef4444] transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <p className="text-xs text-gray-500">💡 Link simgesine basarak davet linkini kopyalayın ve çalışana gönderin.</p>
            </div>
          )}

          {/* Üye listesi */}
          <div className="card rounded-2xl p-6 space-y-3">
            <h2 className="text-sm font-semibold text-gray-800 mb-3">Tüm Üyeler</h2>
            {uyeler.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Henüz üye yok</p>
            ) : uyeler.map((u) => {
              const durum = DURUM_ETIKET[u.status] ?? DURUM_ETIKET.inactive;
              return (
                <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: u.role === "pilot" ? "var(--mint)" : "rgba(148,163,184,0.1)" }}>
                    {u.role === "pilot" ? <Crown className="w-4 h-4 text-[var(--leaf)]" /> : <ShieldCheck className="w-4 h-4 text-gray-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {u.full_name ?? u.email}
                      </p>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0"
                        style={{
                          background: u.role === "pilot" ? "var(--mint)" : "rgba(148,163,184,0.1)",
                          color:      u.role === "pilot" ? "var(--leaf)" : "#94a3b8",
                          border:     u.role === "pilot" ? "1px solid var(--forest-200, #B3E8C8)" : "1px solid rgba(148,163,184,0.15)",
                        }}>
                        {u.company_roles?.name ?? (u.role === "pilot" ? "Pilot" : "Co-Pilot")}
                      </span>
                    </div>
                    {u.full_name && <p className="text-xs text-gray-500 truncate">{u.email}</p>}
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-medium" style={{ color: durum.color }}>{durum.label}</span>
                      {u.joined_at && (
                        <span className="text-[10px] text-gray-500">
                          · {new Date(u.joined_at).toLocaleDateString("tr-TR")} tarihinden beri
                        </span>
                      )}
                    </div>
                  </div>
                  {u.role !== "pilot" && (
                    <div className="flex items-center gap-1">
                      {u.status === "active" && (
                        <button onClick={() => uyeDurumGuncelle(u.id, "suspended")}
                          title="Askıya al"
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-[var(--leaf)] transition-colors">
                          <UserX className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {u.status === "suspended" && (
                        <button onClick={() => uyeDurumGuncelle(u.id, "active")}
                          title="Yeniden aktif et"
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-[#22c55e] transition-colors">
                          <UserCheck className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button onClick={() => uyeSil(u.id)}
                        title="Kullanıcıyı sil"
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-[#ef4444] transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  {u.status === "pending" && (
                    <span title="Davet bekleniyor"><CheckCircle2 className="w-4 h-4 text-[var(--leaf)] shrink-0" /></span>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ─── ROLLER SEKMESİ ─── */}
      {sekme === "roller" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setRolFormu(!rolFormu)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--forest)] text-gray-800 text-sm font-bold hover:opacity-90 transition-colors">
              <Plus className="w-4 h-4" />
              Yeni Rol
            </button>
          </div>

          {/* Yeni rol formu */}
          <AnimatePresence>
            {rolFormu && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="card rounded-2xl p-6 space-y-4 border border-[var(--forest-100, #D9F2E4)]"
              >
                <h3 className="text-sm font-semibold text-gray-800">Yeni Rol Oluştur</h3>
                <input value={yeniRolAdi} onChange={(e) => setYeniRolAdi(e.target.value)}
                  placeholder="Rol adı (örn: Stok Sorumlusu)"
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder-[#94a3b8] focus:outline-none focus:border-[var(--leaf)] text-sm" />

                <div>
                  <p className="text-xs text-gray-400 font-medium mb-2">Modül Erişimi</p>
                  <div className="grid grid-cols-2 gap-2">
                    {MODULLER.filter((m) => m.key !== "ekip").map(({ key, label }) => (
                      <label key={key} className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox"
                          checked={yeniRolPerms.modules[key] ?? false}
                          onChange={(e) => setYeniRolPerms((p) => ({
                            ...p,
                            modules: { ...p.modules, [key]: e.target.checked },
                          }))}
                          className="w-4 h-4 rounded accent-[var(--leaf)]"
                        />
                        <span className="text-sm text-gray-400">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox"
                    checked={yeniRolPerms.canEdit}
                    onChange={(e) => setYeniRolPerms((p) => ({ ...p, canEdit: e.target.checked }))}
                    className="w-4 h-4 rounded accent-[var(--leaf)]"
                  />
                  <span className="text-sm text-gray-800 font-medium">Düzenleme yetkisi (veri ekleyebilir/silebilir)</span>
                </label>

                {rolHata && (
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.25)]">
                    <AlertCircle className="w-4 h-4 text-[#ef4444] shrink-0" />
                    <p className="text-sm text-[#ef4444]">{rolHata}</p>
                  </div>
                )}
                <div className="flex gap-3">
                  <button onClick={rolKaydet}
                    className="flex-1 py-2.5 rounded-xl bg-[var(--forest)] text-gray-800 text-sm font-bold hover:opacity-90 transition-colors">
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

          {/* Mevcut roller */}
          {roller.map((r) => (
            <RolKart key={r.id} rol={r} onSil={rolSil} onGuncelle={rolPermGuncelle} />
          ))}
        </div>
      )}
    </div>
  );
}

function RolKart({ rol, onSil, onGuncelle }: { rol: Rol; onSil: (id: string) => void; onGuncelle: (id: string, p: Permissions) => void }) {
  const [acik, setAcik]   = useState(false);
  const [perms, setPerms] = useState<Permissions>(rol.permissions);

  return (
    <div className="card rounded-2xl overflow-hidden">
      {/* Başlık — tıklanınca aç/kapa */}
      <button
        type="button"
        onClick={() => !rol.is_owner && setAcik(!acik)}
        className={`w-full flex items-center justify-between px-5 py-4 transition-colors ${!rol.is_owner ? "hover:bg-gray-50 cursor-pointer" : "cursor-default"}`}
      >
        <div className="flex items-center gap-2">
          {rol.is_owner ? <Crown className="w-4 h-4 text-[var(--leaf)]" /> : <ShieldCheck className="w-4 h-4 text-gray-400" />}
          <span className="text-sm font-semibold text-gray-800">{rol.name}</span>
          {rol.is_owner && <span className="text-[10px] text-[var(--leaf)] bg-[var(--mint)] px-1.5 py-0.5 rounded-full">Sahip</span>}
        </div>
        <div className="flex items-center gap-2">
          {!rol.is_owner && (
            <>
              <motion.div animate={{ rotate: acik ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <Settings className="w-3.5 h-3.5 text-gray-500" />
              </motion.div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onSil(rol.id); }}
                className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-500 hover:text-[#ef4444] transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </button>

      {/* Modül etiketleri — kapalıyken */}
      {!acik && (
        <div className="flex flex-wrap gap-1.5 px-5 pb-4">
          {MODULLER.filter((m) => rol.is_owner || perms.modules?.[m.key]).map(({ key, label }) => (
            <span key={key} className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--mint)] text-gray-400 border border-gray-200">
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

      {/* Açık panel — modül ayarları */}
      <AnimatePresence>
        {acik && !rol.is_owner && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 border-t border-gray-200 space-y-4 pt-4">
              <p className="text-xs text-gray-400 font-medium">Modül Erişimi</p>
              <div className="grid grid-cols-2 gap-2">
                {MODULLER.filter((m) => m.key !== "ekip").map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox"
                      checked={perms.modules?.[key] ?? false}
                      onChange={(e) => setPerms((p) => ({ ...p, modules: { ...p.modules, [key]: e.target.checked } }))}
                      className="w-4 h-4 rounded accent-[var(--leaf)]"
                    />
                    <span className="text-sm text-gray-400">{label}</span>
                  </label>
                ))}
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox"
                  checked={perms.canEdit ?? false}
                  onChange={(e) => setPerms((p) => ({ ...p, canEdit: e.target.checked }))}
                  className="w-4 h-4 rounded accent-[var(--leaf)]"
                />
                <span className="text-sm text-gray-800 font-medium">Düzenleme yetkisi (veri ekleyebilir/silebilir)</span>
              </label>
              <button
                onClick={() => { onGuncelle(rol.id, perms); setAcik(false); }}
                className="w-full py-2 rounded-xl bg-[var(--forest)] text-gray-800 text-sm font-bold hover:opacity-90 transition-colors"
              >
                Kaydet
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
