"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Plus, Trash2, Pencil,
  ArrowDown, ArrowUp, Search, Calendar,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import { formatTL, type FonIslem } from "@/lib/acil-fon-data";
import { useAcilFon } from "@/store/acilFon";
import { onaylaSil } from "@/lib/onay";
import { useGeriAl } from "@/store/geriAl";
import IslemModal from "./IslemModal";

type Filtre = "tumu" | "yatirma" | "cekme";

const SAYFA_BOYUTU = 10;

export default function IslemGecmisi() {
  const { islemler, islemEkle, islemGuncelle, islemSil, hedefler } = useAcilFon();

  const [modalAcik,   setModalAcik]   = useState(false);
  const [duzenle,     setDuzenle]     = useState<FonIslem | null>(null);
  const [hedefFiltre, setHedefFiltre] = useState<string | null>(null);

  const [arama,     setArama]     = useState("");
  const [filtre,    setFiltre]    = useState<Filtre>("tumu");
  const [tarihBas,  setTarihBas]  = useState("");
  const [tarihBit,  setTarihBit]  = useState("");
  const [sayfaNo,   setSayfaNo]   = useState(1);
  const [tarihAcik, setTarihAcik] = useState(false);

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
      .filter(i => !i.silindi)
      .filter(i => hedefFiltre ? i.hedefId === hedefFiltre : true)
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
  }, [islemler, hedefFiltre, filtre, arama, tarihBas, tarihBit]);

  const toplamSayfa   = Math.max(1, Math.ceil(filtrelenmis.length / SAYFA_BOYUTU));
  const sayfaIslemler = filtrelenmis.slice((sayfaNo - 1) * SAYFA_BOYUTU, sayfaNo * SAYFA_BOYUTU);

  const setFiltreSayfa = (f: Filtre) => { setFiltre(f); setSayfaNo(1); };
  const setAramaSayfa  = (v: string) => { setArama(v); setSayfaNo(1); };

  const tarihFormat = (iso: string) =>
    new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" });

  const handleKaydet = (yeni: Omit<FonIslem, "id">) => {
    if (duzenle) { islemGuncelle(duzenle.id, yeni); setDuzenle(null); }
    else          { islemEkle(yeni); }
  };

  const tarihAktif = !!(tarihBas || tarihBit);

  return (
    <>
      <div
        className="rounded-xl overflow-hidden"
        style={{
          background: "var(--bg-card)",
          border: "0.5px solid var(--border-default)",
        }}
      >
        {/* ÜST — tek satır toolbar */}
        <div className="px-5 py-4" style={{ borderBottom: "0.5px solid var(--border-default)" }}>
          <div className="flex items-center gap-2 flex-wrap">

            {/* Arama */}
            <div className="relative flex-1 min-w-44">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: "var(--text-tertiary)" }}
              />
              <input
                value={arama}
                onChange={e => setAramaSayfa(e.target.value)}
                placeholder="Açıklama ara..."
                className="w-full pl-9 pr-3 py-2 rounded-lg text-sm focus:outline-none"
                style={{
                  background: "var(--bg-input)",
                  border: "0.5px solid var(--border-default)",
                  color: "var(--text-primary)",
                }}
              />
            </div>

            {/* Tip dropdown */}
            <select
              value={filtre}
              onChange={e => setFiltreSayfa(e.target.value as Filtre)}
              className="px-3 py-2 rounded-lg text-sm focus:outline-none cursor-pointer"
              style={{
                background: "var(--bg-input)",
                border: "0.5px solid var(--border-default)",
                color: "var(--text-primary)",
              }}
            >
              <option value="tumu">Tüm Tipler</option>
              <option value="yatirma">Yatırma</option>
              <option value="cekme">Çekme</option>
            </select>

            {/* Hedef dropdown */}
            {hedefler.filter(h => !h.silindi).length > 0 && (
              <select
                value={hedefFiltre ?? ""}
                onChange={e => { setHedefFiltre(e.target.value || null); setSayfaNo(1); }}
                className="px-3 py-2 rounded-lg text-sm focus:outline-none cursor-pointer"
                style={{
                  background: "var(--bg-input)",
                  border: "0.5px solid var(--border-default)",
                  color: "var(--text-primary)",
                  maxWidth: 180,
                }}
              >
                <option value="">Tüm Hedefler</option>
                {hedefler.filter(h => !h.silindi).map(h => (
                  <option key={h.id} value={h.id}>{h.ad}</option>
                ))}
              </select>
            )}

            {/* Tarih butonu — dropdown panel açar */}
            <div className="relative">
              <button
                onClick={() => setTarihAcik(p => !p)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors"
                style={{
                  background: tarihAktif ? "var(--mint)" : "var(--bg-input)",
                  border: "0.5px solid var(--border-default)",
                  color: tarihAktif ? "var(--leaf)" : "var(--text-primary)",
                }}
              >
                <Calendar className="w-3.5 h-3.5" />
                Tarih
                {tarihAktif && <span className="text-[10px] font-semibold">●</span>}
              </button>

              {tarihAcik && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setTarihAcik(false)} />
                  <div
                    className="absolute right-0 top-full mt-1 z-20 rounded-lg p-3 shadow-lg w-64"
                    style={{
                      background: "var(--bg-card)",
                      border: "0.5px solid var(--border-default)",
                    }}
                  >
                    <div className="space-y-2">
                      <div>
                        <label className="text-[11px]" style={{ color: "var(--text-secondary)" }}>Başlangıç</label>
                        <input
                          type="date"
                          value={tarihBas}
                          onChange={e => { setTarihBas(e.target.value); setSayfaNo(1); }}
                          className="w-full px-2 py-1.5 rounded-md text-sm mt-1 focus:outline-none"
                          style={{
                            background: "var(--bg-input)",
                            border: "0.5px solid var(--border-default)",
                            color: "var(--text-primary)",
                          }}
                        />
                      </div>
                      <div>
                        <label className="text-[11px]" style={{ color: "var(--text-secondary)" }}>Bitiş</label>
                        <input
                          type="date"
                          value={tarihBit}
                          onChange={e => { setTarihBit(e.target.value); setSayfaNo(1); }}
                          className="w-full px-2 py-1.5 rounded-md text-sm mt-1 focus:outline-none"
                          style={{
                            background: "var(--bg-input)",
                            border: "0.5px solid var(--border-default)",
                            color: "var(--text-primary)",
                          }}
                        />
                      </div>
                      {tarihAktif && (
                        <button
                          onClick={() => { setTarihBas(""); setTarihBit(""); setSayfaNo(1); }}
                          className="w-full text-xs py-1.5 rounded-md transition-colors"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          Tarihleri temizle
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Hareket Ekle */}
            <button
              onClick={() => { setDuzenle(null); setModalAcik(true); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
              style={{ background: "var(--forest)" }}
            >
              <Plus className="w-3.5 h-3.5" /> Ekle
            </button>
          </div>

          {/* Sayım */}
          <div className="flex justify-end mt-2">
            <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
              {filtrelenmis.length} kayıt
            </span>
          </div>
        </div>

        {/* Tablo başlıkları */}
        <div
          className="grid grid-cols-[44px_140px_1fr_1fr_120px_80px] gap-3 px-5 py-3 text-[10px] font-semibold uppercase tracking-wider"
          style={{
            borderBottom: "0.5px solid var(--border-default)",
            background: "var(--bg-secondary)",
            color: "var(--text-tertiary)",
          }}
        >
          <span>Tip</span>
          <span>Hedef</span>
          <span>Açıklama</span>
          <span>Tarih</span>
          <span className="text-right">Tutar</span>
          <span className="text-right">İşlem</span>
        </div>

        {/* Satırlar */}
        <div className="divide-y min-h-[120px]" style={{ borderColor: "var(--border-default)" }}>
          {sayfaIslemler.length === 0 ? (
            <div className="py-16 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
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
                  className="group grid grid-cols-[44px_140px_1fr_1fr_120px_80px] gap-3 px-5 py-3.5 items-center hover:bg-gray-50 transition-colors"
                >
                  {/* Tip */}
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      background: "transparent",
                      border: "0.5px solid var(--border-default)",
                    }}
                  >
                    {yatirmaMi
                      ? <ArrowDown className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
                      : <ArrowUp   className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />}
                  </div>

                  {/* Hedef adı */}
                  {hedefAdi ? (
                    <span
                      className="text-xs px-2 py-0.5 rounded-md truncate"
                      style={{
                        background: "var(--bg-secondary)",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {hedefAdi}
                    </span>
                  ) : (
                    <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>—</span>
                  )}

                  {/* Açıklama */}
                  <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                    {islem.aciklama || "—"}
                  </p>

                  {/* Tarih */}
                  <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                    {tarihFormat(islem.tarih)}
                  </p>

                  {/* Tutar */}
                  <p
                    className="text-sm font-medium font-number tabular-nums text-right whitespace-nowrap"
                    style={{ color: yatirmaMi ? "#047857" : "#C97676" }}
                  >
                    {yatirmaMi ? "+" : "−"}{formatTL(islem.tutarKurus)}
                  </p>

                  {/* Aksiyonlar */}
                  <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => { setDuzenle(islem); setModalAcik(true); }}
                      className="w-7 h-7 flex items-center justify-center rounded-md transition-colors hover:bg-gray-100"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleIslemSil(islem)}
                      className="w-7 h-7 flex items-center justify-center rounded-md transition-colors"
                      style={{ color: "var(--text-tertiary)" }}
                      onMouseEnter={e => (e.currentTarget.style.color = "#C97676")}
                      onMouseLeave={e => (e.currentTarget.style.color = "var(--text-tertiary)")}
                    >
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
          <div
            className="flex items-center justify-between px-5 py-3"
            style={{ borderTop: "0.5px solid var(--border-default)" }}
          >
            <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              {(sayfaNo - 1) * SAYFA_BOYUTU + 1}–{Math.min(sayfaNo * SAYFA_BOYUTU, filtrelenmis.length)} / {filtrelenmis.length} kayıt
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSayfaNo(p => Math.max(1, p - 1))}
                disabled={sayfaNo === 1}
                className="w-7 h-7 flex items-center justify-center rounded-md disabled:opacity-30"
                style={{
                  border: "0.5px solid var(--border-default)",
                  color: "var(--text-secondary)",
                }}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              {Array.from({ length: Math.min(toplamSayfa, 5) }, (_, i) => {
                const p = toplamSayfa <= 5 ? i + 1
                  : sayfaNo <= 3 ? i + 1
                  : sayfaNo >= toplamSayfa - 2 ? toplamSayfa - 4 + i
                  : sayfaNo - 2 + i;
                return (
                  <button
                    key={p}
                    onClick={() => setSayfaNo(p)}
                    className="w-7 h-7 flex items-center justify-center rounded-md text-xs font-medium transition-all"
                    style={{
                      border: "0.5px solid var(--border-default)",
                      background: sayfaNo === p ? "var(--bg-secondary)" : "transparent",
                      color: sayfaNo === p ? "var(--text-primary)" : "var(--text-tertiary)",
                      fontWeight: sayfaNo === p ? 600 : 400,
                    }}
                  >
                    {p}
                  </button>
                );
              })}

              <button
                onClick={() => setSayfaNo(p => Math.min(toplamSayfa, p + 1))}
                disabled={sayfaNo === toplamSayfa}
                className="w-7 h-7 flex items-center justify-center rounded-md disabled:opacity-30"
                style={{
                  border: "0.5px solid var(--border-default)",
                  color: "var(--text-secondary)",
                }}
              >
                <ChevronRight className="w-3.5 h-3.5" />
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
        defaultHedefId={hedefFiltre}
        onKaydet={handleKaydet}
      />
    </>
  );
}
