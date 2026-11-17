"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, DollarSign, Package, Users, UserCheck, Shield,
  ChevronDown, ChevronUp, ChevronRight, Check, Plus, Trash2, X, Pencil, RotateCcw,
} from "lucide-react";
import { useGeriAl } from "@/store/geriAl";
import {
  SOP_SABLON_GRUPLARI, SIKLIGI_LABEL, KRITIKLIK_RENK,
  type ChecklistSablon, type ChecklistSikligi, type Kritiklik,
} from "@/lib/prosedur-data";
import {
  useProsedurler, tumKategoriler, tumSorumlular,
  type OzelSablonMaddesi, type OzelGrubu,
} from "@/store/prosedurler";
import { onaylaSil } from "@/lib/onay";
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
    gizliChecklistGrupIdleri, checklistGrupGizle, checklistGrupGoster,
  } = useProsedurler();
  const geriAl = useGeriAl.getState;

  const allKategoriler = tumKategoriler(ozelKategoriler, gizliVarsayilanKategoriler);
  const allSorumlular  = tumSorumlular(ozelSorumlular, gizliVarsayilanSorumlular);

  const [gizliPaneliAcik, setGizliPaneliAcik] = useState(false);
  const [acikGrup,      setAcikGrup]      = useState<string | null>(null);
  const [acikSablonlar, setAcikSablonlar] = useState<Set<string>>(new Set());
  const [ozelModal,     setOzelModal]     = useState<string | null>(null);
  const [duzenleModal,  setDuzenleModal]  = useState<{ madde: ChecklistSablon | OzelSablonMaddesi; grupId: string } | null>(null);
  const [duzenleForm,   setDuzenleForm]   = useState<Omit<OzelSablonMaddesi, "id" | "grupId">>({
    baslik: "", kategori: allKategoriler[0] ?? "Diğer",
    sikligi: "haftalik" as ChecklistSikligi, ozelGunSayisi: 30,
    sorumlu: allSorumlular[0] ?? "Yönetici", kritiklik: "orta",
  });

  const toggleSablon = (key: string) =>
    setAcikSablonlar(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });

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

  const [duzenleGrup,   setDuzenleGrup]   = useState<string | null>(null);
  const [yeniGrupAd,    setYeniGrupAd]    = useState("");
  const [yeniGrupModal, setYeniGrupModal] = useState(false);
  const [yeniGrup, setYeniGrup] = useState<Omit<OzelGrubu, "id">>({
    baslik: "", aciklama: "", riskSeviyesi: "yuksek",
  });
  const [ozelForm, setOzelForm] = useState<Omit<OzelSablonMaddesi, "id" | "grupId">>({
    baslik: "", kategori: allKategoriler[0] ?? "Diğer",
    sikligi: "haftalik" as ChecklistSikligi, ozelGunSayisi: 30,
    sorumlu: allSorumlular[0] ?? "Yönetici", kritiklik: "orta",
  });

  // SORUN 1 FIX: silindi olanları dahil etme
  const ekliBasliklar = new Set(checklist.filter(c => !c.silindi).map(c => c.baslik));

  const grupMaddeleri = (grupId: string, builtin: ChecklistSablon[]) => {
    const filtered = builtin.filter(m =>
      !silinenSablonMaddeleri.find(s => s.grupId === grupId && s.baslik === m.baslik)
    );
    const custom = ozelSablonMaddeleri.filter(m => m.grupId === grupId);
    return [...filtered, ...custom];
  };

  // SORUN 1 FIX: silindi olmayanları bul
  const handleToggle = (madde: ChecklistSablon | OzelSablonMaddesi) => {
    if (ekliBasliklar.has(madde.baslik)) {
      const item = checklist.find(c => c.baslik === madde.baslik && !c.silindi);
      if (!item) return;
      checklistSil(item.id);
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

  const handleGrupSil = async (grup: { id: string; baslik: string }) => {
    const isOzel = grup.id.startsWith("ozel-");
    const { onaylandi } = await onaylaSil({ tip: "checklistGrup", isim: grup.baslik });
    if (!onaylandi) return;
    if (isOzel) {
      ozelGrupSil(grup.id);
    } else {
      checklistGrupGizle(grup.id);
    }
    geriAl().goster({
      mesaj: `"${grup.baslik}" grubu kaldırıldı`,
      sureMs: 10000,
      geriAlFn: async () => {
        if (isOzel) return;
        checklistGrupGoster(grup.id);
      },
    });
  };

  const tumGruplar: Array<{
    id: string; baslik: string; aciklama: string;
    icon: string; riskSeviyesi: "yuksek" | "kritik";
    builtin: ChecklistSablon[];
  }> = [
    ...SOP_SABLON_GRUPLARI
      .filter(g => !gizliChecklistGrupIdleri.includes(g.id))
      .map(g => ({
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
    <div className="card rounded-2xl p-5">
      <div className="flex items-start justify-between mb-5 gap-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-950">Kontrol Listesi Şablonları</h2>
          <p className="text-xs text-gray-500 mt-0.5">Tek tıkla kontrol listene ekle — hazır periyodik kontrol maddeleri</p>
        </div>
        <button
          onClick={() => { setYeniGrup({ baslik: "", aciklama: "", riskSeviyesi: "yuksek" }); setYeniGrupModal(true); }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-(--forest) text-white text-xs font-medium hover:opacity-90 transition-all shrink-0"
        >
          <Plus className="w-3.5 h-3.5" /> Yeni Grup
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {tumGruplar.map(grup => {
          const Icon    = ICONS[grup.icon] ?? Shield;
          const acik    = acikGrup === grup.id;
          const gorunen = grupMaddeleri(grup.id, grup.builtin);
          const tumEkli = gorunen.length > 0 && gorunen.every(m => ekliBasliklar.has(m.baslik));
          const isCustom = grup.id.startsWith("ozel-");
          // Özette sadece ilk 3 madde
          const ozet = gorunen.slice(0, 3);

          return (
            <div key={grup.id} className={`rounded-xl border overflow-hidden bg-white ${acik ? "border-gray-300" : "border-gray-200"}`}>
              <div className="p-4">
                {/* Başlık */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-gray-100 border border-gray-200">
                    <Icon className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
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
                          className="flex-1 text-sm bg-transparent text-gray-800 border-b border-gray-300 outline-none pb-0.5"
                        />
                        <button onClick={() => { grupAdGuncelle(grup.id, yeniGrupAd); setDuzenleGrup(null); }}
                          className="text-[#22c55e] hover:text-gray-800 transition-colors text-xs font-bold shrink-0">✓</button>
                        <button onClick={() => setDuzenleGrup(null)}
                          className="text-gray-400 hover:text-gray-800 transition-colors shrink-0"><X className="w-3 h-3" /></button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-gray-950 truncate">{grup.baslik}</p>
                        <button onClick={() => { setDuzenleGrup(grup.id); setYeniGrupAd(grup.baslik); }}
                          className="text-gray-400 hover:text-gray-600 transition-colors shrink-0">
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleGrupSil(grup)}
                          className="text-gray-400 hover:text-[#C97676] transition-colors shrink-0"
                          title="Grubu kaldır"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{grup.aciklama}</p>
                  </div>
                </div>

                {/* Özet maddeler — SOP stili: chevron + başlık + sıklık */}
                <div className="space-y-1 mb-3">
                  {gorunen.length === 0 ? (
                    <p className="text-[10px] text-gray-500">Henüz madde yok — "Yönet" ile ekle</p>
                  ) : (
                    <>
                      {ozet.map((m, i) => {
                        const ekli   = ekliBasliklar.has(m.baslik);
                        const isOzel = "id" in m;
                        const sKey   = `${grup.id}-${m.baslik}`;
                        const expanded = acikSablonlar.has(sKey);
                        return (
                          <div key={i}>
                            <div
                              className="flex items-center gap-1.5 cursor-pointer select-none"
                              onClick={() => toggleSablon(sKey)}
                            >
                              <ChevronRight
                                className={`w-3 h-3 shrink-0 transition-transform duration-150 ${expanded ? "rotate-90" : ""}`}
                                style={{ color: ekli ? "#22c55e" : "#475569" }}
                              />
                              <span className={`text-xs flex-1 leading-snug ${ekli ? "text-[#22c55e]" : "text-gray-700"}`}>
                                {m.baslik}
                              </span>
                              <span className="text-[10px] text-gray-400 shrink-0">
                                {SIKLIGI_LABEL[m.sikligi]}
                              </span>
                              {isOzel && (
                                <button
                                  onClick={e => { e.stopPropagation(); ozelSablonMaddeSil((m as OzelSablonMaddesi).id); }}
                                  className="w-4 h-4 flex items-center justify-center text-gray-400 hover:text-[#ef4444] transition-colors shrink-0"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                            {expanded && (
                              <div className="ml-4 mt-1 mb-0.5 border-l border-gray-200 pl-2">
                                <p className="text-[10px] text-gray-400">
                                  {m.sorumlu}
                                  {m.sikligi === "ozel" && m.ozelGunSayisi ? ` · her ${m.ozelGunSayisi} günde` : ""}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {gorunen.length > 3 && (
                        <p className="text-[10px] text-gray-400 pl-4">+{gorunen.length - 3} madde daha → Yönet</p>
                      )}
                    </>
                  )}
                </div>

                {/* Aksiyonlar */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setAcikGrup(acik ? null : grup.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-gray-500 border border-gray-200 hover:text-gray-800 hover:bg-gray-50 transition-all"
                  >
                    {acik ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    {acik ? "Kapat" : "Yönet"}
                  </button>
                  {gorunen.length > 0 && (
                    <button
                      onClick={() => handleGrupEkle(grup.id, grup.builtin)}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-all"
                    >
                      {tumEkli
                        ? <><Check className="w-3.5 h-3.5 text-[#22c55e]" /> <span className="text-[#22c55e]">Eklendi</span></>
                        : <><Plus className="w-3.5 h-3.5" /> Tümünü</>}
                    </button>
                  )}
                </div>
              </div>

              {/* Yönet paneli */}
              <AnimatePresence>
                {acik && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                    className="overflow-hidden border-t border-gray-200"
                  >
                    <div className="p-4 space-y-2">
                      {gorunen.map((m, i) => {
                        const ekli   = ekliBasliklar.has(m.baslik);
                        const isOzel = "id" in m;
                        const sKey   = `yonet-${grup.id}-${m.baslik}`;
                        const expanded = acikSablonlar.has(sKey);
                        return (
                          <div key={i} className="rounded-lg overflow-hidden border border-gray-100 bg-white">
                            <div className="flex items-start gap-3 px-3 py-2.5">
                              {/* Başlık — tıkla detay gör */}
                              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => toggleSablon(sKey)}>
                                <div className="flex items-center gap-1.5">
                                  <ChevronRight
                                    className={`w-3.5 h-3.5 shrink-0 transition-transform duration-150 ${expanded ? "rotate-90" : ""}`}
                                    style={{ color: ekli ? "#22c55e" : "#475569" }}
                                  />
                                  <p className={`text-xs font-medium leading-snug ${ekli ? "text-[#22c55e]" : "text-gray-950"}`}>
                                    {m.baslik}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 mt-1 ml-5 flex-wrap">
                                  <span className="text-[10px] font-medium text-gray-500 px-1.5 py-0.5 rounded bg-gray-100">
                                    {SIKLIGI_LABEL[m.sikligi]}
                                    {m.sikligi === "ozel" && m.ozelGunSayisi ? ` · ${m.ozelGunSayisi}g` : ""}
                                  </span>
                                  <span className="text-[10px] text-gray-500">{m.sorumlu}</span>
                                </div>
                              </div>
                              {/* Aksiyonlar */}
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  onClick={e => { e.stopPropagation(); handleToggle(m); }}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg border transition-all hover:scale-110"
                                  style={{
                                    backgroundColor: ekli ? "rgba(34,197,94,0.1)" : "transparent",
                                    borderColor:     ekli ? "rgba(34,197,94,0.3)" : "#E2E8F0",
                                  }}
                                  title={ekli ? "Kontrol listesinden kaldır" : "Kontrol listesine ekle"}
                                >
                                  {ekli
                                    ? <Check className="w-3.5 h-3.5 text-[#22c55e]" />
                                    : <Plus  className="w-3.5 h-3.5 text-gray-400" />}
                                </button>
                                <button
                                  onClick={() => openDuzenle(m, grup.id)}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 border border-gray-200 hover:border-gray-300 transition-all"
                                  title="Maddeyi düzenle"
                                >
                                  <Pencil className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => isOzel
                                    ? ozelSablonMaddeSil((m as OzelSablonMaddesi).id)
                                    : sablonMaddeSil(grup.id, m.baslik)
                                  }
                                  className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-[#ef4444] border border-gray-200 hover:border-[rgba(239,68,68,0.3)] transition-all"
                                  title="Maddeyi sil"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                            {/* Detay (expanded) */}
                            {expanded && (
                              <div className="px-4 pb-3 ml-5 border-t border-gray-100">
                                <p className="text-[10px] text-gray-500 pt-2">
                                  Sıklık: <strong>{SIKLIGI_LABEL[m.sikligi]}</strong>
                                  {m.sikligi === "ozel" && m.ozelGunSayisi ? ` · her ${m.ozelGunSayisi} günde` : ""}
                                  {" · "}Sorumlu: <strong>{m.sorumlu}</strong>
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      <button
                        onClick={() => { setOzelModal(grup.id); setOzelForm(f => ({ ...f, baslik: "" })); }}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-gray-200 text-gray-400 text-xs font-medium hover:border-gray-400 hover:text-gray-600 transition-all"
                      >
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

      {/* Gizli gruplar yönetimi */}
      {gizliChecklistGrupIdleri.length > 0 && (
        <div className="mt-4 text-center">
          <button
            onClick={() => setGizliPaneliAcik(p => !p)}
            className="text-xs transition-opacity hover:opacity-75 underline"
            style={{ color: "var(--text-tertiary, #94a3b8)" }}
          >
            {gizliChecklistGrupIdleri.length} gizli grup · Yönet
          </button>

          {gizliPaneliAcik && (
            <div
              className="mt-3 p-3 rounded-lg text-left space-y-2"
              style={{
                background: "var(--bg-secondary, #f8fafc)",
                border: "0.5px solid var(--border-default, rgba(0,0,0,0.08))",
              }}
            >
              <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-secondary, #64748b)" }}>
                Gizli gruplar
              </p>
              {gizliChecklistGrupIdleri.map(id => {
                const g = SOP_SABLON_GRUPLARI.find(x => x.id === id);
                if (!g) return null;
                return (
                  <div key={id} className="flex items-center justify-between gap-2">
                    <span className="text-sm" style={{ color: "var(--text-primary, #1e293b)" }}>{ozelGrupAdlari[id] ?? g.baslik}</span>
                    <button
                      onClick={() => checklistGrupGoster(id)}
                      className="flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-colors hover:opacity-75"
                      style={{ color: "var(--forest)", border: "0.5px solid rgba(15,61,46,0.2)" }}
                    >
                      <RotateCcw className="w-3 h-3" /> Geri Yükle
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Özel Madde Ekle Modal */}
      <AnimatePresence>
        {ozelModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setOzelModal(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }} transition={{ duration: 0.18 }}
              className="w-full max-w-sm card rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-bold text-gray-800">Gruba Madde Ekle</h3>
                <button onClick={() => setOzelModal(null)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-800 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-400 font-medium block mb-1.5">Madde Başlığı *</label>
                  <input value={ozelForm.baslik} onChange={e => setOzelForm(f => ({ ...f, baslik: e.target.value }))}
                    placeholder="Kontrol edilecek madde..."
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-(--leaf) text-sm transition-colors" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-medium block mb-1.5">Sıklık</label>
                  <div className="flex gap-1">
                    {(["gunluk", "haftalik", "aylik", "ozel"] as ChecklistSikligi[]).map(s => (
                      <button key={s} type="button" onClick={() => setOzelForm(f => ({ ...f, sikligi: s }))}
                        className="flex-1 px-1.5 py-1.5 rounded-lg text-[10px] font-medium transition-all border"
                        style={{
                          backgroundColor: ozelForm.sikligi === s ? "var(--mint)" : "transparent",
                          color:           ozelForm.sikligi === s ? "var(--leaf)" : "#94a3b8",
                          borderColor:     ozelForm.sikligi === s ? "var(--forest-200, #B3E8C8)" : "rgba(0,0,0,0.08)",
                        }}>
                        {SIKLIGI_LABEL[s]}
                      </button>
                    ))}
                  </div>
                  {ozelForm.sikligi === "ozel" && (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-gray-400">Her</span>
                      <input type="number" min="1" value={ozelForm.ozelGunSayisi ?? 30}
                        onChange={e => setOzelForm(f => ({ ...f, ozelGunSayisi: parseInt(e.target.value) || 1 }))}
                        className="w-20 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-800 text-sm text-center focus:outline-none focus:border-(--leaf)" />
                      <span className="text-xs text-gray-400">günde bir</span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-medium block mb-1.5">Kritiklik</label>
                  <div className="grid grid-cols-4 gap-1">
                    {(["dusuk", "orta", "yuksek", "kritik"] as Kritiklik[]).map(k => {
                      const r = KRITIKLIK_RENK[k];
                      return (
                        <button key={k} type="button" onClick={() => setOzelForm(f => ({ ...f, kritiklik: k }))}
                          className="py-1.5 rounded-lg text-[10px] font-bold border transition-all"
                          style={{
                            borderColor:     ozelForm.kritiklik === k ? r.color : "rgba(0,0,0,0.08)",
                            backgroundColor: ozelForm.kritiklik === k ? r.bg : "transparent",
                            color:           ozelForm.kritiklik === k ? r.color : "#94a3b8",
                          }}>
                          {k.charAt(0).toUpperCase() + k.slice(1)}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <KomboSecici label="Kategori" secili={ozelForm.kategori}
                  onSecim={v => setOzelForm(f => ({ ...f, kategori: v }))}
                  maddeler={allKategoriler} onEkle={ozelKategoriEkle} onSil={ozelKategoriSil} />
                <KomboSecici label="Sorumlu" secili={ozelForm.sorumlu}
                  onSecim={v => setOzelForm(f => ({ ...f, sorumlu: v }))}
                  maddeler={allSorumlular} onEkle={ozelSorumluEkle} onSil={ozelSorumluSil} />
                <div className="flex gap-3 pt-1">
                  <button onClick={() => setOzelModal(null)}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-400 text-sm font-medium hover:bg-gray-50 transition-colors">
                    İptal
                  </button>
                  <button onClick={() => ozelModal && handleOzelEkle(ozelModal)}
                    className="flex-1 py-2.5 rounded-xl bg-(--forest) text-white text-sm font-bold hover:opacity-90 transition-colors">
                    Şablona Ekle
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Yeni Grup Modal */}
      <AnimatePresence>
        {yeniGrupModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setYeniGrupModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }} transition={{ duration: 0.18 }}
              className="w-full max-w-sm card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-bold text-gray-800">Yeni Şablon Grubu</h3>
                <button onClick={() => setYeniGrupModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-800 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-400 font-medium block mb-1.5">Grup Adı *</label>
                  <input value={yeniGrup.baslik} onChange={e => setYeniGrup(f => ({ ...f, baslik: e.target.value }))}
                    placeholder="örn. Tedarik Zinciri Kontrolleri"
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-(--leaf) text-sm transition-colors" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-medium block mb-1.5">Açıklama</label>
                  <input value={yeniGrup.aciklama} onChange={e => setYeniGrup(f => ({ ...f, aciklama: e.target.value }))}
                    placeholder="Bu grubun amacı..."
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-(--leaf) text-sm transition-colors" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-medium block mb-1.5">Risk Seviyesi</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["yuksek", "kritik"] as const).map(r => (
                      <button key={r} type="button" onClick={() => setYeniGrup(f => ({ ...f, riskSeviyesi: r }))}
                        className="py-2 rounded-xl text-xs font-bold border transition-all"
                        style={{
                          borderColor:     yeniGrup.riskSeviyesi === r ? (r === "kritik" ? "#ef4444" : "#f97316") : "rgba(0,0,0,0.08)",
                          backgroundColor: yeniGrup.riskSeviyesi === r ? (r === "kritik" ? "rgba(239,68,68,0.1)" : "rgba(249,115,22,0.1)") : "transparent",
                          color:           yeniGrup.riskSeviyesi === r ? (r === "kritik" ? "#ef4444" : "#f97316") : "#94a3b8",
                        }}>
                        {r === "kritik" ? "Kritik" : "Yüksek"}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-1">
                  <button onClick={() => setYeniGrupModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-400 text-sm font-medium hover:bg-gray-50 transition-colors">
                    İptal
                  </button>
                  <button
                    onClick={() => {
                      if (!yeniGrup.baslik.trim()) return;
                      ozelGrupEkle({ ...yeniGrup, baslik: yeniGrup.baslik.trim() });
                      setYeniGrupModal(false);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-(--forest) text-white text-sm font-bold hover:opacity-90 transition-colors">
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
              className="w-full max-w-sm card rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-base font-bold text-gray-800">Maddeyi Düzenle</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Değişiklikler yalnızca bu şablonu etkiler</p>
                </div>
                <button onClick={() => setDuzenleModal(null)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-800 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-400 font-medium block mb-1.5">Madde Başlığı *</label>
                  <input value={duzenleForm.baslik} onChange={e => setDuzenleForm(f => ({ ...f, baslik: e.target.value }))}
                    placeholder="Kontrol edilecek madde..."
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-(--leaf) text-sm transition-colors" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-medium block mb-1.5">Sıklık</label>
                  <div className="flex gap-1">
                    {(["gunluk", "haftalik", "aylik", "ozel"] as ChecklistSikligi[]).map(s => (
                      <button key={s} type="button" onClick={() => setDuzenleForm(f => ({ ...f, sikligi: s }))}
                        className="flex-1 px-1.5 py-1.5 rounded-lg text-[10px] font-medium transition-all border"
                        style={{
                          backgroundColor: duzenleForm.sikligi === s ? "var(--mint)" : "transparent",
                          color:           duzenleForm.sikligi === s ? "var(--leaf)" : "#94a3b8",
                          borderColor:     duzenleForm.sikligi === s ? "var(--forest-200, #B3E8C8)" : "rgba(0,0,0,0.08)",
                        }}>
                        {SIKLIGI_LABEL[s]}
                      </button>
                    ))}
                  </div>
                  {duzenleForm.sikligi === "ozel" && (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-gray-400">Her</span>
                      <input type="number" min="1" value={duzenleForm.ozelGunSayisi ?? 30}
                        onChange={e => setDuzenleForm(f => ({ ...f, ozelGunSayisi: parseInt(e.target.value) || 1 }))}
                        className="w-20 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-800 text-sm text-center focus:outline-none focus:border-(--leaf)" />
                      <span className="text-xs text-gray-400">günde bir</span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-medium block mb-1.5">Kritiklik</label>
                  <div className="grid grid-cols-4 gap-1">
                    {(["dusuk", "orta", "yuksek", "kritik"] as Kritiklik[]).map(k => {
                      const r = KRITIKLIK_RENK[k];
                      return (
                        <button key={k} type="button" onClick={() => setDuzenleForm(f => ({ ...f, kritiklik: k }))}
                          className="py-1.5 rounded-lg text-[10px] font-bold border transition-all"
                          style={{
                            borderColor:     duzenleForm.kritiklik === k ? r.color : "rgba(0,0,0,0.08)",
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
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-400 text-sm font-medium hover:bg-gray-50 transition-colors">
                    İptal
                  </button>
                  <button onClick={handleSaveDuzenle} disabled={!duzenleForm.baslik.trim()}
                    className="flex-1 py-2.5 rounded-xl bg-(--forest) text-white text-sm font-bold hover:opacity-90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
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
