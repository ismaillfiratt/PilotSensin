"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trash2, RotateCcw, Search, CheckSquare, Square,
  AlertTriangle, Package, Wallet, ShoppingCart, CheckCircle2,
  ClipboardCheck, Shield, TrendingDown, Bell, X,
} from "lucide-react";
import { useTumSilinenler, type SilinmisOge } from "@/lib/selectors/cop";
import { useOnay }    from "@/store/onay";
import type { SilinebilirTip } from "@/lib/silinebilir";

const MODUL_FILTRELERI: { label: string; tipler: SilinebilirTip[]; Icon: typeof Trash2 }[] = [
  { label: "Tümü",     tipler: [],                                               Icon: Trash2         },
  { label: "Stok",     tipler: ["urun", "stokHareketi"],                         Icon: Package        },
  { label: "Nakit",    tipler: ["nakitIslem", "kdvKaydi"],                       Icon: Wallet         },
  { label: "Satış",    tipler: ["satisKaydi"],                                   Icon: ShoppingCart   },
  { label: "Görev",    tipler: ["gorev"],                                         Icon: CheckCircle2   },
  { label: "Prosedür", tipler: ["prosedur", "checklistMaddesi"],                 Icon: ClipboardCheck },
  { label: "Acil Fon", tipler: ["acilFonHedef", "acilFonIslem"],                 Icon: Shield         },
  { label: "Gider",    tipler: ["isletmeGideri"],                                Icon: TrendingDown   },
  { label: "Bildirim", tipler: ["bildirim"],                                     Icon: Bell           },
];

function tarihEtiket(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function kalan30Gun(iso: string) {
  return Math.max(0, 30 - Math.floor((Date.now() - new Date(iso).getTime()) / 86400000));
}

const KART      = "bg-white rounded-xl";
const KART_STIL = { border: "0.5px solid rgba(0,0,0,0.08)" };

export default function CopKutusuPanel() {
  const tumSilinenler = useTumSilinenler();
  const { ac: onayAc } = useOnay();

  const [aramaMetni,  setAramaMetni]  = useState("");
  const [modulFiltre, setModulFiltre] = useState<SilinebilirTip[]>([]);
  const [seciliIdler, setSeciliIdler] = useState<Set<string>>(new Set());

  const filtrelenmis = useMemo(() => {
    return tumSilinenler.filter((oge) => {
      const tipUyum   = modulFiltre.length === 0 || modulFiltre.includes(oge.tip);
      const aramaUyum = aramaMetni === "" ||
        oge.isim.toLowerCase().includes(aramaMetni.toLowerCase()) ||
        oge.modulAdi.toLowerCase().includes(aramaMetni.toLowerCase());
      return tipUyum && aramaUyum;
    });
  }, [tumSilinenler, modulFiltre, aramaMetni]);

  const hepsSecili = filtrelenmis.length > 0 && seciliIdler.size === filtrelenmis.length;

  const tumunuSec = () => {
    setSeciliIdler(hepsSecili ? new Set() : new Set(filtrelenmis.map((x) => x.id)));
  };

  const toggleSec = (id: string) => {
    setSeciliIdler((prev) => {
      const yeni = new Set(prev);
      yeni.has(id) ? yeni.delete(id) : yeni.add(id);
      return yeni;
    });
  };

  const geriYukle = async (oge: SilinmisOge) => { await oge.geriAlFn(); };

  const kaliciSil = async (oge: SilinmisOge) => {
    const { onaylandi } = await onayAc({
      tip: oge.tip, isim: oge.isim, kaskadBaglıSayisi: 0,
      onayMetni: "Kalıcı Sil", iptalMetni: "Vazgeç",
    });
    if (!onaylandi) return;
    await oge.kaliciSilFn();
    setSeciliIdler((p) => { const s = new Set(p); s.delete(oge.id); return s; });
  };

  const topluGeriYukle = async () => {
    const secili = filtrelenmis.filter((x) => seciliIdler.has(x.id));
    const { onaylandi } = await onayAc({
      tip: "nakitIslem", isim: `${secili.length} kayıt`, kaskadBaglıSayisi: 0,
      onayMetni: "Geri Yükle", iptalMetni: "Vazgeç",
    });
    if (!onaylandi) return;
    await Promise.all(secili.map((x) => x.geriAlFn()));
    setSeciliIdler(new Set());
  };

  const topluKaliciSil = async () => {
    const secili = filtrelenmis.filter((x) => seciliIdler.has(x.id));
    const { onaylandi } = await onayAc({
      tip: "nakitIslem", isim: `${secili.length} kayıt`, kaskadBaglıSayisi: 0,
      onayMetni: "Kalıcı Sil", iptalMetni: "Vazgeç",
    });
    if (!onaylandi) return;
    await Promise.all(secili.map((x) => x.kaliciSilFn()));
    setSeciliIdler(new Set());
  };

  const silHandler = async () => {
    const silinecek = seciliIdler.size > 0
      ? tumSilinenler.filter((o) => seciliIdler.has(o.id))
      : filtrelenmis;
    if (silinecek.length === 0) return;
    const { onaylandi } = await onayAc({
      tip: "nakitIslem", isim: `${silinecek.length} kayıt`,
      kaskadBaglıSayisi: 0, onayMetni: "Kalıcı Sil", iptalMetni: "Vazgeç",
    });
    if (!onaylandi) return;
    await Promise.all(silinecek.map((o) => o.kaliciSilFn()));
    setSeciliIdler(new Set());
  };

  return (
    <div className="space-y-4">

      {/* Panel başlık */}
      <div>
        <p className="label-caps">VERİ YÖNETİMİ</p>
        <h2 className="text-xl font-medium text-gray-900 mt-1">Çöp Kutusu</h2>
        <p className="text-sm text-gray-500 mt-1">
          Silinen kayıtları görüntüle, geri yükle veya kalıcı olarak sil — 30 gün boyunca saklanır
        </p>
      </div>

      {/* ── KART 1 — Filtre & Arama ── */}
      <div className={KART + " p-4 space-y-3"} style={KART_STIL}>
        {/* Modül pilleri */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {MODUL_FILTRELERI.map(({ label, tipler, Icon }) => {
            const aktif = tipler.length === 0
              ? modulFiltre.length === 0
              : tipler.every((t) => modulFiltre.includes(t));
            return (
              <button
                key={label}
                onClick={() => setModulFiltre(tipler)}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all"
                style={{
                  borderColor:     aktif ? "var(--forest)" : "rgba(0,0,0,0.1)",
                  backgroundColor: aktif ? "rgba(15,61,46,0.08)" : "transparent",
                  color:           aktif ? "var(--forest)" : "#94a3b8",
                }}
              >
                <Icon className="w-3 h-3" />
                {label}
              </button>
            );
          })}
        </div>

        {/* Arama */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Kayıt veya modül ara…"
            value={aramaMetni}
            onChange={(e) => setAramaMetni(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 rounded-xl text-sm focus:outline-none transition-colors"
            style={{
              background:   "var(--bg-secondary, #F8FAFC)",
              border:       "0.5px solid rgba(0,0,0,0.1)",
              color:        "var(--text-primary, #0F172A)",
            }}
          />
          {aramaMetni && (
            <button onClick={() => setAramaMetni("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── KART 2 — Toplu işlem bar (koşullu) ── */}
      <AnimatePresence>
        {seciliIdler.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className={KART + " p-4 flex flex-wrap items-center gap-3"}
            style={{ ...KART_STIL, background: "rgba(15,61,46,0.04)", border: "0.5px solid rgba(15,61,46,0.15)" }}
          >
            <span className="text-sm font-semibold" style={{ color: "var(--forest)" }}>
              {seciliIdler.size} öğe seçili
            </span>
            <div className="flex gap-2 ml-auto flex-wrap">
              <button onClick={topluGeriYukle}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                style={{ background: "rgba(34,197,94,0.1)", color: "#16a34a", border: "0.5px solid rgba(34,197,94,0.25)" }}>
                <RotateCcw className="w-3.5 h-3.5" />Seçilenleri Geri Yükle
              </button>
              <button onClick={topluKaliciSil}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "0.5px solid rgba(239,68,68,0.25)" }}>
                <Trash2 className="w-3.5 h-3.5" />Seçilenleri Kalıcı Sil
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── KART 3 — Liste veya boş durum ── */}
      {tumSilinenler.length === 0 ? (
        <div className={KART + " py-16 text-center space-y-3"} style={KART_STIL}>
          <Trash2 className="w-10 h-10 text-gray-300 mx-auto" />
          <p className="text-sm font-medium text-gray-500">Çöp kutusu boş</p>
          <p className="text-xs text-gray-400">Sildiğin kayıtlar burada görünür</p>
        </div>
      ) : filtrelenmis.length === 0 ? (
        <div className={KART + " py-12 text-center"} style={KART_STIL}>
          <p className="text-sm text-gray-400">Arama veya filtreyle eşleşen kayıt yok</p>
        </div>
      ) : (
        <div className={KART + " overflow-hidden"} style={{ ...KART_STIL, padding: 0 }}>
          {/* Tümünü seç başlık satırı */}
          <div
            className="flex items-center justify-between px-5 py-3"
            style={{ borderBottom: "0.5px solid rgba(0,0,0,0.06)" }}
          >
            <button
              onClick={tumunuSec}
              className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              {hepsSecili
                ? <CheckSquare className="w-4 h-4" style={{ color: "var(--forest)" }} />
                : <Square className="w-4 h-4" />}
              Tümünü Seç ({filtrelenmis.length})
            </button>
          </div>

          {/* Satırlar */}
          <AnimatePresence mode="popLayout">
            {filtrelenmis.map((oge, i) => {
              const secili = seciliIdler.has(oge.id);
              const kalan  = kalan30Gun(oge.silinmeTarihi);
              const acil   = kalan <= 3;
              return (
                <motion.div
                  key={oge.id}
                  layout
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20, height: 0 }}
                  transition={{ duration: 0.18, delay: i * 0.02 }}
                  className="flex items-start gap-3 px-5 py-4 transition-colors"
                  style={{
                    borderTop:       i > 0 ? "0.5px solid rgba(0,0,0,0.05)" : undefined,
                    backgroundColor: secili ? "rgba(15,61,46,0.05)" : undefined,
                  }}
                >
                  <button onClick={() => toggleSec(oge.id)} className="mt-0.5 shrink-0">
                    {secili
                      ? <CheckSquare className="w-4 h-4" style={{ color: "var(--forest)" }} />
                      : <Square className="w-4 h-4 text-gray-400" />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="text-sm font-medium text-gray-800 truncate">{oge.isim}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-400 shrink-0">
                        {oge.modulAdi}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
                      <span>{tarihEtiket(oge.silinmeTarihi)}</span>
                      {oge.silenKullaniciAd && <span>· {oge.silenKullaniciAd}</span>}
                      <span className={`font-medium ${acil ? "text-[#ef4444]" : "text-gray-400"}`}>
                        {acil && <AlertTriangle className="w-3 h-3 inline mr-0.5" />}
                        {kalan} gün kaldı
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => geriYukle(oge)}
                      title="Geri Yükle"
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                      style={{ background: "rgba(34,197,94,0.08)", color: "#16a34a", border: "0.5px solid rgba(34,197,94,0.2)" }}
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span className="hidden sm:inline">Geri Yükle</span>
                    </button>
                    <button
                      onClick={() => kaliciSil(oge)}
                      title="Kalıcı Sil"
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-[#ef4444] hover:bg-[rgba(239,68,68,0.08)] transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Tümünü / Seçilenleri kalıcı sil */}
      {filtrelenmis.length > 0 && (
        <div className="flex justify-end pt-1">
          <button
            onClick={silHandler}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
            style={{ color: "#ef4444", border: "0.5px solid rgba(239,68,68,0.25)" }}
          >
            <Trash2 className="w-4 h-4" />
            {seciliIdler.size > 0
              ? `Seçilenleri Kalıcı Sil (${seciliIdler.size})`
              : `Tümünü Kalıcı Sil (${filtrelenmis.length})`}
          </button>
        </div>
      )}

    </div>
  );
}
