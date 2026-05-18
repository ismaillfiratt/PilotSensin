"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

/* ─── Tipler ─────────────────────────────────────────────────────────────── */

interface Sirket {
  id: string; name: string; owner_email: string;
  uye_sayisi: number; plan: string; created_at: string;
}
interface SirketRow {
  id: string; name: string; plan: string; created_at: string; owner_id: string;
  company_members: { id: string }[];
}
interface ProfilRow { id: string; email: string; }

interface Kullanici {
  id: string; email: string; full_name: string | null;
  system_admin: boolean; created_at: string;
  rol: string | null; sirket_adi: string | null;
}
interface KullaniciRow {
  id: string; email: string; full_name: string | null;
  system_admin: boolean; created_at: string;
}
interface UyeRow {
  user_id: string; email: string; role: string; status: string;
  companies: { name: string } | null;
}

interface AdminProfil { id: string; email: string; full_name: string | null; created_at: string; }

interface SistemBildirim {
  id: string; baslik: string; mesaj: string;
  tip: "kritik" | "duyuru" | "guncelleme";
  hedef: "tumu" | "pilot" | "copilot";
  admin_email: string | null; olusturma: string;
}
interface AdminLog {
  id: string; admin_email: string | null;
  islem: string; detay: Record<string, unknown> | null; olusturma: string;
}

type TabAdi = "sirketler" | "adminler" | "admin-yonetimi" | "bildirim" | "denetim" | "destek";

/* ─── Şirket filtre ─── */
type TarihSecim = "tumu" | "bugun" | "dun" | "hafta" | "ay" | "ozel";

interface SirketFiltre {
  arama:      string;
  plan:       string;
  tarihSecim: TarihSecim;
  tarihBas:   string;
  tarihBit:   string;
  minUye:     string;
  maxUye:     string;
}
type BildirimTip   = "kritik" | "duyuru" | "guncelleme";
type BildirimHedef = "tumu"   | "pilot"  | "copilot";

/* ─── Yardımcı bileşenler ────────────────────────────────────────────────── */

function StatKart({ baslik, deger, alt }: { baslik: string; deger: string | number; alt?: string }) {
  return (
    <div className="rounded-xl p-5 flex flex-col gap-2"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(251,192,36,0.15)" }}>
      <p className="text-xs uppercase tracking-widest" style={{ color: "#64748b" }}>{baslik}</p>
      <p className="text-3xl font-bold" style={{ color: "#fbc024" }}>{deger}</p>
      {alt && <p className="text-xs truncate" style={{ color: "#475569" }}>{alt}</p>}
    </div>
  );
}

function TabButon({ aktif, onClick, children }: { aktif: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className="px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap"
      style={{
        background: aktif ? "rgba(251,192,36,0.15)" : "transparent",
        color:  aktif ? "#fbc024" : "#64748b",
        border: aktif ? "1px solid rgba(251,192,36,0.3)" : "1px solid transparent",
      }}>
      {children}
    </button>
  );
}

function Tablo({ basliklar, children, bos }: { basliklar: string[]; children: React.ReactNode; bos?: boolean }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            {basliklar.map((h) => (
              <th key={h} className="text-left py-3 px-4 text-xs uppercase tracking-wider font-medium" style={{ color: "#475569" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{bos ? (
          <tr><td colSpan={basliklar.length} className="py-8 text-center text-sm" style={{ color: "#475569" }}>Kayıt bulunamadı</td></tr>
        ) : children}</tbody>
      </table>
    </div>
  );
}

function Satir({ children }: { children: React.ReactNode }) {
  return <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>{children}</tr>;
}

function Hucre({ children, renk }: { children: React.ReactNode; renk?: string }) {
  return <td className="py-3 px-4" style={{ color: renk ?? "#94a3b8" }}>{children}</td>;
}

function Chip({ label, renk, bg }: { label: string; renk: string; bg: string }) {
  return (
    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: bg, color: renk }}>{label}</span>
  );
}

/* ─── Şirketler Bileşeni (Dropdown filtreler) ────────────────────────────── */

/* ─── Üye popup tipi ─── */
interface UyeDetay { email: string; role: string; status: string; }

interface SirketleriGosterProps {
  sirketler: Sirket[]; filtreSirketler: Sirket[]; sirketYuk: boolean;
  sirketFiltre: SirketFiltre; setSirketFiltre: React.Dispatch<React.SetStateAction<SirketFiltre>>;
  inputCls: string; inputSt: React.CSSProperties;
}

const TARIH_SECENEKLER: { v: TarihSecim; label: string }[] = [
  { v: "bugun", label: "Bugün" },
  { v: "dun",   label: "Dün" },
  { v: "hafta", label: "Son 1 Hafta" },
  { v: "ay",    label: "Son 1 Ay" },
  { v: "ozel",  label: "Özel Tarih" },
];

function TarihEtiket(secim: TarihSecim): string {
  return TARIH_SECENEKLER.find((s) => s.v === secim)?.label ?? "Tarihe Göre Filtrele";
}

function SirketleriGoster({
  sirketler, filtreSirketler, sirketYuk,
  sirketFiltre, setSirketFiltre,
  inputCls, inputSt,
}: SirketleriGosterProps) {
  const tarihBtnRef = useRef<HTMLButtonElement>(null);
  const uyeBtnRef   = useRef<HTMLButtonElement>(null);
  const tarihMenuRef = useRef<HTMLDivElement>(null);
  const uyeMenuRef   = useRef<HTMLDivElement>(null);
  const popupRef    = useRef<HTMLDivElement>(null);

  const [tarihDropdown, setTarihDropdown] = useState(false);
  const [uyeDropdown,   setUyeDropdown]   = useState(false);
  const [tarihPos, setTarihPos] = useState({ top: 0, left: 0 });
  const [uyePos,   setUyePos]   = useState({ top: 0, left: 0 });

  /* Şirket üye popup state */
  const [popup,      setPopup]      = useState<{ sirket: Sirket; uyeler: UyeDetay[] } | null>(null);
  const [popupYuk,   setPopupYuk]   = useState(false);
  const supabase = createClient();

  /* Fixed position'u butona göre hesapla */
  function tarihAc() {
    if (tarihBtnRef.current) {
      const r = tarihBtnRef.current.getBoundingClientRect();
      setTarihPos({ top: r.bottom + 8, left: r.left });
    }
    setTarihDropdown((v) => !v);
    setUyeDropdown(false);
  }
  function uyeAc() {
    if (uyeBtnRef.current) {
      const r = uyeBtnRef.current.getBoundingClientRect();
      setUyePos({ top: r.bottom + 8, left: r.left });
    }
    setUyeDropdown((v) => !v);
    setTarihDropdown(false);
  }

  /* Click outside kapama */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (tarihDropdown && tarihMenuRef.current && !tarihMenuRef.current.contains(t) && tarihBtnRef.current && !tarihBtnRef.current.contains(t)) setTarihDropdown(false);
      if (uyeDropdown   && uyeMenuRef.current   && !uyeMenuRef.current.contains(t)   && uyeBtnRef.current   && !uyeBtnRef.current.contains(t))   setUyeDropdown(false);
      if (popupRef.current && !popupRef.current.contains(t)) setPopup(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [tarihDropdown, uyeDropdown]);

  /* Şirket adına tıklanınca üyeleri çek */
  async function sirketTikla(s: Sirket) {
    if (popup?.sirket.id === s.id) { setPopup(null); return; }
    setPopupYuk(true);
    setPopup({ sirket: s, uyeler: [] });

    const { data } = await supabase
      .from("company_members")
      .select("email, role, status")
      .eq("company_id", s.id)
      .order("role", { ascending: true });

    setPopupYuk(false);
    if (data) setPopup({ sirket: s, uyeler: data as UyeDetay[] });
  }

  const uyeAktif  = !!(sirketFiltre.minUye || sirketFiltre.maxUye);
  const tarihAktif = sirketFiltre.tarihSecim !== "tumu";
  const uyeEtiket = () => {
    if (!uyeAktif) return "Üye Sayısı";
    if (sirketFiltre.minUye && sirketFiltre.maxUye) return `${sirketFiltre.minUye}–${sirketFiltre.maxUye}`;
    if (sirketFiltre.minUye) return `≥${sirketFiltre.minUye}`;
    return `≤${sirketFiltre.maxUye}`;
  };

  const dropdownSt = (pos: { top: number; left: number }): React.CSSProperties => ({
    position: "fixed", top: pos.top, left: pos.left, zIndex: 9999, minWidth: 220,
    background: "#070d1a", border: "1px solid rgba(251,192,36,0.25)",
    borderRadius: 12, padding: "8px", boxShadow: "0 16px 40px rgba(0,0,0,0.5)",
  });

  const btnSt = (aktif: boolean): React.CSSProperties => ({
    ...inputSt, padding: "8px 12px", borderRadius: 8, whiteSpace: "nowrap",
    display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 500,
    cursor: "pointer",
    color:        aktif ? "#fbc024" : "#64748b",
    borderColor:  aktif ? "rgba(251,192,36,0.4)" : "rgba(255,255,255,0.08)",
    background:   aktif ? "rgba(251,192,36,0.08)" : "rgba(255,255,255,0.05)",
  });

  return (
    <div className="rounded-xl p-6 space-y-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(251,192,36,0.1)" }}>

      {/* ── TEK SATIR filtre ── */}
      <div className="flex gap-2 items-center flex-wrap">

        {/* Arama */}
        <input type="text" placeholder="Ara…"
          value={sirketFiltre.arama}
          onChange={(e) => setSirketFiltre(f => ({ ...f, arama: e.target.value }))}
          className={inputCls}
          style={{ ...inputSt, width: 180, padding: "8px 12px", fontSize: 13 }} />

        {/* Plan */}
        <select value={sirketFiltre.plan}
          onChange={(e) => setSirketFiltre(f => ({ ...f, plan: e.target.value }))}
          className={inputCls}
          style={{ ...inputSt, width: 130, padding: "8px 10px", fontSize: 13,
            color: sirketFiltre.plan !== "tumu" ? "#fbc024" : "#64748b" }}>
          <option value="tumu" className="bg-[#070d1a]">Tüm Planlar</option>
          <option value="free" className="bg-[#070d1a]">Free</option>
          <option value="premium" className="bg-[#070d1a]">Premium</option>
        </select>

        {/* Tarih butonu */}
        <button ref={tarihBtnRef} onClick={tarihAc} style={btnSt(tarihAktif)}>
          {tarihAktif ? TarihEtiket(sirketFiltre.tarihSecim) : "Tarih"}
          {tarihAktif && (
            <span onClick={(e) => { e.stopPropagation(); setSirketFiltre(f => ({ ...f, tarihSecim: "tumu", tarihBas: "", tarihBit: "" })); setTarihDropdown(false); }}
              style={{ color: "#ef4444" }}>×</span>
          )}
        </button>

        {/* Üye sayısı butonu */}
        <button ref={uyeBtnRef} onClick={uyeAc} style={btnSt(uyeAktif)}>
          {uyeEtiket()}
          {uyeAktif && (
            <span onClick={(e) => { e.stopPropagation(); setSirketFiltre(f => ({ ...f, minUye: "", maxUye: "" })); setUyeDropdown(false); }}
              style={{ color: "#ef4444" }}>×</span>
          )}
        </button>

        {/* Sıfırla */}
        {(sirketFiltre.arama || sirketFiltre.plan !== "tumu" || tarihAktif || uyeAktif) && (
          <button onClick={() => setSirketFiltre({ arama: "", plan: "tumu", tarihSecim: "tumu", tarihBas: "", tarihBit: "", minUye: "", maxUye: "" })}
            className="text-xs px-3 py-2 rounded-lg transition-all"
            style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
            Sıfırla
          </button>
        )}
      </div>

      {/* ── Tarih dropdown (position: fixed) ── */}
      {tarihDropdown && (
        <div ref={tarihMenuRef} style={dropdownSt(tarihPos)}>
          {TARIH_SECENEKLER.map(({ v, label }) => (
            <button key={v} onClick={() => { setSirketFiltre(f => ({ ...f, tarihSecim: v })); if (v !== "ozel") setTarihDropdown(false); }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm transition-all"
              style={{ background: sirketFiltre.tarihSecim === v ? "rgba(251,192,36,0.12)" : "transparent",
                color: sirketFiltre.tarihSecim === v ? "#fbc024" : "#94a3b8" }}>
              {label} {sirketFiltre.tarihSecim === v && "✓"}
            </button>
          ))}
          {sirketFiltre.tarihSecim === "ozel" && (
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: 6, paddingTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
              <input type="date" value={sirketFiltre.tarihBas} max={sirketFiltre.tarihBit || undefined}
                onChange={(e) => setSirketFiltre(f => ({ ...f, tarihBas: e.target.value }))}
                className="scheme-dark" style={{ ...inputSt, padding: "6px 10px", fontSize: 12, borderRadius: 8 }} />
              <input type="date" value={sirketFiltre.tarihBit} min={sirketFiltre.tarihBas || undefined}
                onChange={(e) => setSirketFiltre(f => ({ ...f, tarihBit: e.target.value }))}
                className="scheme-dark" style={{ ...inputSt, padding: "6px 10px", fontSize: 12, borderRadius: 8 }} />
              <button onClick={() => setTarihDropdown(false)} className="text-xs py-1.5 rounded-lg font-semibold"
                style={{ background: "#fbc024", color: "#070d1a" }}>Uygula</button>
            </div>
          )}
        </div>
      )}

      {/* ── Üye dropdown (position: fixed) ── */}
      {uyeDropdown && (
        <div ref={uyeMenuRef} style={dropdownSt(uyePos)}>
          <p className="text-xs px-3 pb-2 pt-1" style={{ color: "#64748b" }}>Üye sayısı aralığı</p>
          <div style={{ display: "flex", gap: 6, padding: "0 6px 8px" }}>
            <input type="number" placeholder="Min" min={0} value={sirketFiltre.minUye}
              onChange={(e) => setSirketFiltre(f => ({ ...f, minUye: e.target.value }))}
              style={{ ...inputSt, flex: 1, padding: "6px 8px", fontSize: 12, borderRadius: 8 }} />
            <span style={{ color: "#475569", alignSelf: "center" }}>—</span>
            <input type="number" placeholder="Max" min={0} value={sirketFiltre.maxUye}
              onChange={(e) => setSirketFiltre(f => ({ ...f, maxUye: e.target.value }))}
              style={{ ...inputSt, flex: 1, padding: "6px 8px", fontSize: 12, borderRadius: 8 }} />
          </div>
          {[{ label: "1–3", min: "1", max: "3" }, { label: "4–10", min: "4", max: "10" }, { label: "10+", min: "10", max: "" }].map(({ label, min, max }) => (
            <button key={label} onClick={() => { setSirketFiltre(f => ({ ...f, minUye: min, maxUye: max })); setUyeDropdown(false); }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm"
              style={{ color: "#94a3b8" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(251,192,36,0.08)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
              {label} üye
            </button>
          ))}
          <button onClick={() => { setSirketFiltre(f => ({ ...f, minUye: "", maxUye: "" })); setUyeDropdown(false); }}
            className="w-full text-left px-3 py-2 rounded-lg text-xs mt-1"
            style={{ color: "#ef4444", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            Temizle
          </button>
        </div>
      )}

      <p className="text-xs" style={{ color: "#475569" }}>{filtreSirketler.length} / {sirketler.length} şirket</p>

      {/* ── Tablo ── */}
      {sirketYuk ? (
        <p className="text-sm py-8 text-center" style={{ color: "#475569" }}>Yükleniyor…</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {["Şirket Adı", "Sahip E-Posta", "Üye", "Plan", "Kayıt Tarihi"].map((h) => (
                  <th key={h} className="text-left py-3 px-4 text-xs uppercase tracking-wider font-medium"
                    style={{ color: "#475569" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtreSirketler.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-sm" style={{ color: "#475569" }}>Kayıt bulunamadı</td></tr>
              ) : filtreSirketler.map((s) => (
                <tr key={s.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                  {/* Şirket adı — tıklanabilir */}
                  <td className="py-3 px-4" style={{ position: "relative" }}>
                    <button onClick={() => sirketTikla(s)}
                      className="font-semibold text-left transition-all"
                      style={{ color: popup?.sirket.id === s.id ? "#fbc024" : "#ffffff",
                        textDecoration: "underline", textDecorationStyle: "dashed",
                        textDecorationColor: "rgba(251,192,36,0.4)", cursor: "pointer" }}>
                      {s.name}
                    </button>

                    {/* ── Üye popup ── */}
                    {popup?.sirket.id === s.id && (
                      <div ref={popupRef} style={{
                        position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 60,
                        minWidth: 300, maxWidth: 380,
                        background: "#070d1a", border: "1px solid rgba(251,192,36,0.3)",
                        borderRadius: 14, padding: 0, boxShadow: "0 20px 50px rgba(0,0,0,0.7)",
                        overflow: "hidden",
                      }}>
                        {/* Başlık */}
                        <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)",
                          background: "rgba(251,192,36,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <p style={{ color: "#fbc024", fontWeight: 700, fontSize: 13 }}>{s.name}</p>
                            <p style={{ color: "#475569", fontSize: 11, marginTop: 2 }}>Kayıtlı çalışanlar</p>
                          </div>
                          <button onClick={() => setPopup(null)}
                            style={{ color: "#475569", fontSize: 18, lineHeight: 1, cursor: "pointer" }}>×</button>
                        </div>

                        {/* İçerik */}
                        <div style={{ maxHeight: 280, overflowY: "auto", padding: "8px" }}>
                          {popupYuk ? (
                            <p style={{ color: "#475569", textAlign: "center", padding: "20px", fontSize: 13 }}>Yükleniyor…</p>
                          ) : popup.uyeler.length === 0 ? (
                            <p style={{ color: "#475569", textAlign: "center", padding: "20px", fontSize: 13 }}>Kayıtlı üye yok</p>
                          ) : popup.uyeler.map((u, i) => (
                            <div key={i} style={{
                              display: "flex", alignItems: "center", justifyContent: "space-between",
                              padding: "8px 10px", borderRadius: 8, marginBottom: 4,
                              background: "rgba(255,255,255,0.03)",
                            }}>
                              <div>
                                <p style={{ color: "#fbc024", fontSize: 12, fontFamily: "monospace" }}>{u.email}</p>
                                <p style={{ color: "#475569", fontSize: 10, marginTop: 2 }}>
                                  {u.status === "active" ? "Aktif" : "Pasif"}
                                </p>
                              </div>
                              <span style={{
                                fontSize: 10, padding: "2px 8px", borderRadius: 999,
                                background: u.role === "pilot" ? "rgba(34,197,94,0.15)" : "rgba(148,163,184,0.15)",
                                color:      u.role === "pilot" ? "#22c55e"              : "#94a3b8",
                                fontWeight: 600,
                              }}>
                                {u.role === "pilot" ? "Pilot" : "Co-Pilot"}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div style={{ padding: "8px 16px 12px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                          <p style={{ color: "#334155", fontSize: 10 }}>
                            {popup.uyeler.length} çalışan · {s.owner_email}
                          </p>
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono text-xs"
                    style={{ color: s.owner_email === "—" ? "#475569" : "#fbc024" }}>{s.owner_email}</td>
                  <Hucre>{s.uye_sayisi}</Hucre>
                  <Hucre>
                    <Chip label={s.plan} renk={s.plan === "free" ? "#64748b" : "#fbc024"}
                      bg={s.plan === "free" ? "rgba(100,116,139,0.15)" : "rgba(251,192,36,0.15)"} />
                  </Hucre>
                  <Hucre renk="#64748b">{new Date(s.created_at).toLocaleDateString("tr-TR")}</Hucre>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ─── Ana Bileşen ────────────────────────────────────────────────────────── */

export default function AdminPage() {
  const supabase = createClient();

  const [adminEmail, setAdminEmail] = useState("");
  const [adminId,    setAdminId]    = useState("");

  const [toplamSirket,    setToplamSirket]    = useState(0);
  const [toplamKullanici, setToplamKullanici] = useState(0);
  const [bugunBildirim,   setBugunBildirim]   = useState(0);
  const [sonIslem,        setSonIslem]        = useState("—");

  const [aktifTab, setAktifTab] = useState<TabAdi>("sirketler");

  // Şirketler
  const [sirketler, setSirketler] = useState<Sirket[]>([]);
  const [sirketYuk, setSirketYuk] = useState(false);
  const [sirketFiltre, setSirketFiltre] = useState<SirketFiltre>({
    arama: "", plan: "tumu", tarihSecim: "tumu", tarihBas: "", tarihBit: "", minUye: "", maxUye: "",
  });
  // Kullanıcılar (Adminler sekmesi için)
  const [kullanicilar, setKullanicilar] = useState<Kullanici[]>([]);

  // Admin yönetimi
  const [adminler,      setAdminler]      = useState<AdminProfil[]>([]);
  const [yeniAdminMail, setYeniAdminMail] = useState("");
  const [adminIslem,    setAdminIslem]    = useState<"bos" | "yukleniyor" | "basari" | "hata">("bos");
  const [adminMesaj,    setAdminMesaj]    = useState("");

  // Bildirim
  const [bildBaslik,    setBildBaslik]    = useState("");
  const [bildMesaj,     setBildMesaj]     = useState("");
  const [bildTip,       setBildTip]       = useState<BildirimTip>("duyuru");
  const [bildHedef,     setBildHedef]     = useState<BildirimHedef>("tumu");
  const [bildirimYuk,   setBildirimYuk]   = useState(false);
  const [sonBildirimler, setSonBildirimler] = useState<SistemBildirim[]>([]);

  // Denetim
  const [adminLogs,  setAdminLogs]  = useState<AdminLog[]>([]);
  const [logYuk,     setLogYuk]     = useState(false);

  /* ─── Veri çekme ──────────────────────────────────────────────────────── */

  const istatistikCek = useCallback(async () => {
    const [s, u, b, l] = await Promise.all([
      supabase.from("companies").select("id", { count: "exact", head: true }),
      supabase.from("company_members").select("id", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("system_notifications").select("id", { count: "exact", head: true }).gte("olusturma", new Date().toISOString().slice(0, 10)),
      supabase.from("admin_logs").select("olusturma").order("olusturma", { ascending: false }).limit(1),
    ]);
    if (!s.error) setToplamSirket(s.count ?? 0);
    if (!u.error) setToplamKullanici(u.count ?? 0);
    if (!b.error) setBugunBildirim(b.count ?? 0);
    if (!l.error && l.data?.[0]) setSonIslem(new Date(l.data[0].olusturma as string).toLocaleString("tr-TR"));
  }, [supabase]);

  const sirketleriCek = useCallback(async () => {
    setSirketYuk(true);

    const { data: sirketRes } = await supabase
      .from("companies")
      .select("id, name, plan, created_at, owner_id, company_members(id)")
      .order("created_at", { ascending: false });

    if (!sirketRes) { setSirketYuk(false); return; }

    // Tüm owner_id'leri topla
    const ownerIds = [...new Set((sirketRes as unknown as SirketRow[]).map((s) => s.owner_id))];

    // 1. Profiles tablosundan çek
    const { data: profilRes } = await supabase.from("profiles").select("id, email");
    const profilMap = new Map<string, string>();
    (profilRes ?? []).forEach((p: ProfilRow) => { if (p.email) profilMap.set(p.id, p.email); });

    // 2. profiles'ta emaili olmayan owner'lar için auth.users'dan çek (RPC)
    const eksikOwnerIds = ownerIds.filter((id) => !profilMap.get(id));
    if (eksikOwnerIds.length > 0) {
      const { data: authRes } = await supabase.rpc("get_auth_user_emails", { user_ids: eksikOwnerIds });
      if (authRes) {
        (authRes as { id: string; email: string }[]).forEach(({ id, email }) => {
          if (email) profilMap.set(id, email);
        });
      }
    }

    const mapped: Sirket[] = (sirketRes as unknown as SirketRow[]).map((s) => ({
      id:          s.id,
      name:        s.name,
      owner_email: profilMap.get(s.owner_id) ?? "—",
      uye_sayisi:  Array.isArray(s.company_members) ? s.company_members.length : 0,
      plan:        s.plan,
      created_at:  s.created_at,
    }));
    setSirketler(mapped);
    setSirketYuk(false);
  }, [supabase]);

  const kullanicilariCek = useCallback(async () => {
    const [profilRes, uyeRes] = await Promise.all([
      supabase.from("profiles").select("id, email, full_name, system_admin, created_at").order("created_at", { ascending: false }),
      supabase.from("company_members").select("user_id, email, role, status, companies(name)"),
    ]);
    if (!profilRes.data) return;
    const uyeMap = new Map<string, UyeRow>();
    (uyeRes.data ?? []).forEach((u) => { const r = u as unknown as UyeRow; uyeMap.set(r.user_id, r); });
    setKullanicilar((profilRes.data as KullaniciRow[]).map((p) => {
      const uye = uyeMap.get(p.id);
      return {
        id: p.id, email: p.email, full_name: p.full_name,
        system_admin: p.system_admin, created_at: p.created_at,
        rol:       uye?.role ?? null,
        sirket_adi: (uye?.companies as { name: string } | null)?.name ?? null,
      };
    }));
  }, [supabase]);

  const adminleriCek = useCallback(async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, email, full_name, created_at")
      .eq("system_admin", true)
      .order("created_at", { ascending: true });
    if (data) setAdminler(data as AdminProfil[]);
  }, [supabase]);

  const sonBildirimleriCek = useCallback(async () => {
    const { data } = await supabase.from("system_notifications").select("*").order("olusturma", { ascending: false }).limit(10);
    if (data) setSonBildirimler(data as SistemBildirim[]);
  }, [supabase]);

  const loglarıCek = useCallback(async () => {
    setLogYuk(true);
    const { data } = await supabase.from("admin_logs").select("*").order("olusturma", { ascending: false }).limit(50);
    if (data) setAdminLogs(data as AdminLog[]);
    setLogYuk(false);
  }, [supabase]);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) { setAdminEmail(user.email ?? ""); setAdminId(user.id); }
      await Promise.all([istatistikCek(), sirketleriCek(), kullanicilariCek(), adminleriCek(), sonBildirimleriCek(), loglarıCek()]);
    }
    init();
  }, [istatistikCek, sirketleriCek, kullanicilariCek, adminleriCek, sonBildirimleriCek, loglarıCek, supabase]);

  /* ─── Admin ekleme / kaldırma ─────────────────────────────────────────── */

  async function adminEkle(e: React.FormEvent) {
    e.preventDefault();
    if (!yeniAdminMail.trim()) return;
    setAdminIslem("yukleniyor"); setAdminMesaj("");

    const { data, error } = await supabase.rpc("set_system_admin", {
      hedef_email: yeniAdminMail.trim().toLowerCase(),
      admin_deger: true,
    });

    if (error) {
      setAdminIslem("hata");
      setAdminMesaj(error.message.includes("bulunamadı") ? "Bu e-posta adresiyle kayıtlı kullanıcı bulunamadı." : error.message);
    } else {
      setAdminIslem("basari");
      setAdminMesaj(`${(data as { email: string }).email} artık admin.`);
      setYeniAdminMail("");

      await supabase.from("admin_logs").insert({
        admin_id: adminId, admin_email: adminEmail,
        islem: "admin_eklendi",
        detay: { hedef_email: yeniAdminMail.trim().toLowerCase() },
      });
      await Promise.all([adminleriCek(), kullanicilariCek(), istatistikCek()]);
    }
    setTimeout(() => setAdminIslem("bos"), 4000);
  }

  async function adminKaldir(hedefEmail: string) {
    if (!confirm(`${hedefEmail} adresinin admin yetkisini kaldırmak istediğinizden emin misiniz?`)) return;

    const { error } = await supabase.rpc("set_system_admin", { hedef_email: hedefEmail, admin_deger: false });
    if (!error) {
      await supabase.from("admin_logs").insert({
        admin_id: adminId, admin_email: adminEmail,
        islem: "admin_kaldirildi",
        detay: { hedef_email: hedefEmail },
      });
      await Promise.all([adminleriCek(), kullanicilariCek(), istatistikCek()]);
    }
  }

  /* ─── Bildirim gönderme ───────────────────────────────────────────────── */

  async function bildirimGonder(e: React.FormEvent) {
    e.preventDefault();
    if (!bildBaslik.trim() || !bildMesaj.trim()) return;
    setBildirimYuk(true);

    const { error: be } = await supabase.from("system_notifications").insert({
      baslik: bildBaslik.trim(), mesaj: bildMesaj.trim(),
      tip: bildTip, hedef: bildHedef, admin_email: adminEmail,
    });
    if (!be) {
      await supabase.from("admin_logs").insert({
        admin_id: adminId, admin_email: adminEmail,
        islem: "sistem_bildirimi_gonderildi",
        detay: { baslik: bildBaslik.trim(), tip: bildTip, hedef: bildHedef },
      });
      setBildBaslik(""); setBildMesaj(""); setBildTip("duyuru"); setBildHedef("tumu");
      await Promise.all([sonBildirimleriCek(), istatistikCek(), loglarıCek()]);
    }
    setBildirimYuk(false);
  }

  /* ─── Hesaplamalar ────────────────────────────────────────────────────── */

  const tipRenk    = (t: string) => t === "kritik" ? "#ef4444" : t === "duyuru" ? "#fbc024" : "#22c55e";
  const tipEtiket  = (t: string) => t === "kritik" ? "Kritik"  : t === "duyuru" ? "Duyuru"  : "Güncelleme";
  const hedefEtiket = (h: string) => h === "tumu"  ? "Tümü"    : h === "pilot"  ? "Pilotlar" : "Co-Pilotlar";

  /* ─── Tarih aralığı hesapla ─── */
  const tarihAraligi = (() => {
    const simdi = new Date();
    const gun = (d: Date) => { d.setHours(0, 0, 0, 0); return d; };
    const bit  = (d: Date) => { d.setHours(23, 59, 59, 999); return d; };
    switch (sirketFiltre.tarihSecim) {
      case "bugun": { const b = gun(new Date(simdi)); return { bas: b, bit: bit(new Date(simdi)) }; }
      case "dun":   { const d = new Date(simdi); d.setDate(d.getDate()-1); return { bas: gun(new Date(d)), bit: bit(new Date(d)) }; }
      case "hafta": { const d = new Date(simdi); d.setDate(d.getDate()-7); return { bas: gun(d), bit: bit(new Date(simdi)) }; }
      case "ay":    { const d = new Date(simdi); d.setDate(d.getDate()-30); return { bas: gun(d), bit: bit(new Date(simdi)) }; }
      case "ozel":  { return { bas: sirketFiltre.tarihBas ? gun(new Date(sirketFiltre.tarihBas)) : null, bit: sirketFiltre.tarihBit ? bit(new Date(sirketFiltre.tarihBit)) : null }; }
      default:      return { bas: null, bit: null };
    }
  })();

  /* ─── Şirket filtreleme ─── */
  const filtreSirketler = sirketler.filter((s) => {
    const { arama, plan, minUye, maxUye } = sirketFiltre;
    if (arama && !s.name.toLowerCase().includes(arama.toLowerCase()) &&
        !s.owner_email.toLowerCase().includes(arama.toLowerCase())) return false;
    if (plan !== "tumu" && s.plan !== plan) return false;
    const t = new Date(s.created_at);
    if (tarihAraligi.bas && t < tarihAraligi.bas) return false;
    if (tarihAraligi.bit && t > tarihAraligi.bit) return false;
    if (minUye && s.uye_sayisi < Number(minUye)) return false;
    if (maxUye && s.uye_sayisi > Number(maxUye)) return false;
    return true;
  });

  /* ─── Adminler sekmesi (system_admin=true, gizli hesaplar hariç) ─── */
  const GIZLI = ["raspool73@gmail.com"];
  const filtreAdminler = kullanicilar.filter((k) => k.system_admin && !GIZLI.includes(k.email));

  /* ─── Sadece destek@pilotsensin.com admin atayabilir ─── */
  const superAdmin = adminEmail === "destek@pilotsensin.com";

  /* ─── Render ──────────────────────────────────────────────────────────── */

  const inputCls = "w-full px-4 py-2.5 rounded-lg text-sm outline-none";
  const inputSt  = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#ffffff" };

  return (
    <div className="min-h-screen p-6 lg:p-10" style={{ background: "#070d1a" }}>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl shrink-0"
            style={{ background: "rgba(251,192,36,0.12)", border: "1px solid rgba(251,192,36,0.3)" }}>🛡️</div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "#fbc024" }}>Komuta Merkezi</h1>
            <p className="text-xs" style={{ color: "#475569" }}>PilotSensin Admin</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs px-3 py-1.5 rounded-full font-mono"
            style={{ background: "rgba(251,192,36,0.1)", color: "#fbc024", border: "1px solid rgba(251,192,36,0.2)" }}>
            {adminEmail}
          </span>
          <Link href="/dashboard" className="text-sm px-4 py-1.5 rounded-lg transition-all"
            style={{ background: "rgba(255,255,255,0.05)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.08)" }}>
            ← Uygulamaya Dön
          </Link>
        </div>
      </div>

      {/* İstatistikler */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatKart baslik="Toplam Şirket"    deger={toplamSirket} />
        <StatKart baslik="Aktif Kullanıcı"  deger={toplamKullanici} alt="Aktif üyeler" />
        <StatKart baslik="Toplam Admin"     deger={adminler.length} alt="system_admin" />
        <StatKart baslik="Bugün Bildirim"   deger={bugunBildirim} alt={sonIslem !== "—" ? `Son: ${sonIslem}` : undefined} />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap border-b pb-4" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <TabButon aktif={aktifTab === "sirketler"}     onClick={() => setAktifTab("sirketler")}>Şirketler ({sirketler.length})</TabButon>
        <TabButon aktif={aktifTab === "adminler"}      onClick={() => setAktifTab("adminler")}>Adminler ({filtreAdminler.length})</TabButon>
        {superAdmin && (
          <TabButon aktif={aktifTab === "admin-yonetimi"} onClick={() => setAktifTab("admin-yonetimi")}>Admin Yönetimi</TabButon>
        )}
        <TabButon aktif={aktifTab === "bildirim"}      onClick={() => setAktifTab("bildirim")}>Bildirim Gönder</TabButon>
        <TabButon aktif={aktifTab === "denetim"}       onClick={() => setAktifTab("denetim")}>Denetim Kaydı</TabButon>
        <TabButon aktif={aktifTab === "destek"}        onClick={() => setAktifTab("destek")}>Destek</TabButon>
      </div>

      {/* ── Şirketler ── */}
      {aktifTab === "sirketler" && (
        <SirketleriGoster
          sirketler={sirketler}
          filtreSirketler={filtreSirketler}
          sirketYuk={sirketYuk}
          sirketFiltre={sirketFiltre}
          setSirketFiltre={setSirketFiltre}
          inputCls={inputCls}
          inputSt={inputSt}
        />
      )}

      {/* ── Adminler (system_admin=true kullanıcılar) ── */}
      {aktifTab === "adminler" && (
        <div className="rounded-xl p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(251,192,36,0.1)" }}>
          <p className="text-xs mb-4" style={{ color: "#475569" }}>
            Sisteme admin yetkisi verilmiş hesaplar. Yönetmek için "Admin Yönetimi" sekmesini kullan.
          </p>
          <Tablo basliklar={["E-posta", "Ad Soyad", "Şirket", "Rol", "Kayıt"]} bos={filtreAdminler.length === 0}>
            {filtreAdminler.map((k) => (
              <Satir key={k.id}>
                <td className="py-3 px-4 font-mono text-xs" style={{ color: "#fbc024" }}>{k.email}</td>
                <Hucre renk="#ffffff">{k.full_name ?? "—"}</Hucre>
                <Hucre>{k.sirket_adi ?? "—"}</Hucre>
                <Hucre>
                  {k.rol ? (
                    <Chip label={k.rol === "pilot" ? "Pilot" : "Co-Pilot"}
                      renk={k.rol === "pilot" ? "#22c55e" : "#94a3b8"}
                      bg={k.rol === "pilot" ? "rgba(34,197,94,0.15)" : "rgba(148,163,184,0.15)"} />
                  ) : "—"}
                </Hucre>
                <Hucre renk="#64748b">{new Date(k.created_at).toLocaleDateString("tr-TR")}</Hucre>
              </Satir>
            ))}
          </Tablo>
        </div>
      )}

      {/* ── Admin Yönetimi (sadece superAdmin) ── */}
      {aktifTab === "admin-yonetimi" && (
        <div className="grid lg:grid-cols-2 gap-6">

          {/* Yeni Admin Ekle */}
          <div className="rounded-xl p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(251,192,36,0.1)" }}>
            <h2 className="text-base font-semibold mb-1" style={{ color: "#fbc024" }}>Yeni Admin Ekle</h2>
            <p className="text-xs mb-5" style={{ color: "#475569" }}>
              Sisteme kayıtlı bir kullanıcıya admin yetkisi ver. Kullanıcının önce uygulamaya kayıt olmuş olması gerekir.
            </p>
            <form onSubmit={adminEkle} className="flex flex-col gap-4">
              <div>
                <label className="text-xs mb-1.5 block" style={{ color: "#64748b" }}>E-posta Adresi</label>
                <input type="email" required value={yeniAdminMail}
                  onChange={(e) => setYeniAdminMail(e.target.value)}
                  placeholder="yeni.admin@ornek.com"
                  className={inputCls} style={inputSt} />
              </div>
              <button type="submit" disabled={adminIslem === "yukleniyor" || !yeniAdminMail.trim()}
                className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-40"
                style={{ background: "#fbc024", color: "#070d1a" }}>
                {adminIslem === "yukleniyor" ? "İşleniyor…" : "Admin Yetkisi Ver"}
              </button>
            </form>
            {adminIslem === "basari" && (
              <p className="mt-3 text-sm" style={{ color: "#22c55e" }}>✅ {adminMesaj}</p>
            )}
            {adminIslem === "hata" && (
              <p className="mt-3 text-sm" style={{ color: "#ef4444" }}>❌ {adminMesaj}</p>
            )}
          </div>

          {/* Mevcut Adminler */}
          <div className="rounded-xl p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(251,192,36,0.1)" }}>
            <h2 className="text-base font-semibold mb-5" style={{ color: "#fbc024" }}>Mevcut Adminler ({adminler.length})</h2>
            <div className="flex flex-col gap-3">
              {adminler.length === 0 ? (
                <p className="text-sm" style={{ color: "#475569" }}>Admin bulunamadı.</p>
              ) : adminler.map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-3 p-3 rounded-lg"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(251,192,36,0.12)" }}>
                  <div className="min-w-0">
                    <p className="text-sm font-mono truncate" style={{ color: "#fbc024" }}>{a.email}</p>
                    {a.full_name && <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>{a.full_name}</p>}
                  </div>
                  {a.email !== adminEmail && (
                    <button onClick={() => adminKaldir(a.email)}
                      className="text-xs px-3 py-1.5 rounded-lg shrink-0 transition-all"
                      style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
                      Yetkiyi Kaldır
                    </button>
                  )}
                  {a.email === adminEmail && (
                    <span className="text-xs px-2 py-1 rounded-lg shrink-0" style={{ background: "rgba(251,192,36,0.1)", color: "#fbc024" }}>Sen</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Bildirim Gönder ── */}
      {aktifTab === "bildirim" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-xl p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(251,192,36,0.1)" }}>
            <h2 className="text-base font-semibold mb-5" style={{ color: "#fbc024" }}>Yeni Sistem Bildirimi</h2>
            <form onSubmit={bildirimGonder} className="flex flex-col gap-4">
              <div>
                <label className="text-xs mb-1.5 block" style={{ color: "#64748b" }}>Başlık</label>
                <input type="text" value={bildBaslik} onChange={(e) => setBildBaslik(e.target.value)}
                  required placeholder="Bildirim başlığı…" className={inputCls} style={inputSt} />
              </div>
              <div>
                <label className="text-xs mb-1.5 block" style={{ color: "#64748b" }}>Mesaj</label>
                <textarea value={bildMesaj} onChange={(e) => setBildMesaj(e.target.value)}
                  required rows={4} placeholder="Bildirim içeriği…"
                  className={`${inputCls} resize-none`} style={inputSt} />
              </div>
              <div>
                <label className="text-xs mb-2 block" style={{ color: "#64748b" }}>Tip</label>
                <div className="flex gap-2 flex-wrap">
                  {(["kritik", "duyuru", "guncelleme"] as BildirimTip[]).map((t) => (
                    <button key={t} type="button" onClick={() => setBildTip(t)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={{
                        background: bildTip === t ? `${tipRenk(t)}22` : "rgba(255,255,255,0.04)",
                        color:  bildTip === t ? tipRenk(t) : "#64748b",
                        border: bildTip === t ? `1px solid ${tipRenk(t)}44` : "1px solid rgba(255,255,255,0.06)",
                      }}>
                      {tipEtiket(t)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs mb-2 block" style={{ color: "#64748b" }}>Hedef Kitle</label>
                <div className="flex gap-2 flex-wrap">
                  {(["tumu", "pilot", "copilot"] as BildirimHedef[]).map((h) => (
                    <button key={h} type="button" onClick={() => setBildHedef(h)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={{
                        background: bildHedef === h ? "rgba(251,192,36,0.15)" : "rgba(255,255,255,0.04)",
                        color:  bildHedef === h ? "#fbc024" : "#64748b",
                        border: bildHedef === h ? "1px solid rgba(251,192,36,0.3)" : "1px solid rgba(255,255,255,0.06)",
                      }}>
                      {hedefEtiket(h)}
                    </button>
                  ))}
                </div>
              </div>
              <button type="submit" disabled={bildirimYuk || !bildBaslik.trim() || !bildMesaj.trim()}
                className="mt-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-40"
                style={{ background: "#fbc024", color: "#070d1a" }}>
                {bildirimYuk ? "Gönderiliyor…" : "Bildirimi Gönder"}
              </button>
            </form>
          </div>

          <div className="rounded-xl p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(251,192,36,0.1)" }}>
            <h2 className="text-base font-semibold mb-5" style={{ color: "#fbc024" }}>Son Gönderilen Bildirimler</h2>
            <div className="flex flex-col gap-3 max-h-[480px] overflow-y-auto">
              {sonBildirimler.length === 0 ? (
                <p className="text-sm py-8 text-center" style={{ color: "#475569" }}>Henüz bildirim gönderilmedi</p>
              ) : sonBildirimler.map((b) => (
                <div key={b.id} className="rounded-lg p-4"
                  style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${tipRenk(b.tip)}22` }}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-sm font-medium text-white">{b.baslik}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full shrink-0"
                      style={{ background: `${tipRenk(b.tip)}22`, color: tipRenk(b.tip) }}>{tipEtiket(b.tip)}</span>
                  </div>
                  <p className="text-xs mb-2 leading-relaxed" style={{ color: "#94a3b8" }}>{b.mesaj}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: "#475569" }}>{hedefEtiket(b.hedef)}</span>
                    <span className="text-xs" style={{ color: "#475569" }}>{new Date(b.olusturma).toLocaleString("tr-TR")}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Denetim Kaydı ── */}
      {aktifTab === "denetim" && (
        <div className="rounded-xl p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(251,192,36,0.1)" }}>
          {logYuk ? (
            <p className="text-sm py-8 text-center" style={{ color: "#475569" }}>Yükleniyor…</p>
          ) : (
            <Tablo basliklar={["Tarih", "Admin", "İşlem", "Detay"]} bos={adminLogs.length === 0}>
              {adminLogs.map((log) => (
                <Satir key={log.id}>
                  <td className="py-3 px-4 text-xs font-mono whitespace-nowrap" style={{ color: "#64748b" }}>
                    {new Date(log.olusturma).toLocaleString("tr-TR")}
                  </td>
                  <Hucre>{log.admin_email ?? "—"}</Hucre>
                  <Hucre>
                    <span className="text-xs px-2 py-0.5 rounded font-mono"
                      style={{ background: "rgba(251,192,36,0.1)", color: "#fbc024" }}>{log.islem}</span>
                  </Hucre>
                  <Hucre>
                    {log.detay ? (
                      <pre className="text-xs rounded p-2 max-w-xs overflow-x-auto"
                        style={{ background: "rgba(0,0,0,0.3)", color: "#94a3b8", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                        {JSON.stringify(log.detay, null, 2)}
                      </pre>
                    ) : "—"}
                  </Hucre>
                </Satir>
              ))}
            </Tablo>
          )}
        </div>
      )}

      {/* ── Destek ── */}
      {aktifTab === "destek" && <DestekTab />}
    </div>
  );
}

import DestekTab from "@/components/admin/DestekTab";
