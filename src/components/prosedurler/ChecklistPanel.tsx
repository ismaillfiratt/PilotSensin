"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Circle, RotateCcw, Plus, Trash2, Lock, Zap, X } from "lucide-react";
import {
  getKategoriRenk, KRITIKLIK_RENK,
  isDue, uyumSkoru,
  type ChecklistSikligi, type OtomatikKontrol, type Kritiklik,
} from "@/lib/prosedur-data";
import { useNakit }    from "@/store/nakit";
import { useGorevler } from "@/store/gorevler";
import { useStok }     from "@/store/stok";
import { stokDurumu }  from "@/lib/stok-data";
import { useProsedurler, tumKategoriler, tumSorumlular } from "@/store/prosedurler";
import { onaylaSil } from "@/lib/onay";
import { useGeriAl } from "@/store/geriAl";
import KomboSecici from "./KomboSecici";

type SiklikSekmesi = "tumu" | ChecklistSikligi;

// Sekme bar (Tümü dahil)
const SEKME_LISTESI: { value: SiklikSekmesi; label: string }[] = [
  { value: "tumu",     label: "Tümü"     },
  { value: "gunluk",   label: "Günlük"   },
  { value: "haftalik", label: "Haftalık" },
  { value: "aylik",    label: "Aylık"    },
  { value: "ozel",     label: "Özel"     },
];

// Modal sıklık seçici (Tümü hariç)
const SIKLIGI_LISTESI: { value: ChecklistSikligi; label: string }[] = [
  { value: "gunluk",   label: "Günlük"   },
  { value: "haftalik", label: "Haftalık" },
  { value: "aylik",    label: "Aylık"    },
  { value: "ozel",     label: "Özel"     },
];

const SIKLIGI_LABEL: Record<string, string> = {
  gunluk: "Günlük", haftalik: "Haftalık", aylik: "Aylık", ozel: "Özel",
};

const SIKLIK_SIRA: Record<string, number> = {
  gunluk: 1, haftalik: 2, aylik: 3, ozel: 4,
};

// ── Otomatik kontrol badge ───────────────────────────────────────────────
function OtomatikBadge({ tip }: { tip: OtomatikKontrol }) {
  const { islemler } = useNakit();
  const { gorevler } = useGorevler();
  const { urunler }  = useStok();

  let aktif = false; let label = "";
  if (tip === "nakit_negatif") {
    const gelir = islemler.filter(i => i.tip === "gelir").reduce((s, i) => s + i.tutarKurus, 0);
    const gider = islemler.filter(i => i.tip === "gider").reduce((s, i) => s + i.tutarKurus, 0);
    aktif = gelir - gider < 0 && islemler.length > 0;
    label = aktif ? "Negatif nakit akışı" : "Nakit akışı sağlıklı";
  } else if (tip === "kritik_stok") {
    const n = urunler.filter(u => stokDurumu(u) === "kritik").length;
    aktif = n > 0;
    label = aktif ? `${n} kritik stok` : "Stok sağlıklı";
  } else if (tip === "gecik_gorev") {
    const n = gorevler.filter(g => g.durum !== "tamamlandi" && new Date(g.sonTarih) < new Date()).length;
    aktif = n > 0;
    label = aktif ? `${n} gecikmiş görev` : "Görevler güncel";
  }

  return (
    <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
      style={{
        backgroundColor: aktif ? "rgba(239,68,68,0.15)" : "rgba(34,197,94,0.15)",
        color: aktif ? "#ef4444" : "#22c55e",
      }}>
      <Zap className="w-2.5 h-2.5" />{label}
    </span>
  );
}

// ── Ana bileşen ──────────────────────────────────────────────────────────
interface YeniForm {
  baslik: string; kategori: string; sorumlu: string;
  kritiklik: Kritiklik; sikligi: ChecklistSikligi; ozelGunSayisi: number;
}

export default function ChecklistPanel() {
  const {
    checklist, checklistToggle, checklistSil, checklistEkle, checklistSifirla,
    ozelKategoriler, ozelSorumlular, ozelKategoriEkle, ozelKategoriSil, ozelSorumluEkle, ozelSorumluSil,
    gizliVarsayilanKategoriler, gizliVarsayilanSorumlular,
  } = useProsedurler();

  const allKategoriler = tumKategoriler(ozelKategoriler, gizliVarsayilanKategoriler);
  const allSorumlular  = tumSorumlular(ozelSorumlular, gizliVarsayilanSorumlular);

  const [sekme,      setSekme]      = useState<SiklikSekmesi>("tumu");
  const [maddeModal, setMaddeModal] = useState(false);
  const [yeni, setYeni] = useState<YeniForm>({
    baslik: "", kategori: allKategoriler[0] ?? "Finansal Sağlık",
    sorumlu: allSorumlular[0] ?? "Yönetici",
    kritiklik: "orta", sikligi: "gunluk", ozelGunSayisi: 30,
  });

  const acSekme = (s: SiklikSekmesi) => {
    setSekme(s);
    if (s !== "tumu") setYeni(f => ({ ...f, sikligi: s }));
  };

  const sekmeCounts = useMemo(() => ({
    tumu:     checklist.filter(c => !c.silindi).length,
    gunluk:   checklist.filter(c => !c.silindi && c.sikligi === "gunluk").length,
    haftalik: checklist.filter(c => !c.silindi && c.sikligi === "haftalik").length,
    aylik:    checklist.filter(c => !c.silindi && c.sikligi === "aylik").length,
    ozel:     checklist.filter(c => !c.silindi && (c.sikligi === "ozel" || (c as any).sikligi === "uc_aylik")).length,
  }), [checklist]);

  const filtreli = useMemo(() => {
    const base = checklist.filter(c =>
      !c.silindi && (
        sekme === "tumu" ||
        c.sikligi === sekme ||
        (sekme === "ozel" && (c as any).sikligi === "uc_aylik")
      )
    );
    if (sekme === "tumu") {
      return [...base].sort((a, b) => {
        const sa = SIKLIK_SIRA[a.sikligi] ?? 99;
        const sb = SIKLIK_SIRA[b.sikligi] ?? 99;
        return sa - sb;
      });
    }
    return base;
  }, [checklist, sekme]);
  const otomatikler = filtreli.filter(c => c.otomatikKontrol);
  const manuellar   = filtreli.filter(c => !c.otomatikKontrol);

  const tamamlananSayisi = manuellar.filter(c => !isDue(c)).length;
  const toplamManuel     = manuellar.length;
  const oran     = toplamManuel > 0 ? (tamamlananSayisi / toplamManuel) * 100 : 0;
  const oranRenk = oran >= 80 ? "#22c55e" : oran >= 50 ? "var(--leaf)" : "#ef4444";
  const uyum     = useMemo(() => uyumSkoru(checklist), [checklist]);

  const tarihFormat = (iso?: string) => iso
    ? new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "short" })
    : "—";

  const handleChecklistSil = async (item: { id: string; baslik: string }) => {
    const { onaylandi } = await onaylaSil({ tip: "checklistMaddesi", isim: item.baslik });
    if (!onaylandi) return;
    await checklistSil(item.id);
    useGeriAl.getState().goster({
      mesaj: `"${item.baslik}" silindi.`,
      sureMs: 10000,
      geriAlFn: async () => useProsedurler.getState().checklistGeriAl(item.id),
    });
  };

  const handleEkle = () => {
    if (!yeni.baslik.trim()) return;
    checklistEkle({
      baslik:           yeni.baslik.trim(),
      kategori:         yeni.kategori,
      sikligi:          yeni.sikligi,
      ozelGunSayisi:    yeni.sikligi === "ozel" ? yeni.ozelGunSayisi : undefined,
      sorumlu:          yeni.sorumlu,
      kritiklik:        yeni.kritiklik,
      tamamlandi:       false,
    });
    setYeni(f => ({ ...f, baslik: "" }));
    setMaddeModal(false);
  };

  return (
    <>
      <div className="card rounded-2xl p-5">
        {/* Başlık */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-800">Kontrol Listesi</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Genel uyum: <span className="font-bold" style={{ color: uyum >= 75 ? "#22c55e" : uyum >= 40 ? "var(--leaf)" : "#ef4444" }}>%{uyum}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => sekme !== "tumu" && checklistSifirla(sekme as ChecklistSikligi)}
              disabled={sekme === "tumu"}
              title={sekme === "tumu" ? "Dönemi sıfırlamak için bir sıklık seç" : "Dönemi sıfırla"}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 border border-gray-200 hover:text-[var(--leaf)] hover:border-[var(--forest-200, #B3E8C8)] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setMaddeModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--forest)] text-white text-xs font-medium hover:opacity-90 transition-all">
              <Plus className="w-3.5 h-3.5" /> Madde Ekle
            </button>
          </div>
        </div>

        {/* Sekme butonları: Tümü | Günlük | Haftalık | Aylık | Özel */}
        <div className="flex gap-1 p-1 rounded-xl bg-gray-50 border border-gray-200 mb-4">
          {SEKME_LISTESI.map(({ value, label }) => {
            const count = sekmeCounts[value as keyof typeof sekmeCounts] ?? 0;
            return (
              <button key={value} onClick={() => acSekme(value)}
                className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: sekme === value ? "rgba(15,61,46,0.08)" : "transparent",
                  color:      sekme === value ? "var(--forest)"       : "var(--text-secondary, #94a3b8)",
                  border:     sekme === value ? "0.5px solid rgba(15,61,46,0.2)" : "0.5px solid transparent",
                }}>
                {label}
                {count > 0 && (
                  <span
                    className="text-[9px] font-bold px-1 rounded-full min-w-[14px] text-center"
                    style={{
                      background: "var(--bg-secondary, rgba(0,0,0,0.06))",
                      color:      "var(--text-tertiary, #94a3b8)",
                    }}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {sekme === "ozel" && (
          <p className="text-xs text-gray-400 mb-3">
            Özel aralıkla tanımlanmış kontroller — her madde kendi gün sayısına göre hatırlatılır.
          </p>
        )}

        {/* İlerleme */}
        {toplamManuel > 0 && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs text-gray-400">{tamamlananSayisi}/{toplamManuel} tamamlandı</span>
              <span className="text-xs font-bold" style={{ color: oranRenk }}>%{Math.round(oran)}</span>
            </div>
            <div className="h-1.5 rounded-full bg-gray-50">
              <motion.div className="h-full rounded-full" style={{ width: `${oran}%`, backgroundColor: oranRenk }}
                initial={{ width: 0 }} animate={{ width: `${oran}%` }} transition={{ duration: 0.5 }} />
            </div>
          </div>
        )}

        {/* Otomatik kontroller */}
        {otomatikler.length > 0 && (
          <div className="mb-3 space-y-2">
            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-[var(--leaf)]" /> Otomatik İzleme
            </p>
            {otomatikler.map(item => (
              <div key={item.id}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-gray-100 bg-white">
                <Lock className="w-4 h-4 text-[var(--leaf)] shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 font-medium truncate">{item.baslik}</p>
                  <p className="text-[10px] text-gray-400">{item.sorumlu}</p>
                </div>
                {item.otomatikKontrol && <OtomatikBadge tip={item.otomatikKontrol} />}
                <button onClick={() => handleChecklistSil(item)}
                  className="w-6 h-6 flex items-center justify-center rounded text-gray-500 hover:text-[#ef4444] transition-colors shrink-0">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Manuel kontroller */}
        <div className="space-y-2">
          {manuellar.length === 0 && otomatikler.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-8">Bu dönem için madde yok.</p>
          )}
          {manuellar.length > 0 && otomatikler.length > 0 && (
            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-1">Manuel Kontroller</p>
          )}
          {manuellar.map((item, i) => {
            const done   = !isDue(item);
            const _kRenk = getKategoriRenk(item.kategori); void _kRenk;
            const krRenk = item.kritiklik ? KRITIKLIK_RENK[item.kritiklik] : null;
            return (
              <motion.div key={item.id}
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-100 bg-white transition-all group">
                {/* Checkbox — toggle: done↔undone */}
                <button
                  onClick={() => !item.otomatikKontrol && checklistToggle(item.id)}
                  disabled={!!item.otomatikKontrol}
                  title={item.otomatikKontrol ? "Bu kontrol otomatik yapılır — sistem her 5 dakikada günceller" : undefined}
                  className="shrink-0 disabled:cursor-not-allowed"
                >
                  {done
                    ? <CheckCircle2 className="w-5 h-5 text-[#22c55e]" />
                    : <Circle       className="w-5 h-5 text-gray-400 group-hover:text-[var(--leaf)] transition-colors" />
                  }
                </button>

                {/* İçerik */}
                <div
                  className={`flex-1 min-w-0 ${item.otomatikKontrol ? "cursor-default" : "cursor-pointer"}`}
                  onClick={() => !item.otomatikKontrol && checklistToggle(item.id)}
                >
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-medium leading-snug ${done ? "line-through text-gray-400" : "text-gray-800"}`}>
                      {item.baslik}
                    </p>
                    {sekme === "tumu" && (
                      <span
                        className="text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0"
                        style={{
                          background: "var(--bg-secondary, #f3f4f6)",
                          color: "var(--text-secondary, #6b7280)",
                        }}
                      >
                        {SIKLIGI_LABEL[item.sikligi] ?? item.sikligi}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <p className="text-[10px] text-gray-400">{item.sorumlu}</p>
                    {item.sikligi === "ozel" && item.ozelGunSayisi && (
                      <span className="text-[10px] text-gray-500">her {item.ozelGunSayisi} günde</span>
                    )}
                    {done && item.sonTamamlanma && (
                      <span className="text-[10px] text-[#22c55e]">✓ {tarihFormat(item.sonTamamlanma)}</span>
                    )}
                    {!done && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ backgroundColor: "rgba(239,68,68,0.12)", color: "#ef4444" }}>Bekliyor</span>}
                  </div>
                </div>

                {/* Kritiklik badge */}
                {krRenk && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-lg shrink-0 hidden sm:inline bg-gray-100 text-gray-500">{item.kritiklik}</span>
                )}
                {/* Kategori badge */}
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-lg shrink-0 hidden md:inline bg-gray-100 text-gray-500">
                  {item.kategori.split(" ")[0]}
                </span>

                {/* Sil */}
                <button onClick={() => handleChecklistSil(item)}
                  className="w-6 h-6 flex items-center justify-center rounded text-gray-500 hover:text-[#ef4444] transition-colors shrink-0">
                  <Trash2 className="w-3 h-3" />
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Yeni Madde Modal */}
      <AnimatePresence>
        {maddeModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setMaddeModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }} transition={{ duration: 0.18 }}
              className="w-full max-w-sm card rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-bold text-gray-800">Yeni Kontrol Maddesi</h3>
                <button onClick={() => setMaddeModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-800 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                {/* Başlık */}
                <div>
                  <label className="text-xs text-gray-400 font-medium block mb-1.5">Madde Başlığı *</label>
                  <input value={yeni.baslik} onChange={e => setYeni(f => ({ ...f, baslik: e.target.value }))}
                    placeholder="örn. Haftalık kasa sayımı yap"
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[var(--leaf)] text-sm transition-colors" />
                </div>

                {/* Sıklık */}
                <div>
                  <label className="text-xs text-gray-400 font-medium block mb-1.5">Sıklık</label>
                  <div className="flex gap-1 p-1 rounded-xl bg-gray-50 border border-gray-200">
                    {SIKLIGI_LISTESI.map(({ value, label }) => (
                      <button key={value} type="button" onClick={() => setYeni(f => ({ ...f, sikligi: value }))}
                        className="flex-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all"
                        style={{
                          background: yeni.sikligi === value ? "rgba(15,61,46,0.08)" : "transparent",
                          color:      yeni.sikligi === value ? "var(--forest)"       : "var(--text-secondary, #94a3b8)",
                          border:     yeni.sikligi === value ? "0.5px solid rgba(15,61,46,0.2)" : "0.5px solid transparent",
                        }}>
                        {label}
                      </button>
                    ))}
                  </div>
                  {/* Özel gün girişi */}
                  {yeni.sikligi === "ozel" && (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-gray-400">Her</span>
                      <input type="number" min="1" max="365"
                        value={yeni.ozelGunSayisi}
                        onChange={e => setYeni(f => ({ ...f, ozelGunSayisi: parseInt(e.target.value) || 1 }))}
                        className="w-20 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-800 text-sm text-center focus:outline-none focus:border-[var(--leaf)] transition-colors" />
                      <span className="text-xs text-gray-400">günde bir</span>
                    </div>
                  )}
                </div>

                {/* Kritiklik */}
                <div>
                  <label className="text-xs text-gray-400 font-medium block mb-1.5">Kritiklik</label>
                  <div className="grid grid-cols-4 gap-1">
                    {(["dusuk", "orta", "yuksek", "kritik"] as Kritiklik[]).map(k => {
                      const r = KRITIKLIK_RENK[k];
                      return (
                        <button key={k} type="button" onClick={() => setYeni(f => ({ ...f, kritiklik: k }))}
                          className="py-1.5 rounded-lg text-xs font-bold border transition-all"
                          style={{
                            borderColor:     yeni.kritiklik === k ? r.color : "rgba(255,255,255,0.08)",
                            backgroundColor: yeni.kritiklik === k ? r.bg : "transparent",
                            color:           yeni.kritiklik === k ? r.color : "#94a3b8",
                          }}>
                          {k.charAt(0).toUpperCase() + k.slice(1)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Kategori — özel eklenebilir */}
                <KomboSecici label="Kategori" secili={yeni.kategori}
                  onSecim={v => setYeni(f => ({ ...f, kategori: v }))}
                  maddeler={allKategoriler} onEkle={ozelKategoriEkle} onSil={ozelKategoriSil} />

                {/* Sorumlu — özel eklenebilir */}
                <KomboSecici label="Sorumlu" secili={yeni.sorumlu}
                  onSecim={v => setYeni(f => ({ ...f, sorumlu: v }))}
                  maddeler={allSorumlular} onEkle={ozelSorumluEkle} onSil={ozelSorumluSil} />

                <div className="flex gap-3 pt-1">
                  <button onClick={() => setMaddeModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-400 text-sm font-medium hover:bg-gray-50 transition-colors">
                    İptal
                  </button>
                  <button onClick={handleEkle}
                    className="flex-1 py-2.5 rounded-xl bg-[var(--forest)] text-white text-sm font-bold hover:opacity-90 transition-colors">
                    Ekle
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
