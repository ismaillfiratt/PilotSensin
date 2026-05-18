"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Trash2, Check, Calendar, RepeatIcon,
  Zap, X, Receipt, Settings2,
} from "lucide-react";
import { useNakitAkis } from "@/store/nakitAkis";
import { useKdvHavuzu, netKdvBakiye } from "@/store/kdvHavuzu";
import { useNakitAyarlar } from "@/store/nakitAyarlar";
import { kurus, formatTL } from "@/lib/para";
import type { Kurus } from "@/lib/para";

const tl = (n: number) => formatTL(n);

function bugunStr() { return new Date().toISOString().split("T")[0]; }

function vadeBadge(tarih: string) {
  const gun = Math.ceil((new Date(tarih).getTime() - Date.now()) / 86400000);
  if (gun < 0)  return { label: `${Math.abs(gun)} gün geçti`, color: "#ef4444" };
  if (gun === 0) return { label: "Bugün",              color: "#fbc024" };
  if (gun <= 3)  return { label: `${gun} gün kaldı`,   color: "#f97316" };
  if (gun <= 7)  return { label: `${gun} gün kaldı`,   color: "#fbc024" };
  return                { label: `${gun} gün kaldı`,   color: "#22c55e" };
}

export default function PlanlananKalemler() {
  const { kalemler, tekrarlayanlar, ekle, sil, tamamla, tekrarlayanEkle, tekrarlayanSil } = useNakitAkis();
  const { kayitlar: havuzKayitlari } = useKdvHavuzu();
  const {
    gelirKategoriler, giderKategoriler, kategoriEkle, kategoriSil,
  } = useNakitAyarlar();

  const [formAcik,    setFormAcik]    = useState(false);
  const [tekrarAcik,  setTekrarAcik]  = useState(false);
  const [katDuzenle,  setKatDuzenle]  = useState(false);
  const [yeniKat,     setYeniKat]     = useState("");
  const [gosterTamamlandi, setGosterTamamlandi] = useState(false);

  // Manuel form state
  const [tip,      setTip]      = useState<"gelir" | "gider">("gider");
  const [kategori, setKategori] = useState("");
  const [tutar,    setTutar]    = useState("");
  const [vade,     setVade]     = useState(bugunStr());
  const [aciklama, setAciklama] = useState("");

  // Tekrarlayan form state
  const [tkAd,        setTkAd]        = useState("");
  const [tkTip,       setTkTip]       = useState<"gelir" | "gider">("gider");
  const [tkKategori,  setTkKategori]  = useState("");
  const [tkTutar,     setTkTutar]     = useState("");
  const [tkGun,       setTkGun]       = useState("1");

  const netKdv = useMemo(() => netKdvBakiye(havuzKayitlari), [havuzKayitlari]);

  const gorunenKalemler = useMemo(() =>
    [...kalemler]
      .filter((k) => gosterTamamlandi || !k.tamamlandi)
      .sort((a, b) => a.vadeTarihi.localeCompare(b.vadeTarihi)),
    [kalemler, gosterTamamlandi]
  );

  const handleEkle = () => {
    if (!tutar || !kategori) return;
    ekle({ tip, kategori, tutarKurus: kurus(Number(tutar)), vadeTarihi: vade, tamamlandi: false, aciklama, kaynak: "manuel" });
    setTutar(""); setAciklama(""); setFormAcik(false);
  };

  const handleTekrarlayanEkle = () => {
    if (!tkAd || !tkTutar) return;
    tekrarlayanEkle({ ad: tkAd, tip: tkTip, kategori: tkKategori, tutarKurus: kurus(Number(tkTutar)), odemeGunu: Number(tkGun), aktif: true });
    setTkAd(""); setTkTutar(""); setTekrarAcik(false);
  };

  // KDV otomasyonu: net KDV borcunu ayın 28'ine ekle
  const kdvOtomatikEkle = () => {
    if (netKdv <= 0) return;
    const simdi    = new Date();
    const ayBasi   = new Date(simdi.getFullYear(), simdi.getMonth(), 28);
    const vadeTarihi = ayBasi < simdi
      ? new Date(simdi.getFullYear(), simdi.getMonth() + 1, 28).toISOString().split("T")[0]
      : ayBasi.toISOString().split("T")[0];

    ekle({
      tip:        "gider",
      kategori:   "Vergi & SGK",
      tutarKurus:      netKdv,
      vadeTarihi,
      tamamlandi: false,
      aciklama:   `Net KDV Borcu (Otomatik) — ${new Date(vadeTarihi).toLocaleDateString("tr-TR")}`,
      kaynak:     "kdv_otomatik",
    });
  };

  const kategoriler = tip === "gelir" ? gelirKategoriler : giderKategoriler;
  const tkKategoriler = tkTip === "gelir" ? gelirKategoriler : giderKategoriler;

  const handleKatEkle = () => {
    if (!yeniKat.trim()) return;
    kategoriEkle(tip, yeniKat.trim());
    setKategori(yeniKat.trim());
    setYeniKat("");
  };

  return (
    <div className="space-y-4">

      {/* Başlık + aksiyon butonları */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-base font-bold text-white">Planlanan Nakit Akışı</h2>
          <p className="text-xs text-[#64748b]">Gelecekteki ödemeler, gelirler ve tekrarlayan kalemler</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setGosterTamamlandi((v) => !v)}
            className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${gosterTamamlandi ? "border-[rgba(251,192,36,0.4)] text-[#fbc024]" : "border-[rgba(255,255,255,0.08)] text-[#64748b]"}`}>
            Tamamlananlar
          </button>
          <button onClick={() => { setTekrarAcik((v) => !v); setFormAcik(false); }}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${tekrarAcik ? "border-[rgba(34,197,94,0.4)] text-[#22c55e]" : "border-[rgba(255,255,255,0.08)] text-[#64748b]"}`}>
            <RepeatIcon className="w-3.5 h-3.5" />Tekrarlayan
          </button>
          <button onClick={() => { setFormAcik((v) => !v); setTekrarAcik(false); }}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-[#fbc024] text-[#0e172a] font-semibold hover:bg-[#d9a61f] transition-colors">
            <Plus className="w-3.5 h-3.5" />Yeni Kalem
          </button>
        </div>
      </div>

      {/* Manuel ekleme formu */}
      <AnimatePresence>
        {formAcik && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="glass-card rounded-2xl p-4 space-y-3">
              <p className="text-sm font-semibold text-white">Yeni Planlanan Kalem</p>

              {/* Tip seçimi */}
              <div className="grid grid-cols-2 gap-2">
                {(["gelir", "gider"] as const).map((t) => (
                  <button key={t} onClick={() => { setTip(t); setKategori(""); }}
                    className="py-2 rounded-xl text-sm font-semibold transition-all border"
                    style={{
                      borderColor: tip === t ? (t === "gelir" ? "#22c55e" : "#ef4444") : "rgba(255,255,255,0.08)",
                      backgroundColor: tip === t ? (t === "gelir" ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)") : "transparent",
                      color: tip === t ? (t === "gelir" ? "#22c55e" : "#ef4444") : "#64748b",
                    }}>
                    {t === "gelir" ? "Gelir" : "Gider"}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] text-[#94a3b8] uppercase tracking-wide">Kategori</label>
                    <button type="button" onClick={() => setKatDuzenle((v) => !v)}
                      className={`flex items-center gap-0.5 text-[9px] px-1 py-0.5 rounded border transition-colors ${katDuzenle ? "border-[rgba(251,192,36,0.4)] text-[#fbc024]" : "border-[rgba(255,255,255,0.08)] text-[#475569]"}`}>
                      <Settings2 className="w-2.5 h-2.5" />Düzenle
                    </button>
                  </div>
                  {/* Kategori düzenleme mini paneli */}
                  <AnimatePresence>
                    {katDuzenle && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-1.5">
                        <div className="p-2 rounded-lg bg-[rgba(0,0,0,0.2)] border border-[rgba(255,255,255,0.07)] space-y-1.5">
                          <div className="flex flex-wrap gap-1">
                            {kategoriler.map((k) => (
                              <div key={k} className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.07)]">
                                <span className="text-[10px] text-white">{k}</span>
                                <button type="button" onClick={() => kategoriSil(tip, k)} className="text-[#475569] hover:text-[#ef4444]">
                                  <X className="w-2 h-2" />
                                </button>
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-1">
                            <input type="text" value={yeniKat} onChange={(e) => setYeniKat(e.target.value)}
                              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleKatEkle(); } }}
                              placeholder="Yeni kategori"
                              className="flex-1 px-2 py-1 rounded bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white text-[10px] focus:outline-none" />
                            <button type="button" onClick={handleKatEkle}
                              className="px-2 py-1 rounded bg-[rgba(34,197,94,0.15)] text-[#22c55e]">
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <select value={kategori} onChange={(e) => setKategori(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white text-sm focus:outline-none">
                    <option value="">Seçin...</option>
                    {kategoriler.map((k) => <option key={k} value={k} className="bg-[#0e172a]">{k}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-[#94a3b8] uppercase tracking-wide block mb-1">Tutar (₺)</label>
                  <input type="number" min="0" value={tutar} onChange={(e) => setTutar(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white text-sm focus:outline-none focus:border-[rgba(251,192,36,0.5)] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" />
                </div>
                <div>
                  <label className="text-[10px] text-[#94a3b8] uppercase tracking-wide block mb-1">Vade Tarihi</label>
                  <input type="date" value={vade} onChange={(e) => setVade(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white text-sm focus:outline-none focus:border-[rgba(251,192,36,0.5)] [color-scheme:dark]" />
                </div>
                <div>
                  <label className="text-[10px] text-[#94a3b8] uppercase tracking-wide block mb-1">Açıklama</label>
                  <input type="text" value={aciklama} onChange={(e) => setAciklama(e.target.value)}
                    placeholder="Opsiyonel"
                    className="w-full px-3 py-2 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white text-sm focus:outline-none focus:border-[rgba(251,192,36,0.5)]" />
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => setFormAcik(false)}
                  className="flex-1 py-2 rounded-xl border border-[rgba(255,255,255,0.08)] text-[#94a3b8] text-sm hover:bg-[rgba(255,255,255,0.04)] transition-colors">
                  İptal
                </button>
                <button onClick={handleEkle} disabled={!tutar || !kategori}
                  className="flex-1 py-2 rounded-xl bg-[#fbc024] text-[#0e172a] text-sm font-bold hover:bg-[#d9a61f] transition-colors disabled:opacity-40">
                  Ekle
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tekrarlayan kalem formu */}
      <AnimatePresence>
        {tekrarAcik && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="glass-card rounded-2xl p-4 space-y-3">
              <p className="text-sm font-semibold text-white">Tekrarlayan Kalem Ekle</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-[10px] text-[#94a3b8] uppercase tracking-wide block mb-1">Ad (örn: Personel Maaş, Kira)</label>
                  <input type="text" value={tkAd} onChange={(e) => setTkAd(e.target.value)}
                    placeholder="Tekrarlayan kalem adı"
                    className="w-full px-3 py-2 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white text-sm focus:outline-none focus:border-[rgba(251,192,36,0.5)]" />
                </div>
                <div>
                  <label className="text-[10px] text-[#94a3b8] uppercase tracking-wide block mb-1">Tip</label>
                  <select value={tkTip} onChange={(e) => setTkTip(e.target.value as "gelir" | "gider")}
                    className="w-full px-3 py-2 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white text-sm focus:outline-none">
                    <option value="gider" className="bg-[#0e172a]">Gider</option>
                    <option value="gelir" className="bg-[#0e172a]">Gelir</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-[#94a3b8] uppercase tracking-wide block mb-1">Kategori</label>
                  <select value={tkKategori} onChange={(e) => setTkKategori(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white text-sm focus:outline-none">
                    {tkKategoriler.map((k) =>
                      <option key={k} value={k} className="bg-[#0e172a]">{k}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-[#94a3b8] uppercase tracking-wide block mb-1">Aylık Tutar (₺)</label>
                  <input type="number" min="0" value={tkTutar} onChange={(e) => setTkTutar(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white text-sm focus:outline-none focus:border-[rgba(251,192,36,0.5)] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" />
                </div>
                <div>
                  <label className="text-[10px] text-[#94a3b8] uppercase tracking-wide block mb-1">Her ayın kaçında?</label>
                  <input type="number" min="1" max="31" value={tkGun} onChange={(e) => setTkGun(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white text-sm focus:outline-none focus:border-[rgba(251,192,36,0.5)] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setTekrarAcik(false)}
                  className="flex-1 py-2 rounded-xl border border-[rgba(255,255,255,0.08)] text-[#94a3b8] text-sm">İptal</button>
                <button onClick={handleTekrarlayanEkle} disabled={!tkAd || !tkTutar}
                  className="flex-1 py-2 rounded-xl bg-[#22c55e] text-[#0e172a] text-sm font-bold disabled:opacity-40">
                  Kaydet
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Aktif tekrarlayan kalemler */}
      {tekrarlayanlar.length > 0 && (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[rgba(255,255,255,0.05)] flex items-center gap-2">
            <RepeatIcon className="w-3.5 h-3.5 text-[#22c55e]" />
            <span className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wide">
              Tekrarlayan Kalemler
            </span>
          </div>
          <div className="divide-y divide-[rgba(255,255,255,0.04)]">
            {tekrarlayanlar.map((t) => (
              <div key={t.id} className="flex items-center gap-3 px-4 py-3">
                <div className={`w-2 h-2 rounded-full shrink-0 ${t.aktif ? "bg-[#22c55e]" : "bg-[#475569]"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{t.ad}</p>
                  <p className="text-[10px] text-[#64748b]">
                    Her ayın {t.odemeGunu}'i · {t.kategori}
                  </p>
                </div>
                <span className={`text-sm font-semibold ${t.tip === "gelir" ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                  {t.tip === "gelir" ? "+" : "−"}{tl(t.tutarKurus)}
                </span>
                <button onClick={() => tekrarlayanSil(t.id)} className="text-[#475569] hover:text-[#ef4444] transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KDV Otomasyonu */}
      {netKdv > 0 && (
        <div className="p-4 rounded-2xl bg-[rgba(251,192,36,0.06)] border border-[rgba(251,192,36,0.2)] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-[#fbc024]" />
              <div>
                <p className="text-sm font-semibold text-white">KDV Borcu Otomasyonu</p>
                <p className="text-[10px] text-[#64748b]">
                  Bu ay ödenecek net KDV: <span className="text-[#fbc024] font-semibold">{tl(netKdv)}</span>
                </p>
              </div>
            </div>
            <button onClick={kdvOtomatikEkle}
              className="px-3 py-1.5 rounded-lg bg-[rgba(251,192,36,0.15)] text-[#fbc024] text-xs font-semibold hover:bg-[rgba(251,192,36,0.25)] transition-colors flex items-center gap-1.5">
              <Zap className="w-3 h-3" />
              Ayın 28'ine Ekle
            </button>
          </div>
        </div>
      )}

      {/* Planlanan kalemler listesi */}
      {gorunenKalemler.length === 0 ? (
        <div className="glass-card rounded-2xl py-10 text-center space-y-2">
          <Calendar className="w-8 h-8 mx-auto text-[#334155] opacity-50" />
          <p className="text-sm text-[#64748b]">Henüz planlanan kalem yok</p>
          <p className="text-xs text-[#475569]">Gelecekteki ödemelerini ekleyerek nakit akışını öngör</p>
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="hidden md:grid md:grid-cols-[1fr_100px_100px_80px_100px_40px] gap-3 px-4 py-2.5 text-[10px] font-semibold text-[#475569] uppercase tracking-wider border-b border-[rgba(255,255,255,0.05)]">
            <span>Kalem</span><span>Kategori</span><span>Vade</span><span>Durum</span><span className="text-right">Tutar</span><span />
          </div>
          <div className="divide-y divide-[rgba(255,255,255,0.04)]">
            {gorunenKalemler.map((k) => {
              const vb = vadeBadge(k.vadeTarihi);
              return (
                <div key={k.id} className={`grid grid-cols-[1fr_auto] md:grid-cols-[1fr_100px_100px_80px_100px_40px] gap-3 px-4 py-3.5 items-center ${k.tamamlandi ? "opacity-50" : ""}`}>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${k.tip === "gelir" ? "bg-[#22c55e]" : "bg-[#ef4444]"}`} />
                      <p className="text-sm text-white truncate">{k.aciklama || k.kategori}</p>
                      {k.kaynak !== "manuel" && (
                        <span className="text-[9px] px-1 py-0.5 rounded bg-[rgba(251,192,36,0.1)] text-[#fbc024]">Otomatik</span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-[#64748b]">{k.kategori}</span>
                  <span className="text-xs text-[#94a3b8]">
                    {new Date(k.vadeTarihi).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}
                  </span>
                  <span className="text-[10px] font-semibold" style={{ color: vb.color }}>{vb.label}</span>
                  <p className={`text-sm font-semibold text-right ${k.tip === "gelir" ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                    {k.tip === "gelir" ? "+" : "−"}{tl(k.tutarKurus)}
                  </p>
                  <div className="flex items-center gap-1 justify-end">
                    {!k.tamamlandi && (
                      <button onClick={() => tamamla(k.id)} title="Tamamlandı işaretle"
                        className="w-6 h-6 flex items-center justify-center rounded text-[#475569] hover:text-[#22c55e] transition-colors">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button onClick={() => sil(k.id)}
                      className="w-6 h-6 flex items-center justify-center rounded text-[#475569] hover:text-[#ef4444] transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
