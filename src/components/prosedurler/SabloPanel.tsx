"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, DollarSign, Package, Users, UserCheck, Shield,
  ChevronDown, ChevronUp, Check, Plus, Trash2, Zap, X, Pencil,
} from "lucide-react";
import {
  SOP_SABLON_GRUPLARI, KRITIKLIK_RENK, SIKLIGI_LABEL,
  type ChecklistSablon, type ChecklistSikligi, type Kritiklik,
} from "@/lib/prosedur-data";
import {
  useProsedurler, tumKategoriler, tumSorumlular,
  type OzelSablonMaddesi, type OzelGrubu,
} from "@/store/prosedurler";
import KomboSecici from "./KomboSecici";

const ICONS: Record<string, React.ElementType> = {
  TrendingUp, DollarSign, Package, Users, UserCheck, Shield,
};

export default function SabloPanel() {
  const {
    checklist, checklistEkle, checklistSil,
    silinenSablonMaddeleri, sablonMaddeSil,
    ozelSablonMaddeleri, sablonMaddeEkle, ozelSablonMaddeSil, ozelSablonMaddesiniGuncelle,
    ozelKategoriler, ozelSorumlular,
    ozelKategoriEkle, ozelKategoriSil, ozelSorumluEkle, ozelSorumluSil,
    gizliVarsayilanKategoriler, gizliVarsayilanSorumlular,
    ozelGrupAdlari, grupAdGuncelle,
    ozelSablonGruplari, ozelGrupEkle, ozelGrupSil,
  } = useProsedurler();

  const allKategoriler = tumKategoriler(ozelKategoriler, gizliVarsayilanKategoriler);
  const allSorumlular  = tumSorumlular(ozelSorumlular, gizliVarsayilanSorumlular);

  const [acikGrup,     setAcikGrup]     = useState<string | null>(null);
  const [miniAcik,     setMiniAcik]     = useState<Set<string>>(new Set());
  const [ozelModal,    setOzelModal]    = useState<string | null>(null);
  const [duzenleModal, setDuzenleModal] = useState<{ madde: ChecklistSablon | OzelSablonMaddesi; grupId: string } | null>(null);
  const [duzenleForm,  setDuzenleForm]  = useState<Omit<OzelSablonMaddesi, "id" | "grupId">>({
    baslik: "", kategori: allKategoriler[0] ?? "Diğer",
    sikligi: "haftalik" as ChecklistSikligi, ozelGunSayisi: 30,
    sorumlu: allSorumlular[0] ?? "Yönetici", kritiklik: "orta",
  });

  const openDuzenle = (m: ChecklistSablon | OzelSablonMaddesi, grupId: string) => {
    setDuzenleModal({ madde: m, grupId });
    setDuzenleForm({
      baslik: m.baslik, kategori: m.kategori, sikligi: m.sikligi,
      ozelGunSayisi: m.ozelGunSayisi ?? 30, sorumlu: m.sorumlu, kritiklik: m.kritiklik,
    });
  };

  const handleSaveDuzenle = () => {
    if (!duzenleModal) return;
    const { madde, grupId } = duzenleModal;
    if ("id" in madde) {
      ozelSablonMaddesiniGuncelle(madde.id, duzenleForm);
    } else {
      sablonMaddeSil(grupId, madde.baslik);
      sablonMaddeEkle({ ...duzenleForm, id: `${Date.now()}-${Math.random().toString(36).slice(2,7)}`, grupId });
    }
    setDuzenleModal(null);
  };
  const [duzenleGrup,  setDuzenleGrup]  = useState<string | null>(null);
  const [yeniGrupAd,   setYeniGrupAd]   = useState("");
  const [yeniGrupModal, setYeniGrupModal] = useState(false);
  const [yeniGrup, setYeniGrup] = useState<Omit<OzelGrubu, "id">>({
    baslik: "", aciklama: "", riskSeviyesi: "yuksek",
  });
  const [ozelForm, setOzelForm] = useState<Omit<OzelSablonMaddesi, "id" | "grupId">>({
    baslik: "", kategori: allKategoriler[0] ?? "Diğer",
    sikligi: "haftalik" as ChecklistSikligi, ozelGunSayisi: 30,
    sorumlu: allSorumlular[0] ?? "Yönetici", kritiklik: "orta",
  });

  const ekliBasliklar = new Set(checklist.map(c => c.baslik));

  const grupMaddeleri = (grupId: string, builtin: ChecklistSablon[]) => {
    const filtered = builtin.filter(m =>
      !silinenSablonMaddeleri.find(s => s.grupId === grupId && s.baslik === m.baslik)
    );
    const custom = ozelSablonMaddeleri.filter(m => m.grupId === grupId);
    return [...filtered, ...custom];
  };

  // #1: tıklama ekleme/kaldırma
  const handleToggle = (madde: ChecklistSablon | OzelSablonMaddesi) => {
    if (ekliBasliklar.has(madde.baslik)) {
      const item = checklist.find(c => c.baslik === madde.baslik);
      if (item) checklistSil(item.id);
    } else {
      checklistEkle({
        baslik:          madde.baslik,
        kategori:        madde.kategori,
        sikligi:         madde.sikligi,
        ozelGunSayisi:   madde.ozelGunSayisi,
        sorumlu:         madde.sorumlu,
        kritiklik:       madde.kritiklik,
        otomatikKontrol: (madde as ChecklistSablon).otomatikKontrol,
        tamamlandi:      false,
      });
    }
  };

  const handleGrupEkle = (grupId: string, builtin: ChecklistSablon[]) => {
    grupMaddeleri(grupId, builtin)
      .filter(m => !ekliBasliklar.has(m.baslik))
      .forEach(m => handleToggle(m));
  };

  const handleOzelEkle = (grupId: string) => {
    if (!ozelForm.baslik.trim()) return;
    sablonMaddeEkle({ ...ozelForm, id: `${Date.now()}-${Math.random().toString(36).slice(2,7)}`, grupId, baslik: ozelForm.baslik.trim() });
    setOzelForm(f => ({ ...f, baslik: "" }));
    setOzelModal(null);
  };

  const toggleMini = (grupId: string) => {
    setMiniAcik(prev => {
      const next = new Set(prev);
      next.has(grupId) ? next.delete(grupId) : next.add(grupId);
      return next;
    });
  };

  // Tüm gruplar = built-in + custom
  const tumGruplar: Array<{
    id: string; baslik: string; aciklama: string;
    icon: string; riskSeviyesi: "yuksek" | "kritik";
    builtin: ChecklistSablon[];
  }> = [
    ...SOP_SABLON_GRUPLARI.map(g => ({
      id: g.id,
      baslik: ozelGrupAdlari[g.id] ?? g.baslik,
      aciklama: g.aciklama,
      icon: g.icon,
      riskSeviyesi: g.riskSeviyesi,
      builtin: g.maddeler,
    })),
    ...ozelSablonGruplari.map(g => ({
      id: g.id,
      baslik: ozelGrupAdlari[g.id] ?? g.baslik,
      aciklama: g.aciklama,
      icon: "Shield",
      riskSeviyesi: g.riskSeviyesi,
      builtin: [] as ChecklistSablon[],
    })),
  ];

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-start justify-between mb-5 gap-4">
        <div>
          <h2 className="text-sm font-semibold text-white">Kontrol Listesi Şablonları</h2>
          <p className="text-xs text-[#94a3b8] mt-0.5">Hazır şablonlar — tek tıkla kontrol listene ekle veya kaldır</p>
        </div>
        {/* #3: Yeni Grup Ekle */}
        <button
          onClick={() => { setYeniGrup({ baslik: "", aciklama: "", riskSeviyesi: "yuksek" }); setYeniGrupModal(true); }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[rgba(251,192,36,0.12)] text-[#fbc024] text-xs font-bold border border-[rgba(251,192,36,0.25)] hover:bg-[rgba(251,192,36,0.2)] transition-all shrink-0"
        >
          <Plus className="w-3.5 h-3.5" /> Yeni Grup
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {tumGruplar.map(grup => {
          const Icon    = ICONS[grup.icon] ?? Shield;
          const acik    = acikGrup === grup.id;
          const gorMini = miniAcik.has(grup.id);
          const gorunen = grupMaddeleri(grup.id, grup.builtin);
          const tumEkli = gorunen.length > 0 && gorunen.every(m => ekliBasliklar.has(m.baslik));
          const isCustom = grup.id.startsWith("ozel-");
          const katRenk = grup.riskSeviyesi === "kritik"
            ? { color: "#ef4444", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.2)" }
            : { color: "#f97316", bg: "rgba(249,115,22,0.1)", border: "rgba(249,115,22,0.2)" };

          const ozet = gorMini ? gorunen : gorunen.slice(0, 3);
          const fazla = gorunen.length - 3;

          return (
            <div key={grup.id} className="rounded-xl border overflow-hidden"
              style={{ borderColor: acik ? katRenk.color + "40" : "rgba(255,255,255,0.07)", backgroundColor: "rgba(255,255,255,0.02)" }}>

              {/* Kart başlığı */}
              <div className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: katRenk.bg, border: `1px solid ${katRenk.border}` }}>
                    <Icon className="w-4 h-4" style={{ color: katRenk.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    {/* #3: Grup adı düzenleme */}
                    {duzenleGrup === grup.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          value={yeniGrupAd}
                          onChange={e => setYeniGrupAd(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === "Enter") { grupAdGuncelle(grup.id, yeniGrupAd); setDuzenleGrup(null); }
                            if (e.key === "Escape") setDuzenleGrup(null);
                          }}
                          autoFocus
                          className="flex-1 text-sm bg-transparent text-white border-b border-[rgba(251,192,36,0.5)] outline-none pb-0.5"
                        />
                        <button onClick={() => { grupAdGuncelle(grup.id, yeniGrupAd); setDuzenleGrup(null); }}
                          className="text-[#22c55e] hover:text-white transition-colors text-xs font-bold shrink-0">✓</button>
                        <button onClick={() => setDuzenleGrup(null)}
                          className="text-[#94a3b8] hover:text-white transition-colors shrink-0"><X className="w-3 h-3" /></button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-white truncate">{grup.baslik}</p>
                        <button onClick={() => { setDuzenleGrup(grup.id); setYeniGrupAd(grup.baslik); }}
                          className="text-[#64748b] hover:text-[#fbc024] transition-colors shrink-0">
                          <Pencil className="w-3 h-3" />
                        </button>
                        {isCustom && (
                          <button onClick={() => ozelGrupSil(grup.id)}
                            className="text-[#64748b] hover:text-[#ef4444] transition-colors shrink-0">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                    <p className="text-[10px] text-[#94a3b8] mt-0.5 leading-relaxed">{grup.aciklama}</p>
                  </div>
                </div>

                {/* Özet maddeler */}
                <div className="space-y-1 mb-3">
                  {gorunen.length === 0 ? (
                    <p className="text-[10px] text-[#64748b]">Henüz madde yok — "Yönet" ile ekle</p>
                  ) : (
                    <>
                      {ozet.map((m, i) => {
                        const ekli   = ekliBasliklar.has(m.baslik);
                        const krRenk = KRITIKLIK_RENK[m.kritiklik];
                        const isOzel = "id" in m;
                        return (
                          <div key={i} className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: ekli ? "#22c55e" : krRenk.color }} />
                            <span className={`text-xs truncate flex-1 ${ekli ? "text-[#22c55e]" : "text-[#94a3b8]"}`}>{m.baslik}</span>
                            {(m as ChecklistSablon).otomatikKontrol && <Zap className="w-2.5 h-2.5 text-[#fbc024] shrink-0" />}
                            {isOzel && (
                              <button onClick={() => ozelSablonMaddeSil((m as OzelSablonMaddesi).id)}
                                className="w-4 h-4 flex items-center justify-center text-[#64748b] hover:text-[#ef4444] transition-colors shrink-0">
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                      {!gorMini && fazla > 0 && (
                        <button onClick={() => toggleMini(grup.id)}
                          className="text-[10px] text-[#fbc024] hover:text-[#d9a61f] transition-colors font-medium">
                          +{fazla} madde daha ▾
                        </button>
                      )}
                      {gorMini && gorunen.length > 3 && (
                        <button onClick={() => toggleMini(grup.id)}
                          className="text-[10px] text-[#94a3b8] hover:text-white transition-colors">
                          Daha az göster ▴
                        </button>
                      )}
                    </>
                  )}
                </div>

                {/* Aksiyonlar */}
                <div className="flex gap-2">
                  <button onClick={() => setAcikGrup(acik ? null : grup.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-[#94a3b8] border border-[rgba(255,255,255,0.08)] hover:text-white hover:border-[rgba(255,255,255,0.2)] transition-all">
                    {acik ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    {acik ? "Kapat" : "Yönet"}
                  </button>
                  {gorunen.length > 0 && (
                    <button
                      onClick={() => handleGrupEkle(grup.id, grup.builtin)}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all"
                      style={{
                        backgroundColor: tumEkli ? "rgba(34,197,94,0.12)" : katRenk.bg,
                        color:           tumEkli ? "#22c55e" : katRenk.color,
                        border:          `1px solid ${tumEkli ? "rgba(34,197,94,0.3)" : katRenk.border}`,
                      }}>
                      {tumEkli ? <><Check className="w-3.5 h-3.5" /> Eklendi</> : <><Plus className="w-3.5 h-3.5" /> Tümünü</>}
                    </button>
                  )}
                </div>
              </div>

              {/* Yönet paneli */}
              <AnimatePresence>
                {acik && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                    className="overflow-hidden border-t border-[rgba(255,255,255,0.06)]">
                    <div className="p-4 space-y-2">
                      {gorunen.map((m, i) => {
                        const ekli   = ekliBasliklar.has(m.baslik);
                        const krRenk = KRITIKLIK_RENK[m.kritiklik];
                        const isOzel = "id" in m;
                        return (
                          <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-lg"
                            style={{ backgroundColor: ekli ? "rgba(34,197,94,0.06)" : "rgba(255,255,255,0.02)", border: `1px solid ${ekli ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.05)"}` }}>
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-medium ${ekli ? "text-[#22c55e]" : "text-white"}`}>{m.baslik}</p>
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                <span className="text-[10px] text-[#94a3b8]">{SIKLIGI_LABEL[m.sikligi]}</span>
                                {m.sikligi === "ozel" && m.ozelGunSayisi && (
                                  <span className="text-[10px] text-[#94a3b8]">{m.ozelGunSayisi} gün</span>
                                )}
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                                  style={{ color: krRenk.color, backgroundColor: krRenk.bg }}>{m.kritiklik}</span>
                                {(m as ChecklistSablon).otomatikKontrol && (
                                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[rgba(251,192,36,0.12)] text-[#fbc024] flex items-center gap-0.5">
                                    <Zap className="w-2.5 h-2.5" /> Otomatik
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {/* Toggle */}
                              <button
                                onClick={() => handleToggle(m)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg transition-all hover:scale-110"
                                style={{
                                  backgroundColor: ekli ? "rgba(34,197,94,0.12)" : katRenk.bg,
                                  border: `1px solid ${ekli ? "rgba(34,197,94,0.3)" : katRenk.border}`,
                                }}
                                title={ekli ? "Kontrol listesinden kaldır" : "Kontrol listesine ekle"}
                              >
                                {ekli
                                  ? <Check className="w-3.5 h-3.5 text-[#22c55e]" />
                                  : <Plus  className="w-3.5 h-3.5" style={{ color: katRenk.color }} />
                                }
                              </button>
                              {/* Düzenle */}
                              <button
                                onClick={() => openDuzenle(m, grup.id)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg text-[#64748b] hover:text-[#fbc024] border border-[rgba(255,255,255,0.05)] hover:border-[rgba(251,192,36,0.3)] transition-all"
                                title="Maddeyi düzenle"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                              {/* Sil */}
                              <button
                                onClick={() => isOzel
                                  ? ozelSablonMaddeSil((m as OzelSablonMaddesi).id)
                                  : sablonMaddeSil(grup.id, m.baslik)
                                }
                                className="w-7 h-7 flex items-center justify-center rounded-lg text-[#64748b] hover:text-[#ef4444] border border-[rgba(255,255,255,0.05)] hover:border-[rgba(239,68,68,0.3)] transition-all"
                                title="Maddeyi sil"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}

                      {/* Bu gruba özel madde ekle */}
                      <button onClick={() => { setOzelModal(grup.id); setOzelForm(f => ({ ...f, baslik: "" })); }}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-[rgba(255,255,255,0.12)] text-[#94a3b8] text-xs font-medium hover:border-[rgba(251,192,36,0.4)] hover:text-[#fbc024] transition-all">
                        <Plus className="w-3.5 h-3.5" /> Bu gruba madde ekle
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Özel Madde Ekle Modal — #2: KomboSecici blur backdrop */}
      <AnimatePresence>
        {ozelModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setOzelModal(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }} transition={{ duration: 0.18 }}
              className="w-full max-w-sm glass-card rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-bold text-white">Gruba Madde Ekle</h3>
                <button onClick={() => setOzelModal(null)} className="w-8 h-8 flex items-center justify-center rounded-lg text-[#94a3b8] hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-[#94a3b8] font-medium block mb-1.5">Madde Başlığı *</label>
                  <input value={ozelForm.baslik} onChange={e => setOzelForm(f => ({ ...f, baslik: e.target.value }))}
                    placeholder="Kontrol edilecek madde..."
                    className="w-full px-3 py-2.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white placeholder-[#94a3b8] focus:outline-none focus:border-[rgba(251,192,36,0.5)] text-sm transition-colors" />
                </div>
                <div>
                  <label className="text-xs text-[#94a3b8] font-medium block mb-1.5">Sıklık</label>
                  <div className="flex gap-1">
                    {(["gunluk", "haftalik", "aylik", "ozel"] as ChecklistSikligi[]).map(s => (
                      <button key={s} type="button" onClick={() => setOzelForm(f => ({ ...f, sikligi: s }))}
                        className="flex-1 px-1.5 py-1.5 rounded-lg text-[10px] font-medium transition-all border"
                        style={{
                          backgroundColor: ozelForm.sikligi === s ? "rgba(251,192,36,0.15)" : "transparent",
                          color:           ozelForm.sikligi === s ? "#fbc024" : "#94a3b8",
                          borderColor:     ozelForm.sikligi === s ? "rgba(251,192,36,0.3)" : "rgba(255,255,255,0.08)",
                        }}>
                        {SIKLIGI_LABEL[s]}
                      </button>
                    ))}
                  </div>
                  {ozelForm.sikligi === "ozel" && (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-[#94a3b8]">Her</span>
                      <input type="number" min="1" value={ozelForm.ozelGunSayisi ?? 30}
                        onChange={e => setOzelForm(f => ({ ...f, ozelGunSayisi: parseInt(e.target.value) || 1 }))}
                        className="w-20 px-3 py-1.5 rounded-lg bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white text-sm text-center focus:outline-none focus:border-[rgba(251,192,36,0.5)]" />
                      <span className="text-xs text-[#94a3b8]">günde bir</span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-xs text-[#94a3b8] font-medium block mb-1.5">Kritiklik</label>
                  <div className="grid grid-cols-4 gap-1">
                    {(["dusuk", "orta", "yuksek", "kritik"] as Kritiklik[]).map(k => {
                      const r = KRITIKLIK_RENK[k];
                      return (
                        <button key={k} type="button" onClick={() => setOzelForm(f => ({ ...f, kritiklik: k }))}
                          className="py-1.5 rounded-lg text-[10px] font-bold border transition-all"
                          style={{
                            borderColor:     ozelForm.kritiklik === k ? r.color : "rgba(255,255,255,0.08)",
                            backgroundColor: ozelForm.kritiklik === k ? r.bg : "transparent",
                            color:           ozelForm.kritiklik === k ? r.color : "#94a3b8",
                          }}>
                          {k.charAt(0).toUpperCase() + k.slice(1)}
                        </button>
                      );
                    })}
                  </div>
                </div>
                {/* #2: KomboSecici blur backdrop ile */}
                <KomboSecici label="Kategori" secili={ozelForm.kategori}
                  onSecim={v => setOzelForm(f => ({ ...f, kategori: v }))}
                  maddeler={allKategoriler} onEkle={ozelKategoriEkle} onSil={ozelKategoriSil} />
                <KomboSecici label="Sorumlu" secili={ozelForm.sorumlu}
                  onSecim={v => setOzelForm(f => ({ ...f, sorumlu: v }))}
                  maddeler={allSorumlular} onEkle={ozelSorumluEkle} onSil={ozelSorumluSil} />

                <div className="flex gap-3 pt-1">
                  <button onClick={() => setOzelModal(null)}
                    className="flex-1 py-2.5 rounded-xl border border-[rgba(255,255,255,0.1)] text-[#94a3b8] text-sm font-medium hover:bg-[rgba(255,255,255,0.05)] transition-colors">
                    İptal
                  </button>
                  <button onClick={() => ozelModal && handleOzelEkle(ozelModal)}
                    className="flex-1 py-2.5 rounded-xl bg-[#fbc024] text-[#0e172a] text-sm font-bold hover:bg-[#d9a61f] transition-colors">
                    Şablona Ekle
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* #3: Yeni Grup Modal */}
      <AnimatePresence>
        {yeniGrupModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setYeniGrupModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }} transition={{ duration: 0.18 }}
              className="w-full max-w-sm glass-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-bold text-white">Yeni Şablon Grubu</h3>
                <button onClick={() => setYeniGrupModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-[#94a3b8] hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-[#94a3b8] font-medium block mb-1.5">Grup Adı *</label>
                  <input value={yeniGrup.baslik} onChange={e => setYeniGrup(f => ({ ...f, baslik: e.target.value }))}
                    placeholder="örn. Tedarik Zinciri Kontrolleri"
                    className="w-full px-3 py-2.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white placeholder-[#94a3b8] focus:outline-none focus:border-[rgba(251,192,36,0.5)] text-sm transition-colors" />
                </div>
                <div>
                  <label className="text-xs text-[#94a3b8] font-medium block mb-1.5">Açıklama</label>
                  <input value={yeniGrup.aciklama} onChange={e => setYeniGrup(f => ({ ...f, aciklama: e.target.value }))}
                    placeholder="Bu grubun amacı..."
                    className="w-full px-3 py-2.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white placeholder-[#94a3b8] focus:outline-none focus:border-[rgba(251,192,36,0.5)] text-sm transition-colors" />
                </div>
                <div>
                  <label className="text-xs text-[#94a3b8] font-medium block mb-1.5">Risk Seviyesi</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["yuksek", "kritik"] as const).map(r => (
                      <button key={r} type="button" onClick={() => setYeniGrup(f => ({ ...f, riskSeviyesi: r }))}
                        className="py-2 rounded-xl text-xs font-bold border transition-all"
                        style={{
                          borderColor:     yeniGrup.riskSeviyesi === r ? (r === "kritik" ? "#ef4444" : "#f97316") : "rgba(255,255,255,0.08)",
                          backgroundColor: yeniGrup.riskSeviyesi === r ? (r === "kritik" ? "rgba(239,68,68,0.15)" : "rgba(249,115,22,0.15)") : "transparent",
                          color:           yeniGrup.riskSeviyesi === r ? (r === "kritik" ? "#ef4444" : "#f97316") : "#94a3b8",
                        }}>
                        {r === "kritik" ? "Kritik" : "Yüksek"}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-1">
                  <button onClick={() => setYeniGrupModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-[rgba(255,255,255,0.1)] text-[#94a3b8] text-sm font-medium hover:bg-[rgba(255,255,255,0.05)] transition-colors">
                    İptal
                  </button>
                  <button
                    onClick={() => {
                      if (!yeniGrup.baslik.trim()) return;
                      ozelGrupEkle({ ...yeniGrup, baslik: yeniGrup.baslik.trim() });
                      setYeniGrupModal(false);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-[#fbc024] text-[#0e172a] text-sm font-bold hover:bg-[#d9a61f] transition-colors">
                    Grubu Oluştur
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Madde Düzenleme Modali */}
      <AnimatePresence>
        {duzenleModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setDuzenleModal(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }} transition={{ duration: 0.18 }}
              className="w-full max-w-sm glass-card rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-base font-bold text-white">Maddeyi Düzenle</h3>
                  <p className="text-xs text-[#94a3b8] mt-0.5">Değişiklikler yalnızca bu şablonu etkiler</p>
                </div>
                <button onClick={() => setDuzenleModal(null)} className="w-8 h-8 flex items-center justify-center rounded-lg text-[#94a3b8] hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                {/* Başlık */}
                <div>
                  <label className="text-xs text-[#94a3b8] font-medium block mb-1.5">Madde Başlığı *</label>
                  <input value={duzenleForm.baslik} onChange={e => setDuzenleForm(f => ({ ...f, baslik: e.target.value }))}
                    placeholder="Kontrol edilecek madde..."
                    className="w-full px-3 py-2.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white placeholder-[#94a3b8] focus:outline-none focus:border-[rgba(251,192,36,0.5)] text-sm transition-colors" />
                </div>

                {/* Sıklık */}
                <div>
                  <label className="text-xs text-[#94a3b8] font-medium block mb-1.5">Sıklık</label>
                  <div className="flex gap-1">
                    {(["gunluk", "haftalik", "aylik", "ozel"] as ChecklistSikligi[]).map(s => (
                      <button key={s} type="button" onClick={() => setDuzenleForm(f => ({ ...f, sikligi: s }))}
                        className="flex-1 px-1.5 py-1.5 rounded-lg text-[10px] font-medium transition-all border"
                        style={{
                          backgroundColor: duzenleForm.sikligi === s ? "rgba(251,192,36,0.15)" : "transparent",
                          color:           duzenleForm.sikligi === s ? "#fbc024" : "#94a3b8",
                          borderColor:     duzenleForm.sikligi === s ? "rgba(251,192,36,0.3)" : "rgba(255,255,255,0.08)",
                        }}>
                        {SIKLIGI_LABEL[s]}
                      </button>
                    ))}
                  </div>
                  {duzenleForm.sikligi === "ozel" && (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-[#94a3b8]">Her</span>
                      <input type="number" min="1" value={duzenleForm.ozelGunSayisi ?? 30}
                        onChange={e => setDuzenleForm(f => ({ ...f, ozelGunSayisi: parseInt(e.target.value) || 1 }))}
                        className="w-20 px-3 py-1.5 rounded-lg bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white text-sm text-center focus:outline-none focus:border-[rgba(251,192,36,0.5)]" />
                      <span className="text-xs text-[#94a3b8]">günde bir</span>
                    </div>
                  )}
                </div>

                {/* Kritiklik */}
                <div>
                  <label className="text-xs text-[#94a3b8] font-medium block mb-1.5">Kritiklik</label>
                  <div className="grid grid-cols-4 gap-1">
                    {(["dusuk", "orta", "yuksek", "kritik"] as Kritiklik[]).map(k => {
                      const r = KRITIKLIK_RENK[k];
                      return (
                        <button key={k} type="button" onClick={() => setDuzenleForm(f => ({ ...f, kritiklik: k }))}
                          className="py-1.5 rounded-lg text-[10px] font-bold border transition-all"
                          style={{
                            borderColor:     duzenleForm.kritiklik === k ? r.color : "rgba(255,255,255,0.08)",
                            backgroundColor: duzenleForm.kritiklik === k ? r.bg : "transparent",
                            color:           duzenleForm.kritiklik === k ? r.color : "#94a3b8",
                          }}>
                          {k.charAt(0).toUpperCase() + k.slice(1)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <KomboSecici label="Kategori" secili={duzenleForm.kategori}
                  onSecim={v => setDuzenleForm(f => ({ ...f, kategori: v }))}
                  maddeler={allKategoriler} onEkle={ozelKategoriEkle} onSil={ozelKategoriSil} />
                <KomboSecici label="Sorumlu" secili={duzenleForm.sorumlu}
                  onSecim={v => setDuzenleForm(f => ({ ...f, sorumlu: v }))}
                  maddeler={allSorumlular} onEkle={ozelSorumluEkle} onSil={ozelSorumluSil} />

                <div className="flex gap-3 pt-1">
                  <button onClick={() => setDuzenleModal(null)}
                    className="flex-1 py-2.5 rounded-xl border border-[rgba(255,255,255,0.1)] text-[#94a3b8] text-sm font-medium hover:bg-[rgba(255,255,255,0.05)] transition-colors">
                    İptal
                  </button>
                  <button onClick={handleSaveDuzenle} disabled={!duzenleForm.baslik.trim()}
                    className="flex-1 py-2.5 rounded-xl bg-[#fbc024] text-[#0e172a] text-sm font-bold hover:bg-[#d9a61f] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                    Kaydet
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
