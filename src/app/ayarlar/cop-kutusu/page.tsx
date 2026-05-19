"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trash2, RotateCcw, Search, CheckSquare, Square,
  AlertTriangle, Package, Wallet, ShoppingCart, CheckCircle2,
  ClipboardCheck, Shield, TrendingDown, Bell, X,
} from "lucide-react";
import { useTumSilinenler, type SilinmisOge } from "@/lib/selectors/cop";
import { onaylaSil } from "@/lib/onay";
import { useOnay } from "@/store/onay";
import type { SilinebilirTip } from "@/lib/silinebilir";

/* ── Modül filtre tanımları ─────────────────────────────────────────────── */
const MODUL_FILTRELERI: { label: string; tipler: SilinebilirTip[]; Icon: typeof Trash2 }[] = [
  { label: "Tümü",            tipler: [],                                                    Icon: Trash2         },
  { label: "Stok",            tipler: ["urun", "stokHareketi"],                              Icon: Package        },
  { label: "Nakit",           tipler: ["nakitIslem", "kdvKaydi"],                            Icon: Wallet         },
  { label: "Satış",           tipler: ["satisKaydi"],                                        Icon: ShoppingCart   },
  { label: "Görev",           tipler: ["gorev"],                                             Icon: CheckCircle2   },
  { label: "Prosedür",        tipler: ["prosedur", "checklistMaddesi"],                      Icon: ClipboardCheck },
  { label: "Acil Fon",        tipler: ["acilFonHedef", "acilFonIslem"],                      Icon: Shield         },
  { label: "Gider",           tipler: ["isletmeGideri"],                                     Icon: TrendingDown   },
  { label: "Bildirim",        tipler: ["bildirim"],                                          Icon: Bell           },
];

function tarihEtiket(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function kalan30Gun(iso: string) {
  const kalan = Math.max(0, 30 - Math.floor((Date.now() - new Date(iso).getTime()) / 86400000));
  return kalan;
}

export default function CopKutusuPage() {
  const tumSilinenler = useTumSilinenler();
  const { ac: onayAc } = useOnay();

  const [aramaMetni,    setAramaMetni]    = useState("");
  const [modulFiltre,   setModulFiltre]   = useState<SilinebilirTip[]>([]);
  const [seciliIdler,   setSeciliIdler]   = useState<Set<string>>(new Set());

  /* Filtrelenmiş liste */
  const filtrelenmis = useMemo(() => {
    return tumSilinenler.filter((oge) => {
      const tipUyum    = modulFiltre.length === 0 || modulFiltre.includes(oge.tip);
      const aramaUyum  = aramaMetni === "" ||
        oge.isim.toLowerCase().includes(aramaMetni.toLowerCase()) ||
        oge.modulAdi.toLowerCase().includes(aramaMetni.toLowerCase());
      return tipUyum && aramaUyum;
    });
  }, [tumSilinenler, modulFiltre, aramaMetni]);

  /* Tümünü seç / bırak */
  const tumunuSec = () => {
    if (seciliIdler.size === filtrelenmis.length) {
      setSeciliIdler(new Set());
    } else {
      setSeciliIdler(new Set(filtrelenmis.map((x) => x.id)));
    }
  };

  const toggleSec = (id: string) => {
    setSeciliIdler((prev) => {
      const yeni = new Set(prev);
      yeni.has(id) ? yeni.delete(id) : yeni.add(id);
      return yeni;
    });
  };

  /* Tekli geri yükle */
  const geriYukle = async (oge: SilinmisOge) => {
    await oge.geriAlFn();
  };

  /* Tekli kalıcı sil */
  const kaliciSil = async (oge: SilinmisOge) => {
    const { onaylandi } = await onayAc({
      tip: oge.tip,
      isim: oge.isim,
      kaskadBaglıSayisi: 0,
      onayMetni: "Kalıcı Sil",
      iptalMetni: "Vazgeç",
    });
    if (!onaylandi) return;
    await oge.kaliciSilFn();
    setSeciliIdler((p) => { const s = new Set(p); s.delete(oge.id); return s; });
  };

  /* Toplu geri yükle */
  const topluGeriYukle = async () => {
    const secili = filtrelenmis.filter((x) => seciliIdler.has(x.id));
    const { onaylandi } = await onayAc({
      tip: "nakitIslem",
      isim: `${secili.length} kayıt`,
      kaskadBaglıSayisi: 0,
      onayMetni: "Geri Yükle",
      iptalMetni: "Vazgeç",
    });
    if (!onaylandi) return;
    await Promise.all(secili.map((x) => x.geriAlFn()));
    setSeciliIdler(new Set());
  };

  /* Toplu kalıcı sil */
  const topluKaliciSil = async () => {
    const secili = filtrelenmis.filter((x) => seciliIdler.has(x.id));
    const { onaylandi } = await onayAc({
      tip: "nakitIslem",
      isim: `${secili.length} kayıt`,
      kaskadBaglıSayisi: 0,
      onayMetni: "Kalıcı Sil",
      iptalMetni: "Vazgeç",
    });
    if (!onaylandi) return;
    await Promise.all(secili.map((x) => x.kaliciSilFn()));
    setSeciliIdler(new Set());
  };

  /* Tümünü kalıcı sil */
  const tumunuKaliciSil = async () => {
    const { onaylandi } = await onayAc({
      tip: "nakitIslem",
      isim: `çöp kutusundaki tüm ${tumSilinenler.length} kayıt`,
      kaskadBaglıSayisi: 0,
      onayMetni: "Tümünü Kalıcı Sil",
      iptalMetni: "Vazgeç",
    });
    if (!onaylandi) return;
    await Promise.all(tumSilinenler.map((x) => x.kaliciSilFn()));
    setSeciliIdler(new Set());
  };

  const hepsSecili = filtrelenmis.length > 0 && seciliIdler.size === filtrelenmis.length;

  return (
    <div className="max-w-4xl mx-auto space-y-5">

      {/* Başlık */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">Çöp Kutusu</h1>
        <p className="text-xs md:text-sm text-gray-400 mt-1">
          Silinen kayıtlar 30 gün burada kalır, sonra otomatik silinir
        </p>
      </div>

      {/* Filtre chipleri */}
      <div className="flex gap-2 overflow-x-auto pb-1">
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
                borderColor:     aktif ? "var(--leaf)" : "rgba(255,255,255,0.08)",
                backgroundColor: aktif ? "var(--mint)" : "transparent",
                color:           aktif ? "var(--leaf)" : "#94a3b8",
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
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder="Kayıt veya modül ara…"
          value={aramaMetni}
          onChange={(e) => setAramaMetni(e.target.value)}
          className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder-[#475569] text-sm focus:outline-none focus:border-[var(--leaf)] transition-colors"
        />
        {aramaMetni && (
          <button onClick={() => setAramaMetni("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800 transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Toplu işlem çubuğu */}
      <AnimatePresence>
        {seciliIdler.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-2xl card border border-[var(--forest-100, #D9F2E4)]"
          >
            <span className="text-sm font-semibold text-[var(--leaf)]">
              {seciliIdler.size} öğe seçili
            </span>
            <div className="flex gap-2 ml-auto flex-wrap">
              <button onClick={topluGeriYukle}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[rgba(34,197,94,0.12)] text-[#22c55e] border border-[rgba(34,197,94,0.25)] hover:bg-[rgba(34,197,94,0.2)] transition-colors">
                <RotateCcw className="w-3.5 h-3.5" />Seçilenleri Geri Yükle
              </button>
              <button onClick={topluKaliciSil}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[rgba(239,68,68,0.12)] text-[#ef4444] border border-[rgba(239,68,68,0.25)] hover:bg-[rgba(239,68,68,0.2)] transition-colors">
                <Trash2 className="w-3.5 h-3.5" />Seçilenleri Kalıcı Sil
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Boş durum */}
      {tumSilinenler.length === 0 && (
        <div className="card rounded-2xl py-20 text-center space-y-3">
          <Trash2 className="w-12 h-12 text-gray-600 mx-auto" />
          <p className="text-sm font-semibold text-gray-500">Çöp kutusu boş</p>
          <p className="text-xs text-gray-500">Sildiğin kayıtlar burada görünür</p>
        </div>
      )}

      {/* Liste */}
      {filtrelenmis.length > 0 && (
        <div className="card rounded-2xl overflow-hidden">
          {/* Tümünü seç satırı */}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-200">
            <button onClick={tumunuSec} className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-800 transition-colors">
              {hepsSecili
                ? <CheckSquare className="w-4 h-4 text-[var(--leaf)]" />
                : <Square className="w-4 h-4" />}
              Tümünü Seç ({filtrelenmis.length})
            </button>
          </div>

          <div className="divide-y divide-white/4">
            <AnimatePresence mode="popLayout">
              {filtrelenmis.map((oge, i) => {
                const secili  = seciliIdler.has(oge.id);
                const kalan   = kalan30Gun(oge.silinmeTarihi);
                const acil    = kalan <= 3;
                return (
                  <motion.div
                    key={oge.id}
                    layout
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20, height: 0 }}
                    transition={{ duration: 0.18, delay: i * 0.02 }}
                    className="flex items-start gap-3 px-5 py-4 hover:bg-gray-100 transition-colors"
                    style={{ backgroundColor: secili ? "var(--mint)" : undefined }}
                  >
                    {/* Checkbox */}
                    <button onClick={() => toggleSec(oge.id)} className="mt-0.5 shrink-0">
                      {secili
                        ? <CheckSquare className="w-4 h-4 text-[var(--leaf)]" />
                        : <Square className="w-4 h-4 text-gray-500" />}
                    </button>

                    {/* İçerik */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="text-sm font-semibold text-gray-800 truncate">{oge.isim}</span>
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

                    {/* Aksiyonlar */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => geriYukle(oge)}
                        title="Geri Yükle"
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#22c55e] bg-[rgba(34,197,94,0.08)] border border-[rgba(34,197,94,0.2)] hover:bg-[rgba(34,197,94,0.15)] transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span className="hidden sm:inline">Geri Yükle</span>
                      </button>
                      <button
                        onClick={() => kaliciSil(oge)}
                        title="Kalıcı Sil"
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-[#ef4444] hover:bg-[rgba(239,68,68,0.08)] transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Tümünü Kalıcı Sil */}
      {tumSilinenler.length > 0 && (
        <div className="flex justify-end pt-2">
          <button
            onClick={tumunuKaliciSil}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-[#ef4444] border border-[rgba(239,68,68,0.25)] hover:bg-[rgba(239,68,68,0.08)] transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Tümünü Kalıcı Sil ({tumSilinenler.length})
          </button>
        </div>
      )}
    </div>
  );
}
