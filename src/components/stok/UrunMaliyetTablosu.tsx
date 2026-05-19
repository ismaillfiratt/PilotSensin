"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown, Plus, Trash2, Save, TrendingUp,
  DollarSign, X, Receipt, Check, Settings2,
} from "lucide-react";
import { useStok }    from "@/store/stok";
import { useSirket }  from "@/store/sirket";
import { useKdvHavuzu } from "@/store/kdvHavuzu";
import { onaylaSil } from "@/lib/onay";
import { kurus } from "@/lib/para";
import {
  useUrunMaliyetler,
  toplamMatrah, netKar, karMarji,
  toplamIndirilebilirKdv, brütMaliyet, hesaplananKdv, netKdv,
  alisFiyatiKdv, alisMatrahi, giderMatrahi, giderKdvTutari,
  type UrunMaliyetKayit, type GiderKalemi,
  VARSAYILAN_GIDERLER,
} from "@/store/urunMaliyetler";

const tl = (n: number) =>
  n.toLocaleString("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 2 });

const renkKar = (kar: number) =>
  kar > 0 ? "#22c55e" : kar < 0 ? "#ef4444" : "#94a3b8";

function bosKayit(urunId: string): UrunMaliyetKayit {
  return {
    urunId,
    alisFiyati:          0,
    alisFiyatiKdvOrani:  20,
    alisFiyatiKdvDahil:  false,
    satisFiyati:         0,
    satisFiyatiKdvOrani: 20,
    giderler: VARSAYILAN_GIDERLER.map((g) => ({
      id:           Date.now().toString() + Math.random(),
      ad:           g.ad,
      miktar:       0,
      tip:          g.tip,
      kdvOrani:     g.kdvOrani,
      kdvDahil:     g.kdvDahil,
      yüzdeBaz:     g.yüzdeBaz,
    })),
  };
}

/* ─── Sayı girişi: ok işaretleri dışarıda, ₺/% toggle — sabit yükseklik ─── */
function GiderInput({
  value, onChange, tip, onTipChange,
}: {
  value:       number;
  onChange:    (n: number) => void;
  tip:         "tutar" | "yuzde";
  onTipChange: (t: "tutar" | "yuzde") => void;
}) {
  const step = tip === "yuzde" ? 0.5 : 1;
  return (
    <div className="flex items-stretch rounded-lg border border-gray-200 overflow-hidden bg-gray-50 focus-within:border-[var(--forest-300, #7DD0A0)] h-8">
      <input
        type="number" min="0" step={step}
        value={value || ""}
        onChange={(e) => onChange(Number(e.target.value))}
        placeholder="0"
        className="w-16 px-2 bg-transparent text-white placeholder-[#475569] focus:outline-none text-sm text-right [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      {/* ₺ / % toggle */}
      <button
        type="button"
        onClick={() => onTipChange(tip === "tutar" ? "yuzde" : "tutar")}
        title="Tıkla: ₺ / % değiştir"
        className="flex items-center justify-center w-7 border-l border-gray-200 text-xs text-[var(--leaf)] hover:bg-[var(--mint)] transition-colors select-none font-semibold bg-gray-50"
      >
        {tip === "tutar" ? "₺" : "%"}
      </button>
      {/* Dış ok tuşları */}
      <div className="flex flex-col border-l border-gray-200">
        <button type="button"
          onClick={() => onChange(Math.round((value + step) * 100) / 100)}
          className="flex-1 px-1 text-gray-500 hover:text-[var(--leaf)] hover:bg-[var(--mint)] transition-colors text-[8px] flex items-center justify-center">▲</button>
        <button type="button"
          onClick={() => onChange(Math.max(0, Math.round((value - step) * 100) / 100))}
          className="flex-1 px-1 text-gray-500 hover:text-[var(--leaf)] hover:bg-[var(--mint)] transition-colors text-[8px] flex items-center justify-center border-t border-gray-200">▼</button>
      </div>
    </div>
  );
}

/* ─── KDV oran seçici ─── */
function KdvSecici({ value, onChange, kdvOranlari }: { value: number; onChange: (n: number) => void; kdvOranlari: number[] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      title="KDV oranı"
      className="h-8 px-1.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-500 text-[10px] focus:outline-none hover:border-[var(--forest-200, #B3E8C8)] transition-colors cursor-pointer"
    >
      {[...kdvOranlari].sort((a, b) => a - b).map((r) => (
        <option key={r} value={r} className="bg-white">
          KDV {r === 0 ? "Yok" : `%${r}`}
        </option>
      ))}
    </select>
  );
}

/* ─── Ana bileşen ─── */
export default function UrunMaliyetTablosu() {
  const { urunler }                                  = useStok();
  const { rol }                                      = useSirket();
  const { kayitlar, upsert, sil, kdvOranlari, kdvOraniEkle, kdvOraniSil } = useUrunMaliyetler();
  const { ekle: kdvEkle, hareketSil: kdvHareketSil } = useKdvHavuzu();

  const [acikUrunId, setAcikUrunId]         = useState<string | null>(null);
  const [duzenle, setDuzenle]               = useState<UrunMaliyetKayit | null>(null);
  const [yeniGiderAd, setYeniGiderAd]       = useState("");
  const [yeniGiderTip, setYeniGiderTip]     = useState<"tutar" | "yuzde">("tutar");
  const [yeniGiderKdv, setYeniGiderKdv]     = useState<number>(20);
  const [giderDialog, setGiderDialog]       = useState(false);
  const [bekleyenGider, setBekleyenGider]   = useState<GiderKalemi | null>(null);
  const [secilenUrunler, setSecilenUrunler] = useState<Set<string>>(new Set());

  // KDV oranları yönetim paneli
  const [kdvPaneliAcik, setKdvPaneliAcik] = useState(false);
  const [yeniKdvOrani, setYeniKdvOrani]   = useState<string>("");

  // RBAC: sadece Pilot
  if (rol && rol !== "pilot") return null;

  const kayitBul = (urunId: string) =>
    kayitlar.find((k) => k.urunId === urunId) ?? bosKayit(urunId);

  const urunAc = (urunId: string) => {
    if (acikUrunId === urunId) { setAcikUrunId(null); setDuzenle(null); return; }
    setAcikUrunId(urunId);
    setDuzenle({ ...kayitBul(urunId) });
  };

  const setAlis = (field: Partial<UrunMaliyetKayit>) =>
    setDuzenle((d) => d ? { ...d, ...field } : d);

  const giderGuncelle = (id: string, miktar: number) =>
    setDuzenle((d) => d ? { ...d, giderler: d.giderler.map((g) => g.id === id ? { ...g, miktar } : g) } : d);

  const giderTipGuncelle = (id: string, tip: "tutar" | "yuzde") =>
    setDuzenle((d) => d ? { ...d, giderler: d.giderler.map((g) => g.id === id ? { ...g, tip } : g) } : d);

  const giderKdvGuncelle = (id: string, kdvOrani: number) =>
    setDuzenle((d) => d ? { ...d, giderler: d.giderler.map((g) => g.id === id ? { ...g, kdvOrani } : g) } : d);

  const giderKdvDahilGuncelle = (id: string, kdvDahil: boolean) =>
    setDuzenle((d) => d ? { ...d, giderler: d.giderler.map((g) => g.id === id ? { ...g, kdvDahil } : g) } : d);

  const giderBazGuncelle = (id: string, yüzdeBaz: GiderKalemi["yüzdeBaz"]) =>
    setDuzenle((d) => d ? { ...d, giderler: d.giderler.map((g) => g.id === id ? { ...g, yüzdeBaz } : g) } : d);

  const giderOzelBazGuncelle = (id: string, yüzdeOzelBaz: number) =>
    setDuzenle((d) => d ? { ...d, giderler: d.giderler.map((g) => g.id === id ? { ...g, yüzdeOzelBaz } : g) } : d);

  const giderSil = (id: string) =>
    setDuzenle((d) => d ? { ...d, giderler: d.giderler.filter((g) => g.id !== id) } : d);

  const giderEkle = () => {
    if (!yeniGiderAd.trim() || !duzenle) return;
    const yeniGider: GiderKalemi = {
      id: Date.now().toString(), ad: yeniGiderAd.trim(),
      miktar: 0, tip: yeniGiderTip, kdvOrani: yeniGiderKdv,
      kdvDahil: false, yüzdeBaz: "alis",
    };
    setDuzenle({ ...duzenle, giderler: [...duzenle.giderler, yeniGider] });
    setYeniGiderAd("");
    if (urunler.length > 1) {
      setBekleyenGider(yeniGider);
      setSecilenUrunler(new Set(urunler.filter((u) => u.id !== acikUrunId).map((u) => u.id)));
      setGiderDialog(true);
    }
  };

  const giderDialogKaydet = () => {
    if (!bekleyenGider) return;
    secilenUrunler.forEach((urunId) => {
      if (urunId === acikUrunId) return;
      const kayit = kayitBul(urunId);
      if (kayit.giderler.some((g) => g.ad === bekleyenGider.ad)) return;
      upsert({ ...kayit, giderler: [...kayit.giderler, { ...bekleyenGider, id: Date.now().toString() + Math.random(), miktar: 0 }] });
    });
    setGiderDialog(false); setBekleyenGider(null); setSecilenUrunler(new Set());
  };

  const handleMaliyetSil = async (urunId: string) => {
    const urun = urunler.find(u => u.id === urunId);
    const { onaylandi } = await onaylaSil({ tip: "urun", isim: urun?.ad ?? "Maliyet Kaydı" });
    if (!onaylandi) return;
    sil(urunId);
    setAcikUrunId(null);
    setDuzenle(null);
  };

  const kaydet = () => {
    if (!duzenle) return;
    upsert(duzenle);

    // Request 1: mevcut stok adedince KDV havuzuna "initial" kayıt ekle
    // Her maliyet güncellemesinde eski initial kaydı silinir, yeni eklenir
    const urun     = urunler.find((u) => u.id === duzenle.urunId);
    const birimKdvKurus = toplamIndirilebilirKdv(duzenle);
    const initId   = `initial_${duzenle.urunId}`;
    kdvHareketSil(initId); // önce varsa eskiyi sil
    if (urun && urun.mevcutAdet > 0 && birimKdvKurus > 0) {
      kdvEkle({
        hareketId: initId,
        urunId:    duzenle.urunId,
        urunAd:    urun.ad,
        tip:       "giris",
        adet:      urun.mevcutAdet,
        birimKdvKurus:  kurus(birimKdvKurus),
        toplamKdvKurus: kurus(birimKdvKurus * urun.mevcutAdet),
        tarih:     new Date().toISOString(),
      });
    }

    setAcikUrunId(null); setDuzenle(null);
  };

  // Alt özet değerleri
  const { avgMarj, enKarliUrun, enKarliMarj, stokKdvKirilim, toplamKdvTumu } = useMemo(() => {
    if (kayitlar.length === 0) {
      return { avgMarj: 0, enKarliUrun: null, enKarliMarj: 0, stokKdvKirilim: [], toplamKdvTumu: 0 };
    }
    const avgMarj   = kayitlar.reduce((t, k) => t + karMarji(k), 0) / kayitlar.length;
    const sorted    = [...kayitlar].sort((a, b) => karMarji(b) - karMarji(a));
    const enKarliId = sorted[0]?.urunId;
    const enKarliUrun = urunler.find((u) => u.id === enKarliId) ?? null;
    const enKarliMarj = sorted[0] ? karMarji(sorted[0]) : 0;

    // Request 2: her ürün için mevcutAdet × birimKdvKurus
    const stokKdvKirilim = kayitlar
      .map((k) => {
        const urun     = urunler.find((u) => u.id === k.urunId);
        const adet     = urun?.mevcutAdet ?? 0;
        const birimKdvKurus = toplamIndirilebilirKdv(k);
        return { urunAd: urun?.ad ?? "—", adet, birimKdvKurus, toplamKdvKurus: birimKdvKurus * adet };
      })
      .filter((r) => r.toplamKdvKurus > 0);

    const toplamKdvTumu = stokKdvKirilim.reduce((t, r) => t + r.toplamKdvKurus, 0);
    return { avgMarj, enKarliUrun, enKarliMarj, stokKdvKirilim, toplamKdvTumu };
  }, [kayitlar, urunler]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <DollarSign className="w-5 h-5 text-[var(--leaf)]" />
        <h2 className="text-base font-bold text-white">Ürün Maliyet Analizi</h2>
        <span className="text-xs text-gray-500">— VUK uyumlu KDV ve maliyet kırılımı</span>
      </div>

      {/* Global gider diyaloğu */}
      <AnimatePresence>
        {giderDialog && bekleyenGider && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) { setGiderDialog(false); setBekleyenGider(null); } }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className="card rounded-2xl p-6 w-full max-w-sm space-y-4"
            >
              <div>
                <h3 className="text-sm font-bold text-white">Gideri Diğer Ürünlere Ekle</h3>
                <p className="text-xs text-gray-500 mt-1">
                  <span className="text-[var(--leaf)] font-medium">"{bekleyenGider.ad}"</span> hangi ürünlere de eklensin?
                </p>
              </div>
              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {urunler.filter((u) => u.id !== acikUrunId).map((u) => {
                  const secili = secilenUrunler.has(u.id);
                  return (
                    <button key={u.id} onClick={() => {
                      const s = new Set(secilenUrunler);
                      if (s.has(u.id)) s.delete(u.id); else s.add(u.id);
                      setSecilenUrunler(s);
                    }} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-gray-50">
                      <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors shrink-0 ${secili ? "bg-white border-[var(--leaf)]" : "border-gray-200"}`}>
                        {secili && <Check className="w-2.5 h-2.5 text-gray-900" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-white truncate">{u.ad}</p>
                        <p className="text-[10px] text-gray-500">{u.sku || u.kategori}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => { setGiderDialog(false); setBekleyenGider(null); setSecilenUrunler(new Set()); }}
                  className="flex-1 py-2 rounded-xl border border-gray-200 text-gray-400 text-sm hover:bg-gray-50 transition-colors">
                  Sadece bu ürün
                </button>
                <button onClick={giderDialogKaydet} disabled={secilenUrunler.size === 0}
                  className="flex-1 py-2 rounded-xl bg-[var(--forest)] text-white text-sm font-bold hover:opacity-90 transition-colors disabled:opacity-40">
                  Ekle ({secilenUrunler.size})
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {urunler.length === 0 ? (
        <div className="card rounded-2xl py-10 text-center text-sm text-gray-500">Önce ürün ekleyin</div>
      ) : (
        <div className="card rounded-2xl overflow-hidden divide-y divide-gray-100">
          <div className="hidden md:grid md:grid-cols-[2fr_1fr_1fr_1fr_1fr_40px] gap-4 px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            <span>Ürün</span><span>Alış Matr.</span><span>Satış</span>
            <span>Net Maliyet</span><span>Net Kar / Marj</span><span />
          </div>

          {urunler.map((urun) => {
            const k     = kayitlar.find((x) => x.urunId === urun.id);
            const acik  = acikUrunId === urun.id;
            const kar   = k ? netKar(k) : null;
            const marj  = k ? karMarji(k) : null;
            const indKdv = k ? toplamIndirilebilirKdv(k) : null;
            const satKdv = k ? hesaplananKdv(k) : null;

            return (
              <div key={urun.id}>
                <button onClick={() => urunAc(urun.id)}
                  className="w-full grid grid-cols-[2fr_1fr_1fr_1fr_1fr_40px] gap-4 px-5 py-4 items-center text-left hover:bg-[var(--mint)] transition-colors">
                  <div>
                    <p className="text-sm font-semibold text-white">{urun.ad}</p>
                    <p className="text-xs text-gray-500">{urun.sku || "—"}</p>
                    {/* Birim KDV özet bilgisi */}
                    {k && (indKdv! > 0 || satKdv! > 0) && (
                      <p className="text-[10px] text-gray-600 mt-0.5">
                        {indKdv! > 0 && <span className="text-[#22c55e]">İnd.KDV: {tl(indKdv!)}</span>}
                        {indKdv! > 0 && satKdv! > 0 && <span className="text-gray-600"> · </span>}
                        {satKdv! > 0 && <span className="text-[#ef4444]">Sat.KDV: {tl(satKdv!)}</span>}
                      </p>
                    )}
                  </div>
                  <span className="text-sm text-gray-400">{k ? tl(alisMatrahi(k)) : "—"}</span>
                  <span className="text-sm text-gray-400">{k ? tl(k.satisFiyati) : "—"}</span>
                  <span className="text-sm text-gray-400">{k ? tl(toplamMatrah(k)) : "—"}</span>
                  <div>
                    {kar !== null ? (
                      <>
                        <span className="text-sm font-semibold" style={{ color: renkKar(kar) }}>
                          {kar >= 0 ? "+" : ""}{tl(kar)}
                        </span>
                        <span className="text-xs text-gray-500 ml-1.5">%{Math.abs(marj!).toFixed(1)}</span>
                      </>
                    ) : <span className="text-xs text-gray-500 italic">Girilmedi</span>}
                  </div>
                  <motion.div animate={{ rotate: acik ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </motion.div>
                </button>

                <AnimatePresence>
                  {acik && duzenle && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden border-t border-gray-200"
                    >
                      <div className="px-5 py-5 space-y-5 bg-gray-50">

                        {/* Alış + Satış */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs text-gray-400 font-medium block">Birim Alış Fiyatı</label>
                            <div className="flex items-center gap-1.5">
                              <input type="number" min="0" step="0.01"
                                value={duzenle.alisFiyati || ""}
                                onChange={(e) => setAlis({ alisFiyati: Number(e.target.value) })}
                                placeholder="0.00"
                                className="flex-1 h-8 px-3 rounded-xl bg-gray-50 border border-gray-200 text-white placeholder-[#475569] focus:outline-none focus:border-[var(--leaf)] text-sm [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                              />
                              <span className="text-gray-500 font-bold text-sm select-none">+</span>
                              <KdvSecici value={duzenle.alisFiyatiKdvOrani ?? 20} onChange={(v) => setAlis({ alisFiyatiKdvOrani: v })} kdvOranlari={kdvOranlari} />
                            </div>
                            {duzenle.alisFiyati > 0 && (duzenle.alisFiyatiKdvOrani ?? 0) > 0 && (
                              <div className="flex items-center gap-2">
                                <button type="button"
                                  onClick={() => setAlis({ alisFiyatiKdvDahil: !duzenle.alisFiyatiKdvDahil })}
                                  className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors ${duzenle.alisFiyatiKdvDahil ? "border-[var(--forest-300, #7DD0A0)] text-[var(--leaf)] bg-[var(--mint)]" : "border-gray-200 text-gray-500"}`}>
                                  {duzenle.alisFiyatiKdvDahil ? "KDV Dahil" : "KDV Hariç"}
                                </button>
                                <span className="text-[9px] text-gray-500">
                                  Matrah: {tl(alisMatrahi(duzenle))} · KDV: {tl(alisFiyatiKdv(duzenle))}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs text-gray-400 font-medium block">Birim Satış Fiyatı</label>
                            <div className="flex items-center gap-1.5">
                              <input type="number" min="0" step="0.01"
                                value={duzenle.satisFiyati || ""}
                                onChange={(e) => setAlis({ satisFiyati: Number(e.target.value) })}
                                placeholder="0.00"
                                className="flex-1 h-8 px-3 rounded-xl bg-gray-50 border border-gray-200 text-white placeholder-[#475569] focus:outline-none focus:border-[var(--leaf)] text-sm [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                              />
                              <span className="text-gray-500 font-bold text-sm select-none">+</span>
                              <KdvSecici value={duzenle.satisFiyatiKdvOrani ?? 20} onChange={(v) => setAlis({ satisFiyatiKdvOrani: v })} kdvOranlari={kdvOranlari} />
                            </div>
                            {duzenle.satisFiyati > 0 && (duzenle.satisFiyatiKdvOrani ?? 0) > 0 && (
                              <span className="text-[9px] text-gray-500">
                                Hesaplanan KDV: {tl(hesaplananKdv(duzenle))}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Gider kalemleri */}
                        <div className="space-y-2">
                          {/* Başlık + KDV oranları yönetim butonu */}
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Gider Kalemleri</p>
                            <button
                              onClick={() => setKdvPaneliAcik((v) => !v)}
                              className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg border transition-colors ${kdvPaneliAcik ? "border-[var(--forest-300, #7DD0A0)] text-[var(--leaf)] bg-[var(--mint)]" : "border-gray-200 text-gray-500 hover:text-gray-500"}`}
                            >
                              <Settings2 className="w-3 h-3" />
                              KDV Oranları
                            </button>
                          </div>

                          {/* KDV Oranları Yönetim Paneli */}
                          <AnimatePresence>
                            {kdvPaneliAcik && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
                                  <p className="text-[10px] text-gray-500 uppercase tracking-wide">Mevcut KDV Oranları</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {[...kdvOranlari].sort((a, b) => a - b).map((r) => (
                                      <div key={r} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-50 border border-gray-200">
                                        <span className="text-xs text-white">{r === 0 ? "KDV Yok" : `%${r}`}</span>
                                        {r !== 0 && (
                                          <button onClick={() => kdvOraniSil(r)}
                                            className="text-gray-500 hover:text-[#ef4444] transition-colors ml-0.5">
                                            <X className="w-3 h-3" />
                                          </button>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="number" min="1" max="99"
                                      value={yeniKdvOrani}
                                      onChange={(e) => setYeniKdvOrani(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter" && yeniKdvOrani) {
                                          kdvOraniEkle(Number(yeniKdvOrani));
                                          setYeniKdvOrani("");
                                        }
                                      }}
                                      placeholder="Yeni oran %"
                                      className="w-28 px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-white placeholder-[#475569] text-xs focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                    />
                                    <button
                                      onClick={() => { if (yeniKdvOrani) { kdvOraniEkle(Number(yeniKdvOrani)); setYeniKdvOrani(""); } }}
                                      className="px-2.5 py-1.5 rounded-lg bg-[rgba(34,197,94,0.15)] text-[#22c55e] text-xs hover:bg-[rgba(34,197,94,0.25)] transition-colors flex items-center gap-1">
                                      <Plus className="w-3 h-3" />Ekle
                                    </button>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Gider satırları — sabit yükseklik, genişlemez */}
                          <div className="space-y-1.5">
                            {duzenle.giderler.map((g) => (
                              <div key={g.id} className="flex items-center gap-1.5 py-1">
                                {/* Gider adı */}
                                <span className="flex-1 text-xs text-gray-400 truncate min-w-0">{g.ad}</span>

                                {/* Kontroller — sabit sıra, genişlemez */}
                                <div className="flex items-center gap-1 shrink-0">
                                  {/* Tutar/Yüzde giriş + ₺/% toggle + oklar */}
                                  <GiderInput
                                    value={g.miktar}
                                    onChange={(n) => giderGuncelle(g.id, n)}
                                    tip={g.tip}
                                    onTipChange={(t) => giderTipGuncelle(g.id, t)}
                                  />

                                  {/* Yüzde tabanı (sadece % tipinde) */}
                                  {g.tip === "yuzde" && (
                                    <>
                                      <select
                                        value={g.yüzdeBaz || "alis"}
                                        onChange={(e) => giderBazGuncelle(g.id, e.target.value as GiderKalemi["yüzdeBaz"])}
                                        className="h-8 px-1.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-500 text-[10px] focus:outline-none cursor-pointer"
                                      >
                                        <option value="alis"  className="bg-white">Alış</option>
                                        <option value="satis" className="bg-white">Satış</option>
                                        <option value="ozel"  className="bg-white">Özel</option>
                                      </select>
                                      {g.yüzdeBaz === "ozel" && (
                                        <input type="number" min="0"
                                          value={g.yüzdeOzelBaz || ""}
                                          onChange={(e) => giderOzelBazGuncelle(g.id, Number(e.target.value))}
                                          placeholder="₺"
                                          className="h-8 w-16 px-2 rounded-lg bg-gray-50 border border-gray-200 text-white text-xs text-right focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                        />
                                      )}
                                    </>
                                  )}

                                  {/* + KDV seçici */}
                                  <span className="text-gray-600 text-xs select-none font-bold">+</span>
                                  <KdvSecici value={g.kdvOrani} onChange={(v) => giderKdvGuncelle(g.id, v)} kdvOranlari={kdvOranlari} />

                                  {/* D/H toggle — sadece KDV > 0 ise göster, ama yer tutar */}
                                  <button
                                    type="button"
                                    onClick={() => g.kdvOrani > 0 && giderKdvDahilGuncelle(g.id, !g.kdvDahil)}
                                    title={g.kdvOrani === 0 ? "KDV yok" : g.kdvDahil ? "KDV Dahil — tıkla Hariç'e geç" : "KDV Hariç — tıkla Dahil'e geç"}
                                    className={`h-8 w-8 flex items-center justify-center rounded-lg border text-[10px] font-semibold transition-colors ${
                                      g.kdvOrani === 0
                                        ? "border-transparent text-transparent cursor-default"
                                        : g.kdvDahil
                                        ? "border-[var(--forest-300, #7DD0A0)] text-[var(--leaf)] bg-[var(--mint)] hover:bg-[var(--mint)]"
                                        : "border-gray-200 text-gray-500 hover:text-gray-500"
                                    }`}
                                  >
                                    {g.kdvOrani > 0 ? (g.kdvDahil ? "D" : "H") : ""}
                                  </button>

                                  {/* Sil */}
                                  <button onClick={() => giderSil(g.id)}
                                    className="h-8 w-7 flex items-center justify-center rounded-lg text-gray-500 hover:text-[#ef4444] transition-colors">
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Yeni gider ekle */}
                          <div className="flex gap-1.5 pt-2 border-t border-gray-200">
                            <input
                              value={yeniGiderAd} onChange={(e) => setYeniGiderAd(e.target.value)}
                              onKeyDown={(e) => { if (e.key === "Enter") giderEkle(); }}
                              placeholder="Gider adı…"
                              className="flex-1 h-8 px-2.5 rounded-lg bg-gray-50 border border-gray-200 text-white placeholder-[#475569] text-xs focus:outline-none focus:border-[var(--leaf)]"
                            />
                            <select value={yeniGiderTip} onChange={(e) => setYeniGiderTip(e.target.value as "tutar" | "yuzde")}
                              className="h-8 px-1.5 rounded-lg bg-gray-50 border border-gray-200 text-white text-xs focus:outline-none">
                              <option value="tutar" className="bg-white">₺ Sabit</option>
                              <option value="yuzde" className="bg-white">% Oran</option>
                            </select>
                            <select value={yeniGiderKdv} onChange={(e) => setYeniGiderKdv(Number(e.target.value))}
                              className="h-8 px-1.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-500 text-xs focus:outline-none">
                              {[...kdvOranlari].sort((a, b) => a - b).map((r) => (
                                <option key={r} value={r} className="bg-white">KDV {r === 0 ? "Yok" : `%${r}`}</option>
                              ))}
                            </select>
                            <button onClick={giderEkle}
                              className="h-8 px-2.5 rounded-lg bg-[var(--mint)] text-[var(--leaf)] hover:bg-[var(--forest-200, #B3E8C8)] transition-colors">
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Maliyet Kırılımı */}
                        {duzenle.alisFiyati > 0 && (
                          <div className="space-y-3">
                            <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-2 text-xs">
                              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Maliyet Kırılımı</p>
                              <div className="space-y-1">
                                <div className="flex justify-between text-gray-500">
                                  <span>Ham Ürün Matrahi</span>
                                  <span className="text-white">{tl(alisMatrahi(duzenle))}</span>
                                </div>
                                {duzenle.giderler.filter((g) => g.miktar > 0).map((g) => (
                                  <div key={g.id} className="flex justify-between text-gray-500">
                                    <span>{g.ad}</span>
                                    <span>{tl(giderMatrahi(g, duzenle))}</span>
                                  </div>
                                ))}
                              </div>
                              <div className="flex justify-between text-sm font-bold text-white border-t border-gray-200 pt-2">
                                <span>Toplam Matrah</span>
                                <span>{tl(toplamMatrah(duzenle))}</span>
                              </div>
                              <div className="flex justify-between text-[#22c55e]">
                                <span>+ Toplam Ödenen KDV</span>
                                <span className="font-semibold">{tl(toplamIndirilebilirKdv(duzenle))}</span>
                              </div>
                              <div className="flex justify-between text-sm font-bold border-t border-gray-200 pt-2">
                                <span className="text-white">Genel Toplam (Kasadan Çıkan)</span>
                                <span className="text-[var(--leaf)]">{tl(brütMaliyet(duzenle))}</span>
                              </div>
                            </div>

                            {duzenle.satisFiyati > 0 && (
                              <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                                  <p className="text-[10px] text-gray-500 uppercase tracking-wide">Net Kar / Marj</p>
                                  <p className="text-sm font-bold mt-0.5" style={{ color: renkKar(netKar(duzenle)) }}>
                                    {netKar(duzenle) >= 0 ? "+" : ""}{tl(netKar(duzenle))}
                                  </p>
                                  <p className="text-[10px] text-gray-500">%{Math.abs(karMarji(duzenle)).toFixed(1)} marj</p>
                                </div>
                                <div className={`p-3 rounded-xl border ${netKdv(duzenle) >= 0 ? "bg-[rgba(239,68,68,0.05)] border-[rgba(239,68,68,0.15)]" : "bg-[rgba(34,197,94,0.05)] border-[rgba(34,197,94,0.15)]"}`}>
                                  <p className="text-[10px] text-gray-500 uppercase tracking-wide">KDV Projeksiyonu</p>
                                  <div className="text-[10px] text-gray-500 mt-1 space-y-0.5">
                                    <div className="flex justify-between">
                                      <span>Hesaplanan KDV</span>
                                      <span className="text-white">+{tl(hesaplananKdv(duzenle))}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>İndirilecek KDV</span>
                                      <span className="text-[#22c55e]">−{tl(toplamIndirilebilirKdv(duzenle))}</span>
                                    </div>
                                  </div>
                                  <p className={`text-sm font-bold mt-1 ${netKdv(duzenle) >= 0 ? "text-[#ef4444]" : "text-[#22c55e]"}`}>
                                    {netKdv(duzenle) >= 0 ? `${tl(netKdv(duzenle))} öde` : `${tl(Math.abs(netKdv(duzenle)))} devret`}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex gap-3">
                          <button onClick={() => handleMaliyetSil(urun.id)}
                            className="px-3 py-2 rounded-xl border border-[rgba(239,68,68,0.2)] text-[#ef4444] text-xs hover:bg-[rgba(239,68,68,0.08)] transition-colors flex items-center gap-1.5">
                            <Trash2 className="w-3.5 h-3.5" />Sıfırla
                          </button>
                          <button onClick={kaydet}
                            className="flex-1 py-2 rounded-xl bg-[var(--forest)] text-white text-sm font-bold hover:opacity-90 transition-colors flex items-center justify-center gap-2">
                            <Save className="w-4 h-4" />Kaydet
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}

      {/* Alt özet — kart tasarımı */}
      {kayitlar.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Kart 1: Performans */}
          <div className="card rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[var(--leaf)]" />
              <h3 className="text-sm font-semibold text-white">Performans Özeti</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wide">Ort. Kar Marjı</p>
                <p className="text-2xl font-black" style={{ color: renkKar(avgMarj) }}>
                  %{avgMarj.toFixed(1)}
                </p>
                <p className="text-[10px] text-gray-500">{kayitlar.length} ürün analizi</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wide">En Karlı Ürün</p>
                <p className="text-sm font-bold text-[#22c55e] truncate">{enKarliUrun?.ad ?? "—"}</p>
                {enKarliUrun && (
                  <p className="text-[10px] text-gray-500">%{enKarliMarj.toFixed(1)} marj</p>
                )}
              </div>
            </div>
          </div>

          {/* Kart 2: Mevcut stoka göre Mahsup Edilecek KDV */}
          {toplamKdvTumu > 0 && (
            <div className="card rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-[#22c55e]" />
                <h3 className="text-sm font-semibold text-white">Mahsup Edilecek KDV</h3>
              </div>

              {/* Toplam büyük rakam */}
              <div>
                <p className="text-2xl font-black text-[#22c55e]">{tl(toplamKdvTumu)}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  Mevcut stok adedine göre toplam indirilecek KDV
                </p>
              </div>

              {/* Ürün kırılımı */}
              {stokKdvKirilim.length > 1 && (
                <div className="space-y-1 pt-1 border-t border-gray-200">
                  {stokKdvKirilim.map((r, i) => (
                    <div key={i} className="flex items-center justify-between text-[10px]">
                      <span className="text-gray-500 truncate flex-1 mr-2">{r.urunAd}</span>
                      <span className="text-gray-500 shrink-0">
                        {r.adet} × {tl(r.birimKdvKurus)} =
                      </span>
                      <span className="text-[#22c55e] font-semibold ml-1 shrink-0">{tl(r.toplamKdvKurus)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="h-1 rounded-full bg-[rgba(34,197,94,0.15)]">
                <div className="h-full rounded-full bg-[#22c55e] opacity-60" style={{ width: "100%" }} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
