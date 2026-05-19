"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Send, Paperclip, X, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import {
  DURUM_ETIKETLERI, DURUM_RENKLERI, KATEGORI_ETIKETLERI, ONCELIK_ETIKETLERI,
  type DestekTalep, type DestekMesaj, type DestekDurum, type DestekKategori, type DestekOncelik, type DestekEk,
  taleptenRow, mesajdanRow,
} from "@/lib/destek-data";

function zaman(iso: string) {
  const fark = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (fark < 1)    return "Az önce";
  if (fark < 60)   return `${fark}dk önce`;
  if (fark < 1440) return `${Math.floor(fark / 60)}sa önce`;
  return `${Math.floor(fark / 1440)}g önce`;
}

export default function AdminDestekDetayPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();

  const [talep,       setTalep]       = useState<DestekTalep | null>(null);
  const [mesajlar,    setMesajlar]    = useState<DestekMesaj[]>([]);
  const [cevap,       setCevap]       = useState("");
  const [icNot,       setIcNot]       = useState(false);
  const [gonderiyor,  setGonderiyor]  = useState(false);
  const [dosyalar,    setDosyalar]    = useState<File[]>([]);
  const [adminAd,     setAdminAd]     = useState<string | null>(null);
  const [adminId,     setAdminId]     = useState<string | null>(null);
  const altRef   = useRef<HTMLDivElement>(null);
  const dosyaRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const sb = createClient();
      const { data: { user } } = await sb.auth.getUser();
      if (user) {
        setAdminId(user.id);
        const { data: p } = await sb.from("profiles").select("full_name").eq("id", user.id).single();
        setAdminAd((p?.full_name as string | null) ?? user.email ?? "Admin");
      }

      const [{ data: t }, { data: m }] = await Promise.all([
        sb.from("destek_talepleri").select("*").eq("id", id).single(),
        sb.from("destek_mesajlari").select("*").eq("talep_id", id).order("olusturma"),
      ]);
      if (t) setTalep(taleptenRow(t as Record<string, unknown>));
      setMesajlar((m ?? []).map(r => mesajdanRow(r as Record<string, unknown>)));

      // Admin okundu işaretle
      await sb.from("destek_talepleri").update({ admin_okundu: true }).eq("id", id);
      await sb.from("destek_mesajlari").update({ okundu: true }).eq("talep_id", id).eq("gonderen_tip", "kullanici");
    })();
  }, [id]);

  // Realtime
  useEffect(() => {
    const sb = createClient();
    const kanal = sb.channel(`admin-destek-${id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "destek_mesajlari", filter: `talep_id=eq.${id}` },
        p => setMesajlar(prev => [...prev, mesajdanRow(p.new as Record<string, unknown>)]))
      .subscribe();
    return () => { sb.removeChannel(kanal); };
  }, [id]);

  useEffect(() => {
    altRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mesajlar.length]);

  const handleGonder = async () => {
    if (!cevap.trim() && dosyalar.length === 0) return;
    setGonderiyor(true);
    try {
      const sb = createClient();
      const ekler: DestekEk[] = [];
      for (const d of dosyalar) {
        const yol = `${adminId}/${Date.now()}-${d.name}`;
        const { data: y } = await sb.storage.from("destek-ekleri").upload(yol, d);
        if (y) {
          const { data: u } = sb.storage.from("destek-ekleri").getPublicUrl(y.path);
          ekler.push({ ad: d.name, url: u.publicUrl, boyut: d.size, tip: d.type });
        }
      }

      const { data: yeniMesaj } = await sb.from("destek_mesajlari")
        .insert({
          talep_id:     id,
          gonderen_tip: "admin",
          gonderen_id:  adminId,
          gonderen_ad:  adminAd,
          mesaj:        cevap.trim(),
          ekler,
          ic_not: icNot,
        })
        .select()
        .single();

      if (yeniMesaj) {
        await sb.from("destek_talepleri").update({
          son_mesaj_tarihi:  new Date().toISOString(),
          kullanici_okundu:  false,
          guncellenme:       new Date().toISOString(),
        }).eq("id", id);

        if (!icNot) {
          await fetch("/api/destek/cevap", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ talepId: id, mesajId: yeniMesaj.id }),
          }).catch(() => {});
        }
      }
      setCevap(""); setDosyalar([]); setIcNot(false);
    } finally {
      setGonderiyor(false);
    }
  };

  const handleDurumGuncelle = async (yeniDurum: DestekDurum) => {
    const sb = createClient();
    if (!talep) return;
    const eskiDurum = talep.durum;
    await sb.from("destek_talepleri").update({ durum: yeniDurum, guncellenme: new Date().toISOString() }).eq("id", id);
    await sb.from("destek_mesajlari").insert({
      talep_id: id, gonderen_tip: "sistem",
      mesaj: `Talep durumu "${DURUM_ETIKETLERI[eskiDurum]}" → "${DURUM_ETIKETLERI[yeniDurum]}" olarak değiştirildi.`,
    });
    await fetch("/api/destek/durum", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ talepId: id, yeniDurum }),
    }).catch(() => {});
    setTalep(t => t ? { ...t, durum: yeniDurum } : t);
  };

  if (!talep) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-gray-200 border-t-[var(--leaf)] rounded-full animate-spin" />
    </div>
  );

  const durumRenk = DURUM_RENKLERI[talep.durum];
  const aktifMi   = ["acik", "inceleme", "cevap-bekliyor"].includes(talep.durum);

  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 pb-24">

      {/* Sol — Thread */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">{talep.konu}</p>
            <p className="text-xs text-gray-500">#{id.slice(0, 8)} · {KATEGORI_ETIKETLERI[talep.kategori]}</p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full shrink-0"
            style={{ color: durumRenk, backgroundColor: durumRenk + "20" }}>
            {DURUM_ETIKETLERI[talep.durum]}
          </span>
        </div>

        {/* Thread */}
        <div className="card rounded-2xl overflow-hidden">
          <div className="divide-y divide-gray-100 min-h-[200px]">
            {mesajlar.map(m => {
              const adminMi  = m.gonderenTip === "admin";
              const sistemMi = m.gonderenTip === "sistem";
              if (sistemMi) return (
                <div key={m.id} className="px-4 py-2.5 text-center">
                  <p className="text-xs text-gray-500">─── {m.mesaj} ───</p>
                </div>
              );
              return (
                <div key={m.id}
                  className={`flex ${adminMi ? "justify-end" : "justify-start"} px-4 py-3`}
                  style={m.icNot ? { backgroundColor: "var(--mint)" } : {}}>
                  <div className="max-w-[85%] space-y-1">
                    <div className="flex items-center gap-2">
                      {!adminMi && <span className="text-[10px] font-semibold text-gray-400">{m.gonderenAd ?? "Kullanıcı"}</span>}
                      {adminMi  && <span className="text-[10px] font-semibold text-[var(--leaf)]">Sen (Admin)</span>}
                      {m.icNot  && <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--mint)] text-[var(--leaf)]">İç Not</span>}
                      <span className="text-[10px] text-gray-500">{zaman(m.olusturma)}</span>
                    </div>
                    <div className="px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed"
                      style={{
                        backgroundColor: m.icNot ? "var(--mint)" : adminMi ? "var(--mint)" : "rgba(255,255,255,0.06)",
                        color:           adminMi ? "#fde68a" : "#e2e8f0",
                        borderBottomRightRadius: adminMi ? 4 : 16,
                        borderBottomLeftRadius:  adminMi ? 16 : 4,
                      }}>
                      {m.mesaj}
                    </div>
                    {m.ekler.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {m.ekler.map((e, i) => (
                          <a key={i} href={e.url} target="_blank" rel="noreferrer"
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50 text-xs text-gray-400 hover:text-white transition-colors">
                            <Paperclip className="w-3 h-3" />{e.ad}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={altRef} />
          </div>

          {/* Cevap kutusu */}
          <div className="border-t border-gray-200 p-4 space-y-3">
            <textarea value={cevap} onChange={e => setCevap(e.target.value)} rows={4}
              placeholder={icNot ? "İç not yaz (sadece adminler görür)..." : "Müşteriye cevap yaz..."}
              className="w-full px-3 py-2.5 rounded-xl border text-white placeholder-[#475569] text-sm focus:outline-none transition-colors resize-none"
              style={{
                backgroundColor: icNot ? "var(--mint)" : "rgba(255,255,255,0.05)",
                borderColor:     icNot ? "var(--forest-200, #B3E8C8)" : "rgba(255,255,255,0.08)",
              }} />
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <input ref={dosyaRef} type="file" multiple accept="image/*,application/pdf,text/plain"
                  onChange={e => { setDosyalar(p => [...p, ...Array.from(e.target.files ?? [])].slice(0, 5)); e.target.value = ""; }}
                  className="hidden" />
                <button onClick={() => dosyaRef.current?.click()}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:text-[var(--leaf)] hover:border-[var(--forest-200, #B3E8C8)] transition-colors">
                  <Paperclip className="w-4 h-4" />
                </button>
                <button onClick={() => setIcNot(!icNot)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
                  style={{
                    backgroundColor: icNot ? "var(--mint)" : "transparent",
                    borderColor:     icNot ? "var(--forest-200, #B3E8C8)" : "rgba(255,255,255,0.08)",
                    color:           icNot ? "var(--leaf)" : "#64748b",
                  }}>
                  {icNot ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {icNot ? "İç Not" : "İç Not Ekle"}
                </button>
                {dosyalar.map((d, i) => (
                  <span key={i} className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">
                    {d.name.slice(0, 10)}
                    <button onClick={() => setDosyalar(p => p.filter((_, x) => x !== i))}><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
              <button onClick={handleGonder} disabled={gonderiyor || (!cevap.trim() && dosyalar.length === 0)}
                className="ml-auto flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--forest)] text-white text-sm font-bold hover:opacity-90 transition-colors disabled:opacity-50">
                {gonderiyor
                  ? <div className="w-4 h-4 border-2 border-[var(--forest)]/30 border-t-[var(--forest)] rounded-full animate-spin" />
                  : <Send className="w-4 h-4" />}
                {icNot ? "Not Ekle" : "Gönder"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sağ — Yan Panel */}
      <div className="space-y-4">
        {/* Kullanıcı bilgisi */}
        <div className="card rounded-2xl p-4 space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Kullanıcı</p>
          <p className="text-sm font-semibold text-white">{talep.kullaniciAd ?? "—"}</p>
          <p className="text-xs text-gray-500">{talep.kullaniciEmail}</p>
        </div>

        {/* Talep yönetimi */}
        <div className="card rounded-2xl p-4 space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Talep Yönetimi</p>

          <div className="space-y-2">
            <label className="text-xs text-gray-500">Durum</label>
            <select value={talep.durum}
              onChange={e => handleDurumGuncelle(e.target.value as DestekDurum)}
              className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-white text-sm focus:outline-none">
              {Object.entries(DURUM_ETIKETLERI).map(([k, v]) => (
                <option key={k} value={k} className="bg-[var(--forest)]">{v}</option>
              ))}
            </select>

            <label className="text-xs text-gray-500">Kategori</label>
            <select value={talep.kategori} disabled
              className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-500 text-sm focus:outline-none cursor-not-allowed">
              {Object.entries(KATEGORI_ETIKETLERI).map(([k, v]) => (
                <option key={k} value={k} className="bg-[var(--forest)]">{v}</option>
              ))}
            </select>

            <label className="text-xs text-gray-500">Öncelik</label>
            <select value={talep.oncelik} disabled
              className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-500 text-sm focus:outline-none cursor-not-allowed">
              {Object.entries(ONCELIK_ETIKETLERI).map(([k, v]) => (
                <option key={k} value={k} className="bg-[var(--forest)]">{v}</option>
              ))}
            </select>
          </div>
        </div>

        {/* İstatistik */}
        <div className="card rounded-2xl p-4 space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">İstatistik</p>
          <div className="space-y-1.5 text-xs text-gray-500">
            <div className="flex justify-between"><span>Açılış</span><span className="text-gray-400">{zaman(talep.olusturma)}</span></div>
            <div className="flex justify-between"><span>Son Mesaj</span><span className="text-gray-400">{zaman(talep.sonMesajTarihi)}</span></div>
            <div className="flex justify-between"><span>Mesaj Sayısı</span><span className="text-gray-400">{mesajlar.filter(m => m.gonderenTip !== "sistem").length}</span></div>
            {talep.memnuniyetPuan && (
              <div className="flex justify-between"><span>Memnuniyet</span><span className="text-[var(--leaf)]">{"★".repeat(talep.memnuniyetPuan)}</span></div>
            )}
          </div>
        </div>

        {/* Aksiyon butonları */}
        {aktifMi && (
          <div className="space-y-2">
            <button onClick={() => handleDurumGuncelle("cozuldu")}
              className="w-full py-2.5 rounded-xl border border-[rgba(34,197,94,0.3)] text-[#22c55e] text-sm font-semibold hover:bg-[rgba(34,197,94,0.08)] transition-colors">
              ✓ Çözüldü İşaretle
            </button>
            <button onClick={() => handleDurumGuncelle("kapali")}
              className="w-full py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm hover:bg-gray-50 transition-colors">
              Talebi Kapat
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
