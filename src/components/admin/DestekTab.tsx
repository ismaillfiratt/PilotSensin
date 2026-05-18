"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Search, Clock, AlertCircle } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import {
  type DestekTalep, type DestekKategori, type DestekOncelik, type DestekDurum,
  DURUM_ETIKETLERI, DURUM_RENKLERI, KATEGORI_ETIKETLERI, ONCELIK_ETIKETLERI, ONCELIK_RENKLERI,
  taleptenRow,
} from "@/lib/destek-data";

function zaman(iso: string) {
  const fark = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (fark < 1)    return "Az önce";
  if (fark < 60)   return `${fark}dk önce`;
  if (fark < 1440) return `${Math.floor(fark / 60)}sa önce`;
  return `${Math.floor(fark / 1440)}g önce`;
}

export default function DestekTab() {
  const router = useRouter();
  const [talepler,    setTalepler]    = useState<DestekTalep[]>([]);
  const [yukleniyor,  setYukleniyor]  = useState(true);
  const [arama,       setArama]       = useState("");
  const [durumF,      setDurumF]      = useState<"tumu" | DestekDurum>("tumu");
  const [kategoriF,   setKategoriF]   = useState<"tumu" | DestekKategori>("tumu");
  const [oncelikF,    setOncelikF]    = useState<"tumu" | DestekOncelik>("tumu");

  useEffect(() => {
    (async () => {
      const sb = createClient();
      const { data } = await sb
        .from("destek_talepleri")
        .select("*")
        .order("son_mesaj_tarihi", { ascending: false });
      setTalepler((data ?? []).map(r => taleptenRow(r as Record<string, unknown>)));
      setYukleniyor(false);
    })();
  }, []);

  const filtreli = useMemo(() => talepler.filter(t => {
    if (durumF    !== "tumu" && t.durum    !== durumF)    return false;
    if (kategoriF !== "tumu" && t.kategori !== kategoriF) return false;
    if (oncelikF  !== "tumu" && t.oncelik  !== oncelikF)  return false;
    if (arama && !t.konu.toLowerCase().includes(arama.toLowerCase()) &&
        !t.kullaniciEmail.toLowerCase().includes(arama.toLowerCase())) return false;
    return true;
  }), [talepler, durumF, kategoriF, oncelikF, arama]);

  const sayaclar = useMemo(() => ({
    acik:     talepler.filter(t => t.durum === "acik").length,
    bekleyen: talepler.filter(t => t.durum === "cevap-bekliyor").length,
    okunmamis:talepler.filter(t => !t.adminOkundu).length,
  }), [talepler]);

  if (yukleniyor) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-6 h-6 border-2 border-[rgba(255,255,255,0.1)] border-t-[#fbc024] rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Sayaç barı */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Açık",      deger: sayaclar.acik,      renk: "#fbc024" },
          { label: "Bekleyen",  deger: sayaclar.bekleyen,  renk: "#a855f7" },
          { label: "Okunmamış", deger: sayaclar.okunmamis, renk: "#ef4444" },
        ].map(({ label, deger, renk }) => (
          <div key={label} className="rounded-xl p-4 text-center"
            style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${renk}25` }}>
            <p className="text-2xl font-black" style={{ color: renk }}>{deger}</p>
            <p className="text-xs text-[#64748b] mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filtreler */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
          <input value={arama} onChange={e => setArama(e.target.value)}
            placeholder="Konu, e-posta ara..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-white placeholder-[#475569] text-sm focus:outline-none focus:border-[rgba(251,192,36,0.4)] transition-colors" />
        </div>
        {[
          { label: "Durum",    value: durumF,    set: setDurumF,    opts: Object.entries(DURUM_ETIKETLERI) as [DestekDurum, string][] },
          { label: "Kategori", value: kategoriF, set: setKategoriF, opts: Object.entries(KATEGORI_ETIKETLERI) as [DestekKategori, string][] },
          { label: "Öncelik",  value: oncelikF,  set: setOncelikF,  opts: Object.entries(ONCELIK_ETIKETLERI) as [DestekOncelik, string][] },
        ].map(({ label, value, set, opts }) => (
          <select key={label} value={value} onChange={e => (set as (v: string) => void)(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-sm focus:outline-none text-white">
            <option value="tumu" className="bg-[#0e172a]">{label}: Tümü</option>
            {opts.map(([k, v]) => (
              <option key={k} value={k} className="bg-[#0e172a]">{v}</option>
            ))}
          </select>
        ))}
      </div>

      {/* Liste */}
      {filtreli.length === 0 ? (
        <div className="py-16 text-center rounded-xl" style={{ background: "rgba(255,255,255,0.02)" }}>
          {talepler.length === 0
            ? <><AlertCircle className="w-8 h-8 text-[#334155] mx-auto mb-3" /><p className="text-sm text-[#64748b]">Tüm talepler cevaplandı. 🎉</p></>
            : <p className="text-sm text-[#64748b]">Bu filtrelerle eşleşen talep yok.</p>}
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
          {/* Desktop başlık */}
          <div className="hidden md:grid md:grid-cols-[1fr_160px_100px_90px_110px_44px] gap-3 px-4 py-3 text-xs font-semibold uppercase tracking-wider"
            style={{ color: "#475569", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
            <span>Konu</span><span>Kullanıcı</span><span>Durum</span><span>Öncelik</span><span>Son Mesaj</span><span />
          </div>

          <div className="divide-y divide-[rgba(255,255,255,0.04)]">
            {filtreli.map((t, i) => {
              const durumRenk  = DURUM_RENKLERI[t.durum];
              const okunmamis = !t.adminOkundu;
              return (
                <motion.button key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => router.push(`/admin/destek/${t.id}`)}
                  className="w-full text-left hover:bg-[rgba(255,255,255,0.02)] transition-colors"
                  style={{ borderLeft: okunmamis ? `3px solid ${durumRenk}` : undefined }}>
                  {/* Desktop */}
                  <div className="hidden md:grid md:grid-cols-[1fr_160px_100px_90px_110px_44px] gap-3 px-4 py-3.5 items-center">
                    <p className={`text-sm truncate ${okunmamis ? "font-bold text-white" : "text-[#e2e8f0]"}`}>{t.konu}</p>
                    <div className="min-w-0">
                      <p className="text-xs text-[#94a3b8] truncate">{t.kullaniciAd ?? t.kullaniciEmail}</p>
                      <p className="text-[10px] text-[#475569] truncate">{t.kullaniciEmail}</p>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded w-fit"
                      style={{ color: durumRenk, backgroundColor: durumRenk + "20" }}>
                      {DURUM_ETIKETLERI[t.durum]}
                    </span>
                    <span className="text-xs font-semibold" style={{ color: ONCELIK_RENKLERI[t.oncelik] }}>
                      {ONCELIK_ETIKETLERI[t.oncelik]}
                    </span>
                    <span className="text-xs text-[#475569] flex items-center gap-1">
                      <Clock className="w-3 h-3" />{zaman(t.sonMesajTarihi)}
                    </span>
                    <span className="text-[#475569] text-lg">›</span>
                  </div>
                  {/* Mobile */}
                  <div className="md:hidden px-4 py-3 space-y-1">
                    <p className={`text-sm ${okunmamis ? "font-bold text-white" : "text-[#e2e8f0]"}`}>{t.konu}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                        style={{ color: durumRenk, backgroundColor: durumRenk + "20" }}>
                        {DURUM_ETIKETLERI[t.durum]}
                      </span>
                      <span className="text-[10px] text-[#475569]">{t.kullaniciEmail}</span>
                      <span className="text-[10px] text-[#475569] ml-auto">{zaman(t.sonMesajTarihi)}</span>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
