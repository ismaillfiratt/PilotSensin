"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail, Copy, Check, ExternalLink,
  Plus, Paperclip, X, ChevronRight, AlertCircle,
  HelpCircle, Bug, Lightbulb, Send, Clock, MessageCircle,
} from "lucide-react";
import { z } from "zod";
import { createClient }    from "@/utils/supabase/client";
import { useDestek }       from "@/store/destek";
import { useSirket }       from "@/store/sirket";
import { useBildirimler }  from "@/store/bildirimler";
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
  { key: "kullanim" as DestekKategori, icon: HelpCircle, label: "Kullanım Soruları", renk: "#3b82f6" },
  { key: "hata"     as DestekKategori, icon: Bug,        label: "Hata Bildirimi",    renk: "#ef4444" },
  { key: "oneri"    as DestekKategori, icon: Lightbulb,  label: "Öneri Paylaş",      renk: "var(--forest)" },
];

function zaman(iso: string) {
  const fark = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (fark < 1)    return "Az önce";
  if (fark < 60)   return `${fark}dk önce`;
  if (fark < 1440) return `${Math.floor(fark / 60)}sa önce`;
  return `${Math.floor(fark / 1440)}g önce`;
}

const KART      = "bg-white rounded-xl p-5";
const KART_STIL = { border: "0.5px solid rgba(0,0,0,0.08)" };

export default function IletisimPanel() {
  const router = useRouter();
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

  const formRef  = useRef<HTMLDivElement>(null);
  const dosyaRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const sb = createClient();
      const { data: { user } } = await sb.auth.getUser();
      if (!user) {
        router.replace(`/giris?callbackUrl=${encodeURIComponent("/ayarlar?tab=iletisim")}`);
        return;
      }
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
    <div className="space-y-4">

      {/* Panel başlık */}
      <div>
        <p className="label-caps">YARDIM</p>
        <h2 className="text-xl font-medium text-gray-900 mt-1">İletişim & Destek</h2>
        <p className="text-sm text-gray-500 mt-1">
          {ortYanit !== null
            ? `Soru, hata veya öneri bildir — ortalama yanıt süresi: ${ortYanit} saat`
            : "Sorularını destek ekibine ilet"}
        </p>
      </div>

      {/* ── KART 1 — Destek email ── */}
      <div className={KART + " flex items-center justify-between gap-4"} style={KART_STIL}>
        <div className="flex items-center gap-3 min-w-0">
          <Mail className="w-4 h-4 shrink-0" style={{ color: "var(--forest)" }} />
          <div className="min-w-0">
            <a
              href={`mailto:${DESTEK_EMAIL}`}
              className="text-sm font-medium truncate block hover:underline"
              style={{ color: "var(--forest)" }}
            >
              {DESTEK_EMAIL}
            </a>
            <p className="text-xs text-gray-400 mt-0.5">İş günleri 09:00-18:00 arası yanıt verilir</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={kopyala}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{ border: "0.5px solid rgba(0,0,0,0.12)", color: kopyalandi ? "#16a34a" : "#6b7280" }}
          >
            {kopyalandi ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {kopyalandi ? "Kopyalandı" : "Kopyala"}
          </button>
          <button
            onClick={() => window.open(`mailto:${DESTEK_EMAIL}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{ background: "rgba(15,61,46,0.08)", color: "var(--forest)", border: "0.5px solid rgba(15,61,46,0.15)" }}
          >
            <ExternalLink className="w-3.5 h-3.5" /> Mail Aç
          </button>
        </div>
      </div>

      {/* ── KART 2 — Kategori seçimi ── */}
      <div className={KART + " space-y-3"} style={KART_STIL}>
        <div>
          <p className="text-sm font-medium text-gray-800">Hızlı kategori seç</p>
          <p className="text-xs text-gray-400 mt-0.5">Talebinin türünü seç, form aşağıda hazırlanır</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {KATEGORI_KARTLAR.map(({ key, icon: Icon, label, renk }) => {
            const aktif = kategori === key;
            return (
              <button
                key={key}
                onClick={() => kategoriSec(key)}
                className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all"
                style={{
                  border:          aktif ? `1.5px solid var(--forest)` : "0.5px solid rgba(0,0,0,0.08)",
                  backgroundColor: aktif ? "rgba(15,61,46,0.04)"       : "transparent",
                }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: renk + "20" }}
                >
                  <Icon className="w-4 h-4" style={{ color: renk }} />
                </div>
                <p className="text-xs font-medium text-gray-700 text-center leading-snug">{label}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── KART 3 — Yeni talep formu ── */}
      <div ref={formRef} className={KART + " space-y-4"} style={KART_STIL}>
        <p className="text-sm font-medium text-gray-800 flex items-center gap-2">
          <Plus className="w-4 h-4" style={{ color: "var(--forest)" }} /> Yeni Destek Talebi
        </p>

        {hata.genel && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
            style={{ background: "rgba(239,68,68,0.08)", border: "0.5px solid rgba(239,68,68,0.25)" }}>
            <AlertCircle className="w-4 h-4 text-[#ef4444] shrink-0" />
            <p className="text-sm text-[#ef4444]">{hata.genel}</p>
          </div>
        )}

        {/* Konu */}
        <div>
          <label className="text-xs text-gray-500 font-medium block mb-1.5">Konu *</label>
          <input
            value={konu} onChange={e => setKonu(e.target.value)} maxLength={200}
            placeholder="Kısaca sorununuzu özetleyin..."
            className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none transition-colors"
            style={{ background: "var(--bg-secondary,#F8FAFC)", border: "0.5px solid rgba(0,0,0,0.1)", color: "var(--text-primary,#0F172A)" }}
          />
          {hata.konu && <p className="text-xs text-[#ef4444] mt-1">{hata.konu}</p>}
        </div>

        {/* Kategori + Öncelik */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1.5">Kategori *</label>
            <select value={kategori} onChange={e => setKategori(e.target.value as DestekKategori)}
              className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none transition-colors"
              style={{ background: "var(--bg-secondary,#F8FAFC)", border: "0.5px solid rgba(0,0,0,0.1)", color: "var(--text-primary,#0F172A)" }}>
              {Object.entries(KATEGORI_ETIKETLERI).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1.5">Öncelik</label>
            <select value={oncelik} onChange={e => setOncelik(e.target.value as DestekOncelik)}
              className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none transition-colors"
              style={{ background: "var(--bg-secondary,#F8FAFC)", border: "0.5px solid rgba(0,0,0,0.1)", color: "var(--text-primary,#0F172A)" }}>
              {Object.entries(ONCELIK_ETIKETLERI).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Mesaj */}
        <div>
          <label className="text-xs text-gray-500 font-medium block mb-1.5">Açıklama *</label>
          <textarea
            value={mesaj} onChange={e => setMesaj(e.target.value)} maxLength={5000} rows={5}
            placeholder="Sorununuzu veya isteğinizi açık ve detaylı açıklayın..."
            className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none transition-colors resize-none leading-relaxed"
            style={{ background: "var(--bg-secondary,#F8FAFC)", border: "0.5px solid rgba(0,0,0,0.1)", color: "var(--text-primary,#0F172A)" }}
          />
          <div className="flex justify-between mt-1">
            <p className="text-xs text-[#ef4444]">{hata.mesaj ?? ""}</p>
            <p className="text-xs text-gray-400">{mesaj.length.toLocaleString("tr-TR")} / 5.000</p>
          </div>
        </div>

        {/* Dosya ekleri */}
        <div>
          <label className="text-xs text-gray-500 font-medium block mb-1.5">Dosya Ekle</label>
          <input ref={dosyaRef} type="file" multiple accept="image/*,application/pdf,text/plain"
            onChange={dosyaEkle} className="hidden" />
          <button onClick={() => dosyaRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all"
            style={{ border: "1px dashed rgba(0,0,0,0.15)", color: "#6b7280" }}>
            <Paperclip className="w-3.5 h-3.5" /> Ekran görüntüsü veya dosya ekle
          </button>
          {dosyalar.length > 0 && (
            <div className="mt-2 space-y-1.5">
              {dosyalar.map((d, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-gray-400"
                  style={{ background: "rgba(0,0,0,0.03)" }}>
                  <Paperclip className="w-3 h-3 shrink-0" />
                  <span className="flex-1 truncate">{d.name}</span>
                  <span className="text-gray-400">{(d.size / 1024).toFixed(0)} KB</span>
                  <button onClick={() => dosyaKaldir(i)}
                    className="text-gray-400 hover:text-[#ef4444] transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-400 mt-1.5">Maks. 5 dosya, her biri 10MB (resim, PDF, metin)</p>
        </div>

        <button
          onClick={handleGonder}
          disabled={gonderiyor}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ backgroundColor: "var(--forest)" }}
        >
          {gonderiyor
            ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Gönderiliyor...</>
            : <><Send className="w-4 h-4" />Talep Gönder</>}
        </button>
      </div>

      {/* ── KART 4 — Geçmiş talepler ── */}
      <div className={KART + " space-y-3"} style={KART_STIL}>
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-800">Talep geçmişin</p>
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: "rgba(0,0,0,0.03)", border: "0.5px solid rgba(0,0,0,0.06)" }}>
            {(["tumu", "acik", "yanitlandi", "cozuldu", "kapali"] as const).map(f => (
              <button key={f} onClick={() => setFiltre(f as "tumu" | DestekDurum)}
                className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                style={{
                  backgroundColor: filtre === f ? "rgba(15,61,46,0.08)" : "transparent",
                  color:           filtre === f ? "var(--forest)"       : "#94a3b8",
                  border:          filtre === f ? "0.5px solid rgba(15,61,46,0.15)" : "0.5px solid transparent",
                }}>
                {f === "tumu" ? "Tümü" : DURUM_ETIKETLERI[f as DestekDurum]}
              </button>
            ))}
          </div>
        </div>

        {talepler.length === 0 ? (
          <div className="py-10 text-center space-y-2">
            <MessageCircle className="w-8 h-8 text-gray-300 mx-auto" />
            <p className="text-sm text-gray-400">Henüz destek talebin yok</p>
          </div>
        ) : gorununTalepler.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-400">Bu filtreyle eşleşen talep yok</p>
        ) : (
          <AnimatePresence mode="popLayout">
            {gorununTalepler.map((t, i) => {
              const durumRenk = DURUM_RENKLERI[t.durum];
              const okunmamis = !t.kullaniciOkundu;
              return (
                <motion.button
                  key={t.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => router.push(`/iletisim/${t.id}`)}
                  className="w-full rounded-xl overflow-hidden transition-colors text-left"
                  style={{
                    border:      okunmamis ? `1px solid ${durumRenk}30` : "0.5px solid rgba(0,0,0,0.06)",
                    borderLeft:  okunmamis ? `3px solid ${durumRenk}` : undefined,
                    marginBottom: 8,
                  }}
                >
                  <div className="flex items-center gap-3 px-4 py-3.5">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className={`text-sm truncate ${okunmamis ? "font-semibold text-gray-800" : "font-medium text-gray-600"}`}>
                          {t.konu}
                        </p>
                        {okunmamis && <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: durumRenk }} />}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                          style={{ color: durumRenk, backgroundColor: durumRenk + "20" }}>
                          {DURUM_ETIKETLERI[t.durum]}
                        </span>
                        <span className="text-[10px] text-gray-400">{KATEGORI_ETIKETLERI[t.kategori]}</span>
                        <span className="text-[10px]" style={{ color: ONCELIK_RENKLERI[t.oncelik] }}>
                          {ONCELIK_ETIKETLERI[t.oncelik]}
                        </span>
                        <span className="text-[10px] text-gray-400 flex items-center gap-0.5 ml-auto">
                          <Clock className="w-3 h-3" />{zaman(t.sonMesajTarihi)}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                  </div>
                </motion.button>
              );
            })}
          </AnimatePresence>
        )}
      </div>

    </div>
  );
}
