"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, DollarSign, Package, Users, UserCheck, Shield,
  ChevronDown, ChevronUp, ChevronRight, Check, Plus, Trash2, X, Pencil, List,
} from "lucide-react";
import {
  SOP_BELGE_SABLON_GRUPLARI, getKategoriRenk,
  type SopBelgeSablon,
} from "@/lib/prosedur-data";
import {
  useProsedurler, tumKategoriler, tumSorumlular,
  type OzelSopSablonMaddesi, type OzelGrubu,
} from "@/store/prosedurler";
import KomboSecici from "./KomboSecici";

const ICONS: Record<string, React.ElementType> = {
  TrendingUp, DollarSign, Package, Users, UserCheck, Shield,
};

export default function SopSablonPanel() {
  const {
    prosedurler, prosedurEkle, prosedurSil,
    silinenSopSablonMaddeleri, sopSablonMaddeSil,
    ozelSopSablonMaddeleri, sopSablonMaddeEkle, ozelSopSablonMaddeSil, ozelSopSablonMaddesiniGuncelle,
    ozelKategoriler, ozelSorumlular,
    ozelKategoriEkle, ozelKategoriSil, ozelSorumluEkle, ozelSorumluSil,
    gizliVarsayilanKategoriler, gizliVarsayilanSorumlular,
    ozelSopGrupAdlari, sopGrupAdGuncelle,
    ozelSopSablonGruplari, ozelSopGrupEkle, ozelSopGrupSil,
  } = useProsedurler();

  const allKategoriler = tumKategoriler(ozelKategoriler, gizliVarsayilanKategoriler);
  const allSorumlular  = tumSorumlular(ozelSorumlular, gizliVarsayilanSorumlular);

  const [acikGrup,      setAcikGrup]      = useState<string | null>(null);
  const [miniAcik,      setMiniAcik]      = useState<Set<string>>(new Set());
  const [acikSablonlar, setAcikSablonlar] = useState<Set<string>>(new Set());

  const toggleSablon = (key: string) =>
    setAcikSablonlar(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });

  // Düzenleme state
  const [duzenleModal, setDuzenleModal] = useState<{ sablon: SopBelgeSablon | OzelSopSablonMaddesi; grupId: string } | null>(null);
  const [duzenleForm, setDuzenleForm]   = useState<Omit<OzelSopSablonMaddesi, "id" | "grupId">>({
    baslik: "", aciklama: "", kategori: allKategoriler[0] ?? "Diğer",
    sorumlu: allSorumlular[0] ?? "Yönetici", adimlar: [{ sira: 1, aciklama: "" }],
  });

  const openDuzenle = (s: SopBelgeSablon | OzelSopSablonMaddesi, grupId: string) => {
    setDuzenleModal({ sablon: s, grupId });
    setDuzenleForm({
      baslik: s.baslik, aciklama: s.aciklama, kategori: s.kategori,
      sorumlu: s.sorumlu, adimlar: s.adimlar.map(a => ({ ...a })),
    });
  };

  const handleSaveDuzenle = () => {
    if (!duzenleModal) return;
    const { sablon, grupId } = duzenleModal;
    const adimlar = duzenleForm.adimlar
      .filter(a => a.aciklama.trim())
      .map((a, i) => ({ sira: i + 1, aciklama: a.aciklama.trim() }));
    const finalForm = { ...duzenleForm, adimlar };
    if ("id" in sablon) {
      // Özel şablon — doğrudan güncelle
      ozelSopSablonMaddesiniGuncelle(sablon.id, finalForm);
    } else {
      // Hazır şablon — sil + özel olarak yeniden ekle
      sopSablonMaddeSil(grupId, sablon.baslik);
      sopSablonMaddeEkle({ ...finalForm, id: `${Date.now()}-${Math.random().toString(36).slice(2,7)}`, grupId });
    }
    setDuzenleModal(null);
  };

  const duzenleAdimEkle = () =>
    setDuzenleForm(f => ({ ...f, adimlar: [...f.adimlar, { sira: f.adimlar.length + 1, aciklama: "" }] }));
  const duzenleAdimGuncelle = (i: number, v: string) =>
    setDuzenleForm(f => ({ ...f, adimlar: f.adimlar.map((a, idx) => idx === i ? { ...a, aciklama: v } : a) }));
  const duzenleAdimSil = (i: number) =>
    setDuzenleForm(f => ({ ...f, adimlar: f.adimlar.filter((_, idx) => idx !== i).map((a, idx) => ({ ...a, sira: idx + 1 })) }));

  const [ozelModal,     setOzelModal]     = useState<string | null>(null);
  const [duzenleGrup,   setDuzenleGrup]   = useState<string | null>(null);
  const [yeniGrupAd,    setYeniGrupAd]    = useState("");
  const [yeniGrupModal, setYeniGrupModal] = useState(false);
  const [yeniGrup, setYeniGrup] = useState<Omit<OzelGrubu, "id">>({
    baslik: "", aciklama: "", riskSeviyesi: "yuksek",
  });
  const [ozelForm, setOzelForm] = useState<Omit<OzelSopSablonMaddesi, "id" | "grupId">>({
    baslik: "", aciklama: "",
    kategori: allKategoriler[0] ?? "Diğer",
    sorumlu: allSorumlular[0] ?? "Yönetici",
    adimlar: [{ sira: 1, aciklama: "" }],
  });

  const ekliBasliklar = new Set(prosedurler.map(p => p.baslik));

  const grupSablonlari = (grupId: string, builtin: SopBelgeSablon[]) => {
    const filtered = builtin.filter(s =>
      !silinenSopSablonMaddeleri.find(x => x.grupId === grupId && x.baslik === s.baslik)
    );
    const custom = ozelSopSablonMaddeleri.filter(s => s.grupId === grupId);
    return [...filtered, ...custom];
  };

  const handleToggle = (sablon: SopBelgeSablon | OzelSopSablonMaddesi) => {
    if (ekliBasliklar.has(sablon.baslik)) {
      const p = prosedurler.find(x => x.baslik === sablon.baslik);
      if (p) prosedurSil(p.id);
    } else {
      prosedurEkle({
        baslik:   sablon.baslik,
        aciklama: sablon.aciklama,
        kategori: sablon.kategori,
        sorumlu:  sablon.sorumlu,
        adimlar:  sablon.adimlar,
      });
    }
  };

  const handleGrupEkle = (grupId: string, builtin: SopBelgeSablon[]) => {
    grupSablonlari(grupId, builtin)
      .filter(s => !ekliBasliklar.has(s.baslik))
      .forEach(s => handleToggle(s));
  };

  const handleOzelEkle = (grupId: string) => {
    if (!ozelForm.baslik.trim()) return;
    const adimlar = ozelForm.adimlar
      .filter(a => a.aciklama.trim())
      .map((a, i) => ({ sira: i + 1, aciklama: a.aciklama.trim() }));
    sopSablonMaddeEkle({
      ...ozelForm,
      id: `${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
      grupId,
      baslik: ozelForm.baslik.trim(),
      adimlar,
    });
    setOzelForm(f => ({ ...f, baslik: "", aciklama: "", adimlar: [{ sira: 1, aciklama: "" }] }));
    setOzelModal(null);
  };

  const adimEkle = () =>
    setOzelForm(f => ({ ...f, adimlar: [...f.adimlar, { sira: f.adimlar.length + 1, aciklama: "" }] }));
  const adimGuncelle = (i: number, v: string) =>
    setOzelForm(f => ({ ...f, adimlar: f.adimlar.map((a, idx) => idx === i ? { ...a, aciklama: v } : a) }));
  const adimSil = (i: number) =>
    setOzelForm(f => ({ ...f, adimlar: f.adimlar.filter((_, idx) => idx !== i).map((a, idx) => ({ ...a, sira: idx + 1 })) }));

  const toggleMini = (grupId: string) => {
    setMiniAcik(prev => {
      const next = new Set(prev);
      next.has(grupId) ? next.delete(grupId) : next.add(grupId);
      return next;
    });
  };

  const tumGruplar: Array<{
    id: string; baslik: string; aciklama: string;
    icon: string; riskSeviyesi: "yuksek" | "kritik";
    builtin: SopBelgeSablon[];
  }> = [
    ...SOP_BELGE_SABLON_GRUPLARI.map(g => ({
      id: g.id,
      baslik: ozelSopGrupAdlari[g.id] ?? g.baslik,
      aciklama: g.aciklama,
      icon: g.icon,
      riskSeviyesi: g.riskSeviyesi,
      builtin: g.sablonlar,
    })),
    ...ozelSopSablonGruplari.map(g => ({
      id: g.id,
      baslik: ozelSopGrupAdlari[g.id] ?? g.baslik,
      aciklama: g.aciklama,
      icon: "Shield",
      riskSeviyesi: g.riskSeviyesi,
      builtin: [] as SopBelgeSablon[],
    })),
  ];

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-start justify-between mb-5 gap-4">
        <div>
          <h2 className="text-sm font-semibold text-white">SOP Belge Şablonları</h2>
          <p className="text-xs text-[#94a3b8] mt-0.5">Tek tıkla SOP listene ekle — adımlar dahil hazır prosedürler</p>
        </div>
        <button
          onClick={() => { setYeniGrup({ baslik: "", aciklama: "", riskSeviyesi: "yuksek" }); setYeniGrupModal(true); }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[rgba(251,192,36,0.12)] text-[#fbc024] text-xs font-bold border border-[rgba(251,192,36,0.25)] hover:bg-[rgba(251,192,36,0.2)] transition-all shrink-0"
        >
          <Plus className="w-3.5 h-3.5" /> Yeni Grup
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {tumGruplar.map(grup => {
          const Icon     = ICONS[grup.icon] ?? Shield;
          const acik     = acikGrup === grup.id;
          const gorMini  = miniAcik.has(grup.id);
          const gorunen  = grupSablonlari(grup.id, grup.builtin);
          const tumEkli  = gorunen.length > 0 && gorunen.every(s => ekliBasliklar.has(s.baslik));
          const isCustom = grup.id.startsWith("sopozel-");
          const katRenk  = grup.riskSeviyesi === "kritik"
            ? { color: "#ef4444", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.2)" }
            : { color: "#f97316", bg: "rgba(249,115,22,0.1)", border: "rgba(249,115,22,0.2)" };

          const ozet = gorMini ? gorunen : gorunen.slice(0, 3);
          const fazla = gorunen.length - 3;

          return (
            <div
              key={grup.id}
              className="rounded-xl border overflow-hidden"
              style={{
                borderColor: acik ? katRenk.color + "40" : "rgba(255,255,255,0.07)",
                backgroundColor: "rgba(255,255,255,0.02)",
              }}
            >
              <div className="p-4">
                {/* Kart başlığı */}
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: katRenk.bg, border: `1px solid ${katRenk.border}` }}
                  >
                    <Icon className="w-4 h-4" style={{ color: katRenk.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    {duzenleGrup === grup.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          value={yeniGrupAd}
                          onChange={e => setYeniGrupAd(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === "Enter") { sopGrupAdGuncelle(grup.id, yeniGrupAd); setDuzenleGrup(null); }
                            if (e.key === "Escape") setDuzenleGrup(null);
                          }}
                          autoFocus
                          className="flex-1 text-sm bg-transparent text-white border-b border-[rgba(251,192,36,0.5)] outline-none pb-0.5"
                        />
                        <button onClick={() => { sopGrupAdGuncelle(grup.id, yeniGrupAd); setDuzenleGrup(null); }}
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
                          <button onClick={() => ozelSopGrupSil(grup.id)}
                            className="text-[#64748b] hover:text-[#ef4444] transition-colors shrink-0">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                    <p className="text-[10px] text-[#94a3b8] mt-0.5 leading-relaxed">{grup.aciklama}</p>
                  </div>
                </div>

                {/* Özet şablonlar */}
                <div className="space-y-1 mb-3">
                  {gorunen.length === 0 ? (
                    <p className="text-[10px] text-[#64748b]">Henüz şablon yok — "Yönet" ile ekle</p>
                  ) : (
                    <>
                      {ozet.map((s, i) => {
                        const ekli    = ekliBasliklar.has(s.baslik);
                        const kRenk   = getKategoriRenk(s.kategori);
                        const isOzel  = "id" in s;
                        const sKey    = `${grup.id}-${s.baslik}`;
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
                              <span className={`text-xs flex-1 leading-snug ${ekli ? "text-[#22c55e]" : "text-[#94a3b8]"}`}>
                                {s.baslik}
                              </span>
                              <span className="text-[10px] text-[#475569] shrink-0 flex items-center gap-0.5">
                                <List className="w-2.5 h-2.5" />{s.adimlar.length}
                              </span>
                              {isOzel && (
                                <button
                                  onClick={e => { e.stopPropagation(); ozelSopSablonMaddeSil((s as OzelSopSablonMaddesi).id); }}
                                  className="w-4 h-4 flex items-center justify-center text-[#475569] hover:text-[#ef4444] transition-colors shrink-0"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                            {expanded && (
                              <div className="ml-4 mt-1 mb-1 space-y-0.5 border-l border-[rgba(255,255,255,0.06)] pl-2">
                                {s.adimlar.map((adim, ai) => (
                                  <p key={ai} className="text-[10px] text-[#475569] leading-relaxed">
                                    <span className="text-[#64748b] font-medium">{adim.sira}.</span> {adim.aciklama}
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {!gorMini && fazla > 0 && (
                        <button onClick={() => toggleMini(grup.id)}
                          className="text-[10px] text-[#fbc024] hover:text-[#d9a61f] transition-colors font-medium">
                          +{fazla} şablon daha ▾
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
                  <button
                    onClick={() => setAcikGrup(acik ? null : grup.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-[#94a3b8] border border-[rgba(255,255,255,0.08)] hover:text-white hover:border-[rgba(255,255,255,0.2)] transition-all"
                  >
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
                      }}
                    >
                      {tumEkli
                        ? <><Check className="w-3.5 h-3.5" /> Eklendi</>
                        : <><Plus  className="w-3.5 h-3.5" /> Tümünü</>}
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
                    className="overflow-hidden border-t border-[rgba(255,255,255,0.06)]"
                  >
                    <div className="p-4 space-y-2">
                      {gorunen.map((s, i) => {
                        const ekli    = ekliBasliklar.has(s.baslik);
                        const kRenk   = getKategoriRenk(s.kategori);
                        const isOzel  = "id" in s;
                        const sKey    = `yonet-${grup.id}-${s.baslik}`;
                        const expanded = acikSablonlar.has(sKey);
                        return (
                          <div
                            key={i}
                            className="rounded-lg overflow-hidden"
                            style={{
                              backgroundColor: ekli ? "rgba(34,197,94,0.06)" : "rgba(255,255,255,0.02)",
                              border: `1px solid ${ekli ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.05)"}`,
                            }}
                          >
                            <div className="flex items-start gap-3 px-3 py-2.5">
                              {/* Başlık — tıkla adımları gör */}
                              <div
                                className="flex-1 min-w-0 cursor-pointer"
                                onClick={() => toggleSablon(sKey)}
                              >
                                <div className="flex items-center gap-1.5">
                                  <ChevronRight
                                    className={`w-3.5 h-3.5 shrink-0 transition-transform duration-150 ${expanded ? "rotate-90" : ""}`}
                                    style={{ color: ekli ? "#22c55e" : "#475569" }}
                                  />
                                  <p className={`text-xs font-medium leading-snug ${ekli ? "text-[#22c55e]" : "text-white"}`}>
                                    {s.baslik}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 mt-1 ml-5 flex-wrap">
                                  <span
                                    className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                                    style={{ color: kRenk.color, backgroundColor: kRenk.bg }}
                                  >
                                    {s.kategori}
                                  </span>
                                  <span className="text-[10px] text-[#64748b]">{s.sorumlu}</span>
                                  <span className="text-[10px] text-[#475569] flex items-center gap-0.5">
                                    <List className="w-2.5 h-2.5" />{s.adimlar.length} adım
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {/* Ekle / Kaldır */}
                                <button
                                  onClick={() => handleToggle(s)}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg transition-all hover:scale-110"
                                  style={{
                                    backgroundColor: ekli ? "rgba(34,197,94,0.12)" : katRenk.bg,
                                    border: `1px solid ${ekli ? "rgba(34,197,94,0.3)" : katRenk.border}`,
                                  }}
                                  title={ekli ? "SOP listesinden kaldır" : "SOP listesine ekle"}
                                >
                                  {ekli
                                    ? <Check className="w-3.5 h-3.5 text-[#22c55e]" />
                                    : <Plus  className="w-3.5 h-3.5" style={{ color: katRenk.color }} />}
                                </button>
                                {/* Düzenle */}
                                <button
                                  onClick={() => openDuzenle(s, grup.id)}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg text-[#64748b] hover:text-[#fbc024] border border-[rgba(255,255,255,0.05)] hover:border-[rgba(251,192,36,0.3)] transition-all"
                                  title="Şablonu düzenle"
                                >
                                  <Pencil className="w-3 h-3" />
                                </button>
                                {/* Sil */}
                                <button
                                  onClick={() => isOzel
                                    ? ozelSopSablonMaddeSil((s as OzelSopSablonMaddesi).id)
                                    : sopSablonMaddeSil(grup.id, s.baslik)
                                  }
                                  className="w-7 h-7 flex items-center justify-center rounded-lg text-[#64748b] hover:text-[#ef4444] border border-[rgba(255,255,255,0.05)] hover:border-[rgba(239,68,68,0.3)] transition-all"
                                  title="Şablonu sil"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                            {/* Adımlar */}
                            {expanded && (
                              <div className="px-4 pb-3 ml-5 space-y-1 border-t border-[rgba(255,255,255,0.04)]">
                                <p className="text-[10px] text-[#475569] font-semibold pt-2 pb-0.5">Adımlar</p>
                                {s.adimlar.map((adim, ai) => (
                                  <div key={ai} className="flex items-start gap-2">
                                    <span className="w-4 h-4 rounded-full bg-[rgba(251,192,36,0.12)] border border-[rgba(251,192,36,0.2)] text-[#fbc024] text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                                      {adim.sira}
                                    </span>
                                    <p className="text-[11px] text-[#64748b] leading-relaxed">{adim.aciklama}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}

                      <button
                        onClick={() => { setOzelModal(grup.id); setOzelForm(f => ({ ...f, baslik: "", aciklama: "", adimlar: [{ sira: 1, aciklama: "" }] })); }}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-[rgba(255,255,255,0.12)] text-[#94a3b8] text-xs font-medium hover:border-[rgba(251,192,36,0.4)] hover:text-[#fbc024] transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" /> Bu gruba şablon ekle
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Özel Şablon Ekle Modal */}
      <AnimatePresence>
        {ozelModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setOzelModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }} transition={{ duration: 0.18 }}
              className="w-full max-w-md glass-card rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-bold text-white">Gruba Şablon Ekle</h3>
                <button onClick={() => setOzelModal(null)} className="w-8 h-8 flex items-center justify-center rounded-lg text-[#94a3b8] hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-[#94a3b8] font-medium block mb-1.5">Prosedür Başlığı *</label>
                  <input
                    value={ozelForm.baslik}
                    onChange={e => setOzelForm(f => ({ ...f, baslik: e.target.value }))}
                    placeholder="örn. Günlük Kasa Sayımı"
                    className="w-full px-3 py-2.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white placeholder-[#94a3b8] focus:outline-none focus:border-[rgba(251,192,36,0.5)] text-sm transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#94a3b8] font-medium block mb-1.5">Açıklama</label>
                  <input
                    value={ozelForm.aciklama}
                    onChange={e => setOzelForm(f => ({ ...f, aciklama: e.target.value }))}
                    placeholder="Bu prosedürün amacı..."
                    className="w-full px-3 py-2.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white placeholder-[#94a3b8] focus:outline-none focus:border-[rgba(251,192,36,0.5)] text-sm transition-colors"
                  />
                </div>

                <KomboSecici label="Kategori" secili={ozelForm.kategori}
                  onSecim={v => setOzelForm(f => ({ ...f, kategori: v }))}
                  maddeler={allKategoriler} onEkle={ozelKategoriEkle} onSil={ozelKategoriSil} />
                <KomboSecici label="Sorumlu" secili={ozelForm.sorumlu}
                  onSecim={v => setOzelForm(f => ({ ...f, sorumlu: v }))}
                  maddeler={allSorumlular} onEkle={ozelSorumluEkle} onSil={ozelSorumluSil} />

                {/* Adımlar */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs text-[#94a3b8] font-medium">Adımlar</label>
                    <button type="button" onClick={adimEkle}
                      className="flex items-center gap-1 text-xs text-[#fbc024] hover:text-[#d9a61f] transition-colors">
                      <Plus className="w-3 h-3" /> Adım Ekle
                    </button>
                  </div>
                  <div className="space-y-2">
                    {ozelForm.adimlar.map((adim, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[rgba(251,192,36,0.15)] border border-[rgba(251,192,36,0.3)] text-[#fbc024] text-[10px] font-bold flex items-center justify-center shrink-0">
                          {i + 1}
                        </span>
                        <input
                          value={adim.aciklama}
                          onChange={e => adimGuncelle(i, e.target.value)}
                          placeholder={`${i + 1}. adımı açıkla...`}
                          className="flex-1 px-2.5 py-1.5 rounded-lg bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.07)] text-white placeholder-[#94a3b8] focus:outline-none focus:border-[rgba(251,192,36,0.4)] text-xs transition-colors"
                        />
                        {ozelForm.adimlar.length > 1 && (
                          <button type="button" onClick={() => adimSil(i)}
                            className="w-6 h-6 flex items-center justify-center rounded text-[#64748b] hover:text-[#ef4444] transition-colors shrink-0">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

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

      {/* Yeni Grup Modal */}
      <AnimatePresence>
        {yeniGrupModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setYeniGrupModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }} transition={{ duration: 0.18 }}
              className="w-full max-w-sm glass-card rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-bold text-white">Yeni Şablon Grubu</h3>
                <button onClick={() => setYeniGrupModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-[#94a3b8] hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-[#94a3b8] font-medium block mb-1.5">Grup Adı *</label>
                  <input
                    value={yeniGrup.baslik}
                    onChange={e => setYeniGrup(f => ({ ...f, baslik: e.target.value }))}
                    placeholder="örn. Üretim & Kalite Kontrol"
                    className="w-full px-3 py-2.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white placeholder-[#94a3b8] focus:outline-none focus:border-[rgba(251,192,36,0.5)] text-sm transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#94a3b8] font-medium block mb-1.5">Açıklama</label>
                  <input
                    value={yeniGrup.aciklama}
                    onChange={e => setYeniGrup(f => ({ ...f, aciklama: e.target.value }))}
                    placeholder="Bu grubun amacı..."
                    className="w-full px-3 py-2.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white placeholder-[#94a3b8] focus:outline-none focus:border-[rgba(251,192,36,0.5)] text-sm transition-colors"
                  />
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
                      ozelSopGrupEkle({ ...yeniGrup, baslik: yeniGrup.baslik.trim() });
                      setYeniGrupModal(false);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-[#fbc024] text-[#0e172a] text-sm font-bold hover:bg-[#d9a61f] transition-colors"
                  >
                    Grubu Oluştur
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Şablon Düzenleme Modali */}
      <AnimatePresence>
        {duzenleModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setDuzenleModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }} transition={{ duration: 0.18 }}
              className="w-full max-w-md glass-card rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-base font-bold text-white">Şablonu Düzenle</h3>
                  <p className="text-xs text-[#94a3b8] mt-0.5">Değişiklikler yalnızca bu şablonu etkiler</p>
                </div>
                <button onClick={() => setDuzenleModal(null)} className="w-8 h-8 flex items-center justify-center rounded-lg text-[#94a3b8] hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                {/* Başlık */}
                <div>
                  <label className="text-xs text-[#94a3b8] font-medium block mb-1.5">Prosedür Başlığı *</label>
                  <input
                    value={duzenleForm.baslik}
                    onChange={e => setDuzenleForm(f => ({ ...f, baslik: e.target.value }))}
                    placeholder="Prosedür adı..."
                    className="w-full px-3 py-2.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white placeholder-[#94a3b8] focus:outline-none focus:border-[rgba(251,192,36,0.5)] text-sm transition-colors"
                  />
                </div>

                {/* Açıklama */}
                <div>
                  <label className="text-xs text-[#94a3b8] font-medium block mb-1.5">Açıklama</label>
                  <input
                    value={duzenleForm.aciklama}
                    onChange={e => setDuzenleForm(f => ({ ...f, aciklama: e.target.value }))}
                    placeholder="Bu prosedürün amacı..."
                    className="w-full px-3 py-2.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white placeholder-[#94a3b8] focus:outline-none focus:border-[rgba(251,192,36,0.5)] text-sm transition-colors"
                  />
                </div>

                {/* Kategori & Sorumlu */}
                <KomboSecici label="Kategori" secili={duzenleForm.kategori}
                  onSecim={v => setDuzenleForm(f => ({ ...f, kategori: v }))}
                  maddeler={allKategoriler} onEkle={ozelKategoriEkle} onSil={ozelKategoriSil} />
                <KomboSecici label="Sorumlu" secili={duzenleForm.sorumlu}
                  onSecim={v => setDuzenleForm(f => ({ ...f, sorumlu: v }))}
                  maddeler={allSorumlular} onEkle={ozelSorumluEkle} onSil={ozelSorumluSil} />

                {/* Adımlar */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs text-[#94a3b8] font-medium">Adımlar</label>
                    <button type="button" onClick={duzenleAdimEkle}
                      className="flex items-center gap-1 text-xs text-[#fbc024] hover:text-[#d9a61f] transition-colors">
                      <Plus className="w-3 h-3" /> Adım Ekle
                    </button>
                  </div>
                  <div className="space-y-2">
                    {duzenleForm.adimlar.map((adim, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[rgba(251,192,36,0.15)] border border-[rgba(251,192,36,0.3)] text-[#fbc024] text-[10px] font-bold flex items-center justify-center shrink-0">
                          {i + 1}
                        </span>
                        <input
                          value={adim.aciklama}
                          onChange={e => duzenleAdimGuncelle(i, e.target.value)}
                          placeholder={`${i + 1}. adımı açıkla...`}
                          className="flex-1 px-2.5 py-1.5 rounded-lg bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.07)] text-white placeholder-[#94a3b8] focus:outline-none focus:border-[rgba(251,192,36,0.4)] text-xs transition-colors"
                        />
                        {duzenleForm.adimlar.length > 1 && (
                          <button type="button" onClick={() => duzenleAdimSil(i)}
                            className="w-6 h-6 flex items-center justify-center rounded text-[#64748b] hover:text-[#ef4444] transition-colors shrink-0">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-1">
                  <button onClick={() => setDuzenleModal(null)}
                    className="flex-1 py-2.5 rounded-xl border border-[rgba(255,255,255,0.1)] text-[#94a3b8] text-sm font-medium hover:bg-[rgba(255,255,255,0.05)] transition-colors">
                    İptal
                  </button>
                  <button
                    onClick={handleSaveDuzenle}
                    disabled={!duzenleForm.baslik.trim()}
                    className="flex-1 py-2.5 rounded-xl bg-[#fbc024] text-[#0e172a] text-sm font-bold hover:bg-[#d9a61f] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
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
