"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle, Mail, Copy, Check, ExternalLink,
  Plus, Paperclip, X, ChevronRight, AlertCircle,
  HelpCircle, Bug, Lightbulb, Send, Clock,
} from "lucide-react";
import { z } from "zod";
import { createClient } from "@/utils/supabase/client";
import { useDestek } from "@/store/destek";
import { useSirket } from "@/store/sirket";
import { useBildirimler } from "@/store/bildirimler";
import {
  KATEGORI_ETIKETLERI, DURUM_ETIKETLERI, DURUM_RENKLERI,
  ONCELIK_ETIKETLERI, ONCELIK_RENKLERI,
  type DestekKategori, type DestekOncelik, type DestekDurum, type DestekEk,
} from "@/lib/destek-data";

const DESTEK_EMAIL = process.env.NEXT_PUBLIC_DESTEK_EMAIL ?? "destek@pilotsensin.com";

const sema = z.object({
  konu:     z.string().min(5, "En az 5 karakter").max(200, "En fazla 200 karakter"),
  kategori: z.enum(["kullanim", "hata", "oneri", "faturalama", "genel"]),
  oncelik:  z.enum(["dusuk", "orta", "yuksek", "acil"]),
  mesaj:    z.string().min(20, "En az 20 karakter").max(5000, "En fazla 5000 karakter"),
});

const KATEGORI_KARTLAR = [
  { key: "kullanim" as DestekKategori, icon: HelpCircle, label: "Kullanım Soruları",  renk: "#3b82f6" },
  { key: "hata"     as DestekKategori, icon: Bug,         label: "Hata Bildirimi",     renk: "#ef4444" },
  { key: "oneri"    as DestekKategori, icon: Lightbulb,   label: "Öneri Paylaş",       renk: "var(--leaf)" },
];

function zaman(iso: string) {
  const fark = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (fark < 1)    return "Az önce";
  if (fark < 60)   return `${fark}dk önce`;
  if (fark < 1440) return `${Math.floor(fark / 60)}sa önce`;
  return `${Math.floor(fark / 1440)}g önce`;
}

export default function IletisimPage() {
  const router  = useRouter();
  const { companyId } = useSirket();
  const { talepler, taleplerYukle, yeniTalep } = useDestek();
  const { ekle: bildirimEkle } = useBildirimler();

  const [kullaniciId,    setKullaniciId]    = useState<string | null>(null);
  const [kullaniciEmail, setKullaniciEmail] = useState("");
  const [kullaniciAd,    setKullaniciAd]    = useState<string | null>(null);
  const [ortYanit,       setOrtYanit]       = useState<number | null>(null);
  const [kopyalandi,     setKopyalandi]     = useState(false);
  const [filtre,         setFiltre]         = useState<"tumu" | DestekDurum>("tumu");
  const [gonderiyor,     setGonderiyor]     = useState(false);
  const [hata,           setHata]           = useState<Record<string, string>>({});

  const [konu,     setKonu]     = useState("");
  const [kategori, setKategori] = useState<DestekKategori>("genel");
  const [oncelik,  setOncelik]  = useState<DestekOncelik>("orta");
  const [mesaj,    setMesaj]    = useState("");
  const [dosyalar, setDosyalar] = useState<File[]>([]);

  const formRef   = useRef<HTMLDivElement>(null);
  const dosyaRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const sb = createClient();
      const { data: { user } } = await sb.auth.getUser();
      if (!user) { router.replace(`/giris?callbackUrl=/iletisim`); return; }
      setKullaniciId(user.id);
      setKullaniciEmail(user.email ?? "");
      const { data: profil } = await sb.from("profiles").select("full_name").eq("id", user.id).single();
      setKullaniciAd((profil?.full_name as string | null) ?? null);

      const { data: ort } = await sb.rpc("destek_ortalama_yanit");
      if (typeof ort === "number") setOrtYanit(Math.round(ort * 10) / 10);

      await taleplerYukle();
    })();
  }, [router, taleplerYukle]);

  const gorununTalepler = useMemo(() =>
    talepler.filter(t => filtre === "tumu" || t.durum === filtre),
    [talepler, filtre]
  );

  const kopyala = () => {
    navigator.clipboard.writeText(DESTEK_EMAIL);
    setKopyalandi(true);
    setTimeout(() => setKopyalandi(false), 2000);
  };

  const kategoriSec = (k: DestekKategori) => {
    setKategori(k);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const dosyaEkle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const yeni = Array.from(e.target.files ?? []);
    setDosyalar(prev => [...prev, ...yeni].slice(0, 5));
    e.target.value = "";
  };

  const dosyaKaldir = (i: number) =>
    setDosyalar(prev => prev.filter((_, idx) => idx !== i));

  const handleGonder = async () => {
    const sonuc = sema.safeParse({ konu, kategori, oncelik, mesaj });
    if (!sonuc.success) {
      const hatalar: Record<string, string> = {};
      sonuc.error.issues.forEach(e => { hatalar[String(e.path[0])] = e.message; });
      setHata(hatalar);
      return;
    }
    if (!kullaniciId) return;

    setGonderiyor(true);
    setHata({});

    try {
      const sb = createClient();
      const ekler: DestekEk[] = [];

      for (const dosya of dosyalar) {
        const yol = `${kullaniciId}/${Date.now()}-${dosya.name}`;
        const { data: yukle } = await sb.storage.from("destek-ekleri").upload(yol, dosya);
        if (yukle) {
          const { data: url } = sb.storage.from("destek-ekleri").getPublicUrl(yukle.path);
          ekler.push({ ad: dosya.name, url: url.publicUrl, boyut: dosya.size, tip: dosya.type });
        }
      }

      const talepId = await yeniTalep(
        { konu, kategori, oncelik, mesaj, ekler },
        kullaniciId, kullaniciEmail, kullaniciAd, companyId ?? null
      );
      if (!talepId) throw new Error("Talep oluşturulamadı");

      await fetch("/api/destek/yeni-talep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ talepId }),
      }).catch(() => {});

      bildirimEkle({
        id: crypto.randomUUID(),
        tip: "basari",
        modul: "sistem",
        baslik: "Talep alındı",
        mesaj: konu,
        ilgiliLink: `/iletisim/${talepId}`,
        sesCal: false,
        pushGonder: false,
      });

      router.push(`/iletisim/${talepId}`);
    } catch {
      setHata({ genel: "Talep gönderilemedi. Lütfen tekrar deneyin." });
    } finally {
      setGonderiyor(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-24">

      {/* Hero */}
      <div className="card rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--mint)] border border-[var(--forest-200, #B3E8C8)] flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-[var(--leaf)]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Sana Nasıl Yardımcı Olabiliriz?</h1>
            <p className="text-xs text-gray-400">Ekibimiz en kısa sürede döner</p>
          </div>
        </div>

        {/* E-posta kartı */}
        <div className="flex items-center justify-between gap-3 p-4 rounded-xl bg-gray-50 border border-gray-200 mt-4">
          <div className="flex items-center gap-3 min-w-0">
            <Mail className="w-4 h-4 text-[var(--leaf)] shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">{DESTEK_EMAIL}</p>
              <p className="text-xs text-gray-500">
                Ort. yanıt: {ortYanit !== null ? `${ortYanit} saat` : "4 saat"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={kopyala}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-gray-400 hover:text-gray-800 transition-colors">
              {kopyalandi ? <Check className="w-3.5 h-3.5 text-[#22c55e]" /> : <Copy className="w-3.5 h-3.5" />}
              {kopyalandi ? "Kopyalandı" : "Kopyala"}
            </button>
            <button onClick={() => window.open(`mailto:${DESTEK_EMAIL}`)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--mint)] border border-[var(--forest-200, #B3E8C8)] text-[var(--leaf)] hover:bg-[var(--forest-100, #D9F2E4)] transition-colors">
              <ExternalLink className="w-3.5 h-3.5" /> Mail Aç
            </button>
          </div>
        </div>
      </div>

      {/* Kategori kartları */}
      <div className="grid grid-cols-3 gap-3">
        {KATEGORI_KARTLAR.map(({ key, icon: Icon, label, renk }) => (
          <button key={key} onClick={() => kategoriSec(key)}
            className="card rounded-xl p-4 text-center hover:scale-[1.02] transition-all active:scale-95 border"
            style={{ borderColor: kategori === key ? renk + "60" : "transparent" }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2"
              style={{ backgroundColor: renk + "20" }}>
              <Icon className="w-4 h-4" style={{ color: renk }} />
            </div>
            <p className="text-xs font-semibold text-gray-800 leading-snug">{label}</p>
          </button>
        ))}
      </div>

      {/* Yeni talep formu */}
      <div ref={formRef} className="card rounded-2xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <Plus className="w-4 h-4 text-[var(--leaf)]" /> Yeni Talep
        </h2>

        {hata.genel && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.25)]">
            <AlertCircle className="w-4 h-4 text-[#ef4444] shrink-0" />
            <p className="text-sm text-[#ef4444]">{hata.genel}</p>
          </div>
        )}

        {/* Konu */}
        <div>
          <label className="text-xs text-gray-400 font-medium block mb-1.5">Konu *</label>
          <input value={konu} onChange={e => setKonu(e.target.value)} maxLength={200}
            placeholder="Kısaca sorununuzu özetleyin..."
            className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder-[#475569] text-sm focus:outline-none focus:border-[var(--leaf)] transition-colors" />
          {hata.konu && <p className="text-xs text-[#ef4444] mt-1">{hata.konu}</p>}
        </div>

        {/* Kategori + Öncelik */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-400 font-medium block mb-1.5">Kategori *</label>
            <select value={kategori} onChange={e => setKategori(e.target.value as DestekKategori)}
              className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 text-sm focus:outline-none focus:border-[var(--leaf)] transition-colors">
              {Object.entries(KATEGORI_ETIKETLERI).map(([k, v]) => (
                <option key={k} value={k} className="bg-[var(--forest)]">{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 font-medium block mb-1.5">Öncelik</label>
            <select value={oncelik} onChange={e => setOncelik(e.target.value as DestekOncelik)}
              className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 text-sm focus:outline-none focus:border-[var(--leaf)] transition-colors">
              {Object.entries(ONCELIK_ETIKETLERI).map(([k, v]) => (
                <option key={k} value={k} className="bg-[var(--forest)]">{v}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Açıklama */}
        <div>
          <label className="text-xs text-gray-400 font-medium block mb-1.5">Açıklama *</label>
          <textarea value={mesaj} onChange={e => setMesaj(e.target.value)} maxLength={5000} rows={5}
            placeholder="Sorununuzu veya isteğinizi açık ve detaylı açıklayın..."
            className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder-[#475569] text-sm focus:outline-none focus:border-[var(--leaf)] transition-colors resize-none leading-relaxed" />
          <div className="flex justify-between mt-1">
            <p className="text-xs text-[#ef4444]">{hata.mesaj ?? ""}</p>
            <p className="text-xs text-gray-500">{mesaj.length.toLocaleString("tr-TR")} / 5.000</p>
          </div>
        </div>

        {/* Dosya ekleri */}
        <div>
          <label className="text-xs text-gray-400 font-medium block mb-1.5">Dosya Ekle</label>
          <input ref={dosyaRef} type="file" multiple accept="image/*,application/pdf,text/plain"
            onChange={dosyaEkle} className="hidden" />
          <button onClick={() => dosyaRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-gray-200 text-gray-500 text-xs font-medium hover:border-[var(--forest-300, #7DD0A0)] hover:text-[var(--leaf)] transition-all">
            <Paperclip className="w-3.5 h-3.5" /> Ekran görüntüsü veya dosya ekle
          </button>
          {dosyalar.length > 0 && (
            <div className="mt-2 space-y-1.5">
              {dosyalar.map((d, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 text-xs text-gray-400">
                  <Paperclip className="w-3 h-3 shrink-0" />
                  <span className="flex-1 truncate">{d.name}</span>
                  <span className="text-gray-500">{(d.size / 1024).toFixed(0)} KB</span>
                  <button onClick={() => dosyaKaldir(i)}
                    className="text-gray-500 hover:text-[#ef4444] transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-500 mt-1.5">Maks. 5 dosya, her biri 10MB (resim, PDF, metin)</p>
        </div>

        <button onClick={handleGonder} disabled={gonderiyor}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[var(--forest)] text-gray-800 text-sm font-bold hover:opacity-90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
          {gonderiyor
            ? <><div className="w-4 h-4 border-2 border-[var(--forest)]/30 border-t-[var(--forest)] rounded-full animate-spin" />Gönderiliyor...</>
            : <><Send className="w-4 h-4" />Talep Gönder</>}
        </button>
      </div>

      {/* Geçmiş talepler */}
      {talepler.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-800">Talepleriniz</h2>
            <div className="flex gap-1 p-1 rounded-xl bg-gray-50 border border-gray-200">
              {(["tumu", "acik", "cozuldu", "kapali"] as const).map(f => (
                <button key={f} onClick={() => setFiltre(f)}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                  style={{
                    backgroundColor: filtre === f ? "var(--mint)" : "transparent",
                    color:           filtre === f ? "var(--leaf)" : "#64748b",
                    border:          filtre === f ? "1px solid var(--forest-200, #B3E8C8)" : "1px solid transparent",
                  }}>
                  {f === "tumu" ? "Hepsi" : DURUM_ETIKETLERI[f as DestekDurum]}
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence mode="popLayout">
            {gorununTalepler.length === 0 ? (
              <motion.div key="bos" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="card rounded-xl py-8 text-center text-sm text-gray-500">
                Bu filtreyle eşleşen talep yok
              </motion.div>
            ) : gorununTalepler.map((t, i) => {
              const durumRenk = DURUM_RENKLERI[t.durum];
              const okunmamis = !t.kullaniciOkundu;
              return (
                <motion.button key={t.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => router.push(`/iletisim/${t.id}`)}
                  className="w-full card rounded-xl overflow-hidden hover:bg-gray-50 transition-colors text-left"
                  style={{ borderLeft: okunmamis ? `3px solid ${durumRenk}` : undefined }}>
                  <div className="flex items-center gap-3 px-4 py-3.5">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className={`text-sm truncate ${okunmamis ? "font-bold text-gray-800" : "font-medium text-[#e2e8f0]"}`}>
                          {t.konu}
                        </p>
                        {okunmamis && <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: durumRenk }} />}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                          style={{ color: durumRenk, backgroundColor: durumRenk + "20" }}>
                          {DURUM_ETIKETLERI[t.durum]}
                        </span>
                        <span className="text-[10px] text-gray-500">{KATEGORI_ETIKETLERI[t.kategori]}</span>
                        <span className="text-[10px] text-gray-500" style={{ color: ONCELIK_RENKLERI[t.oncelik] }}>
                          {ONCELIK_ETIKETLERI[t.oncelik]}
                        </span>
                        <span className="text-[10px] text-gray-500 flex items-center gap-0.5 ml-auto">
                          <Clock className="w-3 h-3" />{zaman(t.sonMesajTarihi)}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-500 shrink-0" />
                  </div>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {talepler.length === 0 && (
        <div className="card rounded-2xl py-12 text-center">
          <MessageCircle className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Henüz destek talebin yok.</p>
          <p className="text-xs text-gray-500 mt-1">Sorularınla bize ulaş!</p>
        </div>
      )}
    </div>
  );
}
