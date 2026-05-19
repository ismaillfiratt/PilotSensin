"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Plus, Trash2, Pencil,
  Banknote, ArrowUpFromLine, Search, ChevronLeft, ChevronRight,
} from "lucide-react";
import { formatTL, type FonIslem } from "@/lib/acil-fon-data";
import { useAcilFon } from "@/store/acilFon";
import { onaylaSil } from "@/lib/onay";
import { useGeriAl } from "@/store/geriAl";
import IslemModal from "./IslemModal";

type Filtre = "tumu" | "yatirma" | "cekme";

const SAYFA_BOYUTU = 10;


export default function IslemGecmisi() {
  const { islemler, islemEkle, islemGuncelle, islemSil, aktifHedefId, hedefler } = useAcilFon();

  const [modalAcik, setModalAcik] = useState(false);
  const [duzenle,   setDuzenle]   = useState<FonIslem | null>(null);

  // Filtreler
  const [arama,     setArama]     = useState("");
  const [filtre,    setFiltre]    = useState<Filtre>("tumu");
  const [tarihBas,  setTarihBas]  = useState("");
  const [tarihBit,  setTarihBit]  = useState("");
  const [sayfaNo,   setSayfaNo]   = useState(1);

  const handleIslemSil = async (islem: FonIslem) => {
    const { onaylandi } = await onaylaSil({ tip: "acilFonIslem", isim: islem.aciklama || formatTL(islem.tutarKurus) });
    if (!onaylandi) return;
    await islemSil(islem.id);
    useGeriAl.getState().goster({
      mesaj: `İşlem silindi.`,
      sureMs: 10000,
      geriAlFn: async () => useAcilFon.getState().islemGeriAl(islem.id),
    });
  };

  const filtrelenmis = useMemo(() => {
    return [...islemler]
      .filter(i => aktifHedefId ? i.hedefId === aktifHedefId : true)
      .filter(i => filtre === "tumu" || i.tip === filtre)
      .filter(i => !arama || (i.aciklama ?? "").toLowerCase().includes(arama.toLowerCase()))
      .filter(i => {
        if (!tarihBas && !tarihBit) return true;
        const t = new Date(i.tarih);
        const bas = tarihBas ? new Date(tarihBas) : null;
        const bit = tarihBit ? new Date(tarihBit + "T23:59:59") : null;
        return (!bas || t >= bas) && (!bit || t <= bit);
      })
      .sort((a, b) => new Date(b.tarih).getTime() - new Date(a.tarih).getTime());
  }, [islemler, aktifHedefId, filtre, arama, tarihBas, tarihBit]);

  const toplamSayfa  = Math.max(1, Math.ceil(filtrelenmis.length / SAYFA_BOYUTU));
  const sayfaIslemler = filtrelenmis.slice((sayfaNo - 1) * SAYFA_BOYUTU, sayfaNo * SAYFA_BOYUTU);

  const setFiltreSayfa = (f: Filtre) => { setFiltre(f); setSayfaNo(1); };
  const setAramaSayfa  = (v: string) => { setArama(v); setSayfaNo(1); };

  const tarihFormat = (iso: string) =>
    new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" });

  const handleKaydet = (yeni: Omit<FonIslem, "id">) => {
    if (duzenle) { islemGuncelle(duzenle.id, yeni); setDuzenle(null); }
    else          { islemEkle(yeni); }
  };

  return (
    <>
      <div className="card rounded-2xl overflow-hidden">

        {/* ÜST — arama + filtreler + ekle */}
        <div className="px-5 py-4 border-b border-gray-200 space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            {/* Arama */}
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={arama} onChange={(e) => setAramaSayfa(e.target.value)}
                placeholder="Açıklama ara..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 text-sm focus:outline-none focus:border-[var(--leaf)] transition-colors"
              />
            </div>
            {/* Tip filtresi */}
            <div className="flex gap-1 p-1 rounded-xl bg-gray-50 border border-gray-200">
              {([
                { v: "tumu",    l: "Tümü"    },
                { v: "yatirma", l: "Yatırma" },
                { v: "cekme",   l: "Çekme"   },
              ] as { v: Filtre; l: string }[]).map(({ v, l }) => (
                <button key={v} onClick={() => setFiltreSayfa(v)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    backgroundColor: filtre === v ? "var(--mint)" : "transparent",
                    color:           filtre === v ? "var(--leaf)" : "#94a3b8",
                    border:          filtre === v ? "1px solid var(--forest-200, #B3E8C8)" : "1px solid transparent",
                  }}>
                  {l}
                </button>
              ))}
            </div>
            {/* Ekle butonu */}
            <button
              onClick={() => { setDuzenle(null); setModalAcik(true); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--forest)] text-white text-sm font-bold hover:opacity-90 transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" /> Hareket Ekle
            </button>
          </div>

          {/* Tarih aralığı */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-400">Tarih:</span>
            <input type="date" value={tarihBas} onChange={(e) => { setTarihBas(e.target.value); setSayfaNo(1); }}
              className="px-2 py-1 rounded-lg bg-gray-50 border border-gray-200 text-gray-800 text-xs focus:outline-none focus:border-[var(--leaf)] scheme-dark" />
            <span className="text-gray-400 text-xs">—</span>
            <input type="date" value={tarihBit} onChange={(e) => { setTarihBit(e.target.value); setSayfaNo(1); }}
              className="px-2 py-1 rounded-lg bg-gray-50 border border-gray-200 text-gray-800 text-xs focus:outline-none focus:border-[var(--leaf)] scheme-dark" />
            {(tarihBas || tarihBit) && (
              <button onClick={() => { setTarihBas(""); setTarihBit(""); setSayfaNo(1); }}
                className="text-xs text-gray-400 hover:text-gray-800 transition-colors px-2 py-0.5 rounded-lg border border-gray-200 hover:border-gray-200">
                Temizle
              </button>
            )}
            <span className="text-xs text-gray-400 ml-auto">{filtrelenmis.length} kayıt</span>
          </div>
        </div>

        {/* Tablo başlıkları */}
        <div className="grid grid-cols-[44px_140px_1fr_1fr_120px_80px] gap-3 px-5 py-3 border-b border-gray-200 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          <span>Tip</span>
          <span>Hedef</span>
          <span>Açıklama</span>
          <span>Tarih</span>
          <span className="text-right">Tutar</span>
          <span className="text-right">İşlem</span>
        </div>

        {/* Satırlar */}
        <div className="divide-y divide-gray-100 min-h-[120px]">
          {sayfaIslemler.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-sm">
              {filtrelenmis.length === 0 && islemler.length > 0 ? "Filtre sonucu bulunamadı." : "Henüz işlem yok."}
            </div>
          ) : (
            sayfaIslemler.map((islem, i) => {
              const yatirmaMi = islem.tip === "yatirma";
              const hedefAdi  = islem.hedefId
                ? hedefler.find(h => h.id === islem.hedefId)?.ad ?? null
                : null;
              return (
                <motion.div
                  key={islem.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="grid grid-cols-[44px_140px_1fr_1fr_120px_80px] gap-3 px-5 py-3.5 items-center hover:bg-[var(--mint)] transition-colors"
                >
                  {/* Tip */}
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: yatirmaMi ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)" }}>
                    {yatirmaMi
                      ? <Banknote className="w-4 h-4 text-[#22c55e]" />
                      : <ArrowUpFromLine className="w-4 h-4 text-[#ef4444]" />}
                  </div>

                  {/* Hedef adı */}
                  {hedefAdi ? (
                    <span
                      className="text-xs font-semibold px-2 py-1 rounded-lg truncate"
                      style={{ backgroundColor: "var(--mint)", color: "var(--leaf)", border: "1px solid var(--forest-200, #B3E8C8)" }}
                    >
                      {hedefAdi}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-500">—</span>
                  )}

                  {/* Açıklama */}
                  <p className="text-sm text-gray-800 font-medium truncate">{islem.aciklama || "—"}</p>

                  {/* Tarih */}
                  <p className="text-xs text-gray-400">{tarihFormat(islem.tarih)}</p>

                  {/* Tutar */}
                  <p className="text-sm font-bold text-right whitespace-nowrap" style={{ color: yatirmaMi ? "#22c55e" : "#ef4444" }}>
                    {yatirmaMi ? "+" : "-"}{formatTL(islem.tutarKurus)}
                  </p>

                  {/* Aksiyonlar */}
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => { setDuzenle(islem); setModalAcik(true); }}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 border border-gray-200 hover:border-[var(--forest-300, #7DD0A0)] hover:text-[var(--leaf)] transition-all">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleIslemSil(islem)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 border border-gray-200 hover:border-[rgba(239,68,68,0.4)] hover:text-[#ef4444] transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* ALT — sayfalama */}
        {toplamSayfa > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-200">
            <span className="text-xs text-gray-400">
              {(sayfaNo - 1) * SAYFA_BOYUTU + 1}–{Math.min(sayfaNo * SAYFA_BOYUTU, filtrelenmis.length)} / {filtrelenmis.length} kayıt
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => setSayfaNo(p => Math.max(1, p - 1))} disabled={sayfaNo === 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:text-gray-800 hover:border-gray-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(toplamSayfa, 5) }, (_, i) => {
                const p = toplamSayfa <= 5 ? i + 1
                  : sayfaNo <= 3 ? i + 1
                  : sayfaNo >= toplamSayfa - 2 ? toplamSayfa - 4 + i
                  : sayfaNo - 2 + i;
                return (
                  <button key={p} onClick={() => setSayfaNo(p)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium transition-all border"
                    style={{
                      borderColor:     sayfaNo === p ? "var(--leaf)" : "rgba(255,255,255,0.08)",
                      backgroundColor: sayfaNo === p ? "var(--mint)" : "transparent",
                      color:           sayfaNo === p ? "var(--leaf)" : "#94a3b8",
                    }}>
                    {p}
                  </button>
                );
              })}
              <button onClick={() => setSayfaNo(p => Math.min(toplamSayfa, p + 1))} disabled={sayfaNo === toplamSayfa}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:text-gray-800 hover:border-gray-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      <IslemModal
        open={modalAcik || duzenle !== null}
        onClose={() => { setModalAcik(false); setDuzenle(null); }}
        mevcutIslem={duzenle ?? undefined}
        defaultHedefId={aktifHedefId}
        onKaydet={handleKaydet}
      />
    </>
  );
}
