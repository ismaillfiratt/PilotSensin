"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Trash2 } from "lucide-react";
import { type Urun } from "@/lib/stok-data";
import { useStokAyarlar } from "@/store/stokAyarlar";
import { useSirket } from "@/store/sirket";
import { kurus } from "@/lib/para";

interface Props {
  open: boolean;
  onClose: () => void;
  urun?: Urun | null;
  onKaydet: (u: Omit<Urun, "id">) => void;
}

const bosForm = {
  ad: "", sku: "", kategori: "", birim: "",
  mevcutAdet: "", emniyetStogu: "", kritikStok: "", gunlukSatis: "", birimMaliyetKurus: "",
};

export default function UrunEkleModal({ open, onClose, urun, onKaydet }: Props) {
  const duzenlemeModu = !!urun;
  const { rol } = useSirket();
  const isPilot = rol === "pilot" || !rol;

  const {
    birimler, kategoriler,
    birimEkle, birimSil, kategoriEkle, kategoriSil,
  } = useStokAyarlar();

  const [form, setForm]           = useState(bosForm);
  const [yeniBirim, setYeniBirim] = useState("");
  const [yeniKat, setYeniKat]     = useState("");
  const [birimDuzenle, setBirimD] = useState(false);
  const [katDuzenle, setKatD]     = useState(false);

  useEffect(() => {
    if (!open) return;
    if (urun) {
      setForm({
        ad:           urun.ad,
        sku:          urun.sku,
        kategori:     urun.kategori,
        birim:        urun.birim,
        mevcutAdet:   String(urun.mevcutAdet),
        emniyetStogu: String(urun.emniyetStogu),
        kritikStok:   String(urun.kritikStok),
        gunlukSatis:  String(urun.gunlukSatis),
        birimMaliyetKurus: urun.birimMaliyetKurus ? String(urun.birimMaliyetKurus / 100) : "",
      });
    } else {
      setForm({ ...bosForm, birim: birimler[0] ?? "", kategori: kategoriler[0] ?? "" });
    }
  }, [urun, open, birimler, kategoriler]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onKaydet({
      ad: form.ad, sku: form.sku,
      kategori: form.kategori || kategoriler[0] || "Diğer",
      birim:    form.birim    || birimler[0]    || "adet",
      mevcutAdet:    Number(form.mevcutAdet),
      emniyetStogu:  Number(form.emniyetStogu),
      kritikStok:    Number(form.kritikStok),
      gunlukSatis:   Number(form.gunlukSatis),
      birimMaliyetKurus:  form.birimMaliyetKurus ? kurus(Number(form.birimMaliyetKurus)) : undefined,
      sonHareket:    new Date().toISOString(),
      hareketler:    urun?.hareketler ?? [],
    });
    onClose();
  };

  const toplamDeger = form.mevcutAdet && form.birimMaliyetKurus
    ? (Number(form.mevcutAdet) * Number(form.birimMaliyetKurus)).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })
    : null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}>
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ duration: 0.2 }}
          className="w-full max-w-lg card rounded-2xl p-6 max-h-[90vh] overflow-y-auto">

          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-800">{duzenlemeModu ? "Ürünü Düzenle" : "Yeni Ürün Ekle"}</h2>
              {duzenlemeModu && <p className="text-xs text-gray-400 mt-0.5">{urun.sku}</p>}
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-800 hover:bg-gray-50 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Ad + SKU */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs text-gray-400 font-medium block mb-1.5">Ürün Adı *</label>
                <input required value={form.ad} onChange={(e) => set("ad", e.target.value)} placeholder="örn. Süt 1L"
                  className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[var(--leaf)] text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-400 font-medium block mb-1.5">SKU / Barkod</label>
                <input value={form.sku} onChange={(e) => set("sku", e.target.value)} placeholder="SUT-001"
                  className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[var(--leaf)] text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-400 font-medium block mb-1.5">Birim Alış Fiyatı (₺)</label>
                <input type="number" min="0" step="0.01" value={form.birimMaliyetKurus} onChange={(e) => set("birimMaliyetKurus", e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[var(--leaf)] text-sm" />
              </div>
            </div>

            {toplamDeger && (
              <div className="px-3 py-2 rounded-xl bg-[var(--mint)] border border-[var(--mint)]">
                <p className="text-xs text-[var(--leaf)]">Toplam stok değeri: <span className="font-bold">{toplamDeger}</span></p>
              </div>
            )}

            {/* Birim */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs text-gray-400 font-medium">Birim</label>
                <button type="button" onClick={() => setBirimD(!birimDuzenle)}
                  className="text-[10px] text-[var(--leaf)] hover:underline">{birimDuzenle ? "Kapat" : "Düzenle"}</button>
              </div>
              {birimDuzenle ? (
                <div className="space-y-2 p-3 rounded-xl bg-gray-50 border border-gray-200">
                  <div className="flex flex-wrap gap-1.5">
                    {birimler.map((b) => (
                      <span key={b} className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs bg-gray-50 text-gray-800">
                        {b}
                        <button type="button" onClick={() => birimSil(b)} className="text-gray-500 hover:text-[#ef4444]">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input value={yeniBirim} onChange={(e) => setYeniBirim(e.target.value)} placeholder="Yeni birim..."
                      className="flex-1 px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 text-xs focus:outline-none" />
                    <button type="button" onClick={() => { if (yeniBirim.trim()) { birimEkle(yeniBirim.trim()); setYeniBirim(""); } }}
                      className="px-2.5 py-1.5 rounded-lg bg-white text-gray-900 text-xs font-bold">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <select value={form.birim} onChange={(e) => set("birim", e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 focus:outline-none focus:border-[var(--leaf)] text-sm">
                  {birimler.map((b) => <option key={b} value={b} className="bg-white">{b}</option>)}
                </select>
              )}
            </div>

            {/* Kategori */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs text-gray-400 font-medium">Kategori</label>
                <button type="button" onClick={() => setKatD(!katDuzenle)}
                  className="text-[10px] text-[var(--leaf)] hover:underline">{katDuzenle ? "Kapat" : "Düzenle"}</button>
              </div>
              {katDuzenle ? (
                <div className="space-y-2 p-3 rounded-xl bg-gray-50 border border-gray-200">
                  <div className="flex flex-wrap gap-1.5">
                    {kategoriler.map((k) => (
                      <span key={k} className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs bg-gray-50 text-gray-800">
                        {k}
                        <button type="button" onClick={() => kategoriSil(k)} className="text-gray-500 hover:text-[#ef4444]">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input value={yeniKat} onChange={(e) => setYeniKat(e.target.value)} placeholder="Yeni kategori..."
                      className="flex-1 px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 text-xs focus:outline-none" />
                    <button type="button" onClick={() => { if (yeniKat.trim()) { kategoriEkle(yeniKat.trim()); setYeniKat(""); } }}
                      className="px-2.5 py-1.5 rounded-lg bg-white text-gray-900 text-xs font-bold">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <select value={form.kategori} onChange={(e) => set("kategori", e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 focus:outline-none focus:border-[var(--leaf)] text-sm">
                  {kategoriler.map((k) => <option key={k} value={k} className="bg-white">{k}</option>)}
                </select>
              )}
            </div>

            {/* Stok seviyeleri */}
            <div className="border-t border-gray-200 pt-4">
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-3">Stok Seviyeleri</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 font-medium block mb-1.5">Mevcut Adet *</label>
                  <input type="number" min="0" required value={form.mevcutAdet} onChange={(e) => set("mevcutAdet", e.target.value)} placeholder="0"
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[var(--leaf)] text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-medium block mb-1.5">Ort. Günlük Satış</label>
                  <input type="number" min="0" value={form.gunlukSatis} onChange={(e) => set("gunlukSatis", e.target.value)} placeholder="0"
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[var(--leaf)] text-sm" />
                </div>
                {/* Emniyet ve kritik sadece pilota gösterilir */}
                <div className={isPilot ? "" : "opacity-50 pointer-events-none"}>
                  <label className="text-xs text-gray-400 font-medium block mb-1.5">
                    Emniyet Stoğu {!isPilot && <span className="text-gray-500">(Pilot yetkisi)</span>}
                  </label>
                  <input type="number" min="0" required value={form.emniyetStogu}
                    onChange={(e) => isPilot && set("emniyetStogu", e.target.value)} placeholder="10"
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[var(--leaf)] text-sm" />
                </div>
                <div className={isPilot ? "" : "opacity-50 pointer-events-none"}>
                  <label className="text-xs text-gray-400 font-medium block mb-1.5">
                    Kritik Stok {!isPilot && <span className="text-gray-500">(Pilot yetkisi)</span>}
                  </label>
                  <input type="number" min="0" required value={form.kritikStok}
                    onChange={(e) => isPilot && set("kritikStok", e.target.value)} placeholder="5"
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[var(--leaf)] text-sm" />
                </div>
              </div>
              <p className="text-[11px] text-gray-400 mt-2">Emniyet stoğu → sarı uyarı &nbsp;|&nbsp; Kritik stok → kırmızı alarm</p>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-400 text-sm font-medium hover:bg-gray-50 transition-colors">İptal</button>
              <button type="submit"
                className="flex-1 py-3 rounded-xl bg-[var(--forest)] text-gray-800 text-sm font-bold hover:opacity-90 transition-colors">
                {duzenlemeModu ? "Değişiklikleri Kaydet" : "Ürün Ekle"}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
