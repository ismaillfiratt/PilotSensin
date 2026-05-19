"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Send, Paperclip, X, Star, CheckCircle2,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useDestek } from "@/store/destek";
import {
  DURUM_ETIKETLERI, DURUM_RENKLERI, KATEGORI_ETIKETLERI, ONCELIK_ETIKETLERI,
  type DestekEk,
} from "@/lib/destek-data";

function zaman(iso: string) {
  const fark = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (fark < 1)    return "Az önce";
  if (fark < 60)   return `${fark}dk önce`;
  if (fark < 1440) return `${Math.floor(fark / 60)}sa önce`;
  return `${Math.floor(fark / 1440)}g önce`;
}

export default function IletisimDetayPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();
  const { talepler, mesajlar, mesajlarYukle, yeniMesaj, durumGuncelle, memnuniyetVer, kullaniciOkundu } = useDestek();

  const talep   = talepler.find(t => t.id === id) ?? null;
  const thread  = mesajlar[id] ?? [];

  const [kullaniciId,  setKullaniciId]  = useState<string | null>(null);
  const [cevap,        setCevap]        = useState("");
  const [gonderiyor,   setGonderiyor]   = useState(false);
  const [anketAcik,    setAnketAcik]    = useState(false);
  const [anketPuan,    setAnketPuan]    = useState(0);
  const [anketYorum,   setAnketYorum]   = useState("");
  const [dosyalar,     setDosyalar]     = useState<File[]>([]);
  const altRef   = useRef<HTMLDivElement>(null);
  const dosyaRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const sb = createClient();
      const { data: { user } } = await sb.auth.getUser();
      if (!user) { router.replace(`/giris?callbackUrl=/iletisim/${id}`); return; }
      setKullaniciId(user.id);
      await mesajlarYukle(id);
      await kullaniciOkundu(id);
    })();
  }, [id, router, mesajlarYukle, kullaniciOkundu]);

  // Realtime
  useEffect(() => {
    const sb = createClient();
    const { syncMesaj, taleplerYukle } = useDestek.getState();
    const kanal = sb.channel(`destek-${id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "destek_mesajlari", filter: `talep_id=eq.${id}` },
        p => syncMesaj({ id: p.new.id, talepId: p.new.talep_id, gonderenTip: p.new.gonderen_tip, gonderenId: p.new.gonderen_id, gonderenAd: p.new.gonderen_ad, mesaj: p.new.mesaj, ekler: p.new.ekler ?? [], icNot: p.new.ic_not, okundu: p.new.okundu, olusturma: p.new.olusturma }))
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "destek_talepleri", filter: `id=eq.${id}` },
        () => taleplerYukle())
      .subscribe();
    return () => { sb.removeChannel(kanal); };
  }, [id]);

  useEffect(() => {
    altRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread.length]);

  const handleGonder = async () => {
    if (!cevap.trim() && dosyalar.length === 0) return;
    setGonderiyor(true);
    try {
      const sb = createClient();
      const ekler: DestekEk[] = [];
      for (const d of dosyalar) {
        const yol = `${kullaniciId}/${Date.now()}-${d.name}`;
        const { data: y } = await sb.storage.from("destek-ekleri").upload(yol, d);
        if (y) {
          const { data: u } = sb.storage.from("destek-ekleri").getPublicUrl(y.path);
          ekler.push({ ad: d.name, url: u.publicUrl, boyut: d.size, tip: d.type });
        }
      }
      const yeni = await yeniMesaj(id, cevap.trim(), ekler);
      if (yeni) {
        await fetch("/api/destek/cevap", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ talepId: id, mesajId: yeni.id }),
        }).catch(() => {});
      }
      setCevap(""); setDosyalar([]);
    } finally {
      setGonderiyor(false);
    }
  };

  const handleCozuldu = async () => {
    await durumGuncelle(id, "cozuldu");
    await fetch("/api/destek/durum", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ talepId: id, yeniDurum: "cozuldu" }),
    }).catch(() => {});
    if (!talep?.memnuniyetPuan) setAnketAcik(true);
  };

  const handleAnket = async () => {
    if (anketPuan === 0) return;
    await memnuniyetVer(id, anketPuan, anketYorum || undefined);
    setAnketAcik(false);
  };

  if (!talep) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-gray-200 border-t-[var(--leaf)] rounded-full animate-spin" />
    </div>
  );

  const durumRenk  = DURUM_RENKLERI[talep.durum];
  const aktifMi    = ["acik", "inceleme", "cevap-bekliyor"].includes(talep.durum);

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-4 pb-24">

      {/* Üst bar */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/iletisim")}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-400 hover:text-gray-800 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <p className="text-sm font-bold text-gray-800 leading-snug">{talep.konu}</p>
            <p className="text-xs text-gray-500">#{id.slice(0, 8)} · {KATEGORI_ETIKETLERI[talep.kategori]} · {ONCELIK_ETIKETLERI[talep.oncelik]}</p>
          </div>
        </div>
        <span className="text-xs font-bold px-2.5 py-1 rounded-full shrink-0"
          style={{ color: durumRenk, backgroundColor: durumRenk + "20" }}>
          {DURUM_ETIKETLERI[talep.durum]}
        </span>
      </div>

      {/* Thread */}
      <div className="card rounded-2xl overflow-hidden">
        <div className="divide-y divide-gray-100">
          {thread.map((m) => {
            const benMi = m.gonderenTip === "kullanici";
            const sistemMi = m.gonderenTip === "sistem";
            if (sistemMi) return (
              <div key={m.id} className="px-4 py-3 text-center">
                <p className="text-xs text-gray-500">─── {m.mesaj} ───</p>
              </div>
            );
            return (
              <div key={m.id} className={`flex ${benMi ? "justify-end" : "justify-start"} px-4 py-3`}>
                <div className="max-w-[85%] space-y-1">
                  <div className="flex items-center gap-2">
                    {!benMi && <span className="text-[10px] font-semibold text-[var(--leaf)]">Destek Ekibi</span>}
                    {benMi && <span className="text-[10px] text-gray-500 ml-auto">Sen</span>}
                    <span className="text-[10px] text-gray-500">{zaman(m.olusturma)}</span>
                  </div>
                  <div className="px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed"
                    style={{
                      backgroundColor: benMi ? "var(--mint)" : "rgba(255,255,255,0.06)",
                      color:           benMi ? "#fde68a" : "#e2e8f0",
                      borderBottomRightRadius: benMi ? 4 : 16,
                      borderBottomLeftRadius:  benMi ? 16 : 4,
                    }}>
                    {m.mesaj}
                  </div>
                  {m.ekler.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {m.ekler.map((e, i) => (
                        <a key={i} href={e.url} target="_blank" rel="noreferrer"
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50 text-xs text-gray-400 hover:text-gray-800 transition-colors">
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
        {aktifMi ? (
          <div className="border-t border-gray-200 p-4 space-y-3">
            <textarea value={cevap} onChange={e => setCevap(e.target.value)} rows={3}
              placeholder="Cevap yaz..."
              className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder-[#475569] text-sm focus:outline-none focus:border-[var(--leaf)] transition-colors resize-none" />
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <input ref={dosyaRef} type="file" multiple accept="image/*,application/pdf,text/plain"
                  onChange={e => { setDosyalar(prev => [...prev, ...Array.from(e.target.files ?? [])].slice(0, 5)); e.target.value = ""; }}
                  className="hidden" />
                <button onClick={() => dosyaRef.current?.click()}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:text-[var(--leaf)] hover:border-[var(--forest-200, #B3E8C8)] transition-colors">
                  <Paperclip className="w-4 h-4" />
                </button>
                {dosyalar.map((d, i) => (
                  <span key={i} className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">
                    {d.name.slice(0, 12)}...
                    <button onClick={() => setDosyalar(p => p.filter((_, x) => x !== i))}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <button onClick={handleGonder} disabled={gonderiyor || (!cevap.trim() && dosyalar.length === 0)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--forest)] text-gray-800 text-sm font-bold hover:opacity-90 transition-colors disabled:opacity-50">
                {gonderiyor
                  ? <div className="w-4 h-4 border-2 border-[var(--forest)]/30 border-t-[var(--forest)] rounded-full animate-spin" />
                  : <Send className="w-4 h-4" />}
                Gönder
              </button>
            </div>
          </div>
        ) : (
          <div className="border-t border-gray-200 p-4 text-center">
            <p className="text-sm text-gray-500 mb-3">Bu talep {DURUM_ETIKETLERI[talep.durum].toLowerCase()}.</p>
            <button onClick={() => durumGuncelle(id, "acik")}
              className="px-4 py-2 rounded-xl border border-[var(--forest-200, #B3E8C8)] text-[var(--leaf)] text-sm font-semibold hover:bg-[var(--mint)] transition-colors">
              Yeniden Aç
            </button>
          </div>
        )}
      </div>

      {/* Çözüldü butonu */}
      {aktifMi && (
        <button onClick={handleCozuldu}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-[rgba(34,197,94,0.3)] text-[#22c55e] text-sm font-semibold hover:bg-[rgba(34,197,94,0.08)] transition-colors">
          <CheckCircle2 className="w-4 h-4" /> Talep Çözüldü Olarak İşaretle
        </button>
      )}

      {/* Memnuniyet anketi modali */}
      <AnimatePresence>
        {anketAcik && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setAnketAcik(false)}>
            <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 32 }} transition={{ duration: 0.2 }}
              className="w-full max-w-sm card rounded-2xl p-6 space-y-4">
              <h3 className="text-base font-bold text-gray-800 text-center">Yardımımız nasıldı?</h3>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map(p => (
                  <button key={p} onClick={() => setAnketPuan(p)}
                    className="transition-transform hover:scale-110 active:scale-95">
                    <Star className="w-8 h-8" fill={p <= anketPuan ? "var(--leaf)" : "none"}
                      strokeWidth={1.5} style={{ color: p <= anketPuan ? "var(--leaf)" : "#475569" }} />
                  </button>
                ))}
              </div>
              <textarea value={anketYorum} onChange={e => setAnketYorum(e.target.value)} rows={2}
                placeholder="İsteğe bağlı yorum..." maxLength={500}
                className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder-[#475569] text-sm focus:outline-none resize-none" />
              <div className="flex gap-3">
                <button onClick={() => setAnketAcik(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-400 text-sm hover:bg-gray-50 transition-colors">
                  Atla
                </button>
                <button onClick={handleAnket} disabled={anketPuan === 0}
                  className="flex-1 py-2.5 rounded-xl bg-[var(--forest)] text-gray-800 text-sm font-bold hover:opacity-90 transition-colors disabled:opacity-50">
                  Gönder
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
