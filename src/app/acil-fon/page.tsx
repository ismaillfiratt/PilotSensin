"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useAcilFon }   from "@/store/acilFon";
import { onaylaSil }    from "@/lib/onay";
import { useGeriAl }    from "@/store/geriAl";
import { mevcutBirikim, type FonHedef } from "@/lib/acil-fon-data";
import { acilFonSkoru } from "@/lib/pilot-score";
import FonGauge         from "@/components/acil-fon/FonGauge";
import RiskPanel        from "@/components/acil-fon/RiskPanel";
import IslemGecmisi     from "@/components/acil-fon/IslemGecmisi";
import HedefModal       from "@/components/acil-fon/HedefModal";

/* ── Para formatı ── */
const tl = (n: number) =>
  (Math.abs(n) / 100).toLocaleString("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 });

/* ── Skor badge (dairesel gauge) ── */
function AcilFonSkorBadge({ skor, durum }: { skor: number; durum: "ok" | "warning" | "critical" }) {
  const renk   = durum === "ok" ? "#10B981" : durum === "warning" ? "#F59E0B" : "#EF4444";
  const etiket = durum === "ok" ? "İyi"     : durum === "warning" ? "Dikkat"  : "Kritik";
  const radius = 30;
  const circ   = 2 * Math.PI * radius;
  const offset = circ - (skor / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-1.5 shrink-0">
      <div className="relative w-20 h-20">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 70 70">
          <circle cx="35" cy="35" r={radius} fill="none" stroke="#F3F4F6" strokeWidth="6" />
          <motion.circle
            cx="35" cy="35" r={radius} fill="none"
            stroke={renk} strokeWidth="6" strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-number font-bold text-base" style={{ color: renk }}>%{skor}</span>
        </div>
      </div>
      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full"
        style={{ color: renk, background: `${renk}15`, border: `1px solid ${renk}30` }}>
        {etiket}
      </span>
    </div>
  );
}

/* ── Ana sayfa ── */
export default function AcilFonPage() {
  const { hedefler, islemler, aktifHedefId, setAktifHedef, hedefEkle, hedefGuncelle, hedefSil } = useAcilFon();

  const [hedefModalAcik, setHedefModalAcik] = useState(false);
  const [duzenleHedef,   setDuzenleHedef]   = useState<FonHedef | null>(null);

  const handleHedefSil = async (h: FonHedef) => {
    const { onaylandi } = await onaylaSil({ tip: "acilFonHedef", isim: h.ad });
    if (!onaylandi) return;
    await hedefSil(h.id);
    useGeriAl.getState().goster({
      mesaj: `"${h.ad}" hedefi silindi.`,
      sureMs: 10000,
      geriAlFn: async () => useAcilFon.getState().hedefGeriAl(h.id),
    });
  };

  const handleHedefKaydet = (h: Omit<FonHedef, "id" | "olusturmaTarih">) => {
    if (duzenleHedef) { hedefGuncelle(duzenleHedef.id, h); setDuzenleHedef(null); }
    else              { hedefEkle(h); }
  };

  /* ── Hesaplamalar ── */
  const aktifHedefler = useMemo(() => hedefler.filter(h => !h.silindi), [hedefler]);
  const temizIslemler = useMemo(() => islemler.filter(i => !i.silindi), [islemler]);

  const toplamMevcut  = useMemo(() => mevcutBirikim(temizIslemler), [temizIslemler]);
  const toplamHedef   = useMemo(() => aktifHedefler.reduce((s, h) => s + h.toplamHedefKurus, 0), [aktifHedefler]);
  const toplamKalan   = useMemo(() => Math.max(0, toplamHedef - toplamMevcut), [toplamHedef, toplamMevcut]);
  const genelYuzde    = toplamHedef > 0 ? Math.round((toplamMevcut / toplamHedef) * 100) : 0;
  const yuzdeRenk     = genelYuzde > 70 ? "#10B981" : genelYuzde > 30 ? "#F59E0B" : "#C97676";

  const aylikHedeflenenToplam = useMemo(
    () => aktifHedefler.reduce((s, h) => s + h.aylikOdemeKurus, 0),
    [aktifHedefler]
  );

  /* Bu ay net birikim */
  const buAyBirikim = useMemo(() => {
    const simdi  = new Date();
    const ayBasi = new Date(simdi.getFullYear(), simdi.getMonth(), 1);
    return temizIslemler
      .filter(i => new Date(i.tarih) >= ayBasi)
      .reduce((s, i) => i.tip === "yatirma" ? s + i.tutarKurus : s - i.tutarKurus, 0);
  }, [temizIslemler]);

  /* Son 3 ay aylık ortalama yatırma */
  const son3AyOrt = useMemo(() => {
    const gun90 = new Date(Date.now() - 90 * 86400000);
    const toplam = temizIslemler
      .filter(i => i.tip === "yatirma" && new Date(i.tarih) >= gun90)
      .reduce((s, i) => s + i.tutarKurus, 0);
    return Math.round(toplam / 3);
  }, [temizIslemler]);

  /* Önceki 3 ay aylık ortalama */
  const onceki3AyOrt = useMemo(() => {
    const gun90  = new Date(Date.now() - 90  * 86400000);
    const gun180 = new Date(Date.now() - 180 * 86400000);
    const toplam = temizIslemler
      .filter(i => i.tip === "yatirma" && new Date(i.tarih) >= gun180 && new Date(i.tarih) < gun90)
      .reduce((s, i) => s + i.tutarKurus, 0);
    return Math.round(toplam / 3);
  }, [temizIslemler]);

  const ayDeltaYuzde = onceki3AyOrt > 0
    ? Math.round(((son3AyOrt - onceki3AyOrt) / onceki3AyOrt) * 100)
    : null;

  /* Hedef durum sayıları */
  const hedefDurumlari = useMemo(() => {
    let kritik = 0, dikkat = 0, yolunda = 0;
    aktifHedefler.forEach(h => {
      const oran = h.toplamHedefKurus > 0
        ? (mevcutBirikim(temizIslemler, h.id) / h.toplamHedefKurus) * 100
        : 0;
      if (oran < 30) kritik++;
      else if (oran <= 70) dikkat++;
      else yolunda++;
    });
    return { kritik, dikkat, yolunda };
  }, [aktifHedefler, temizIslemler]);

  /* Skor */
  const skor = useMemo(
    () => acilFonSkoru(temizIslemler, aktifHedefler),
    [temizIslemler, aktifHedefler]
  );

  /* Tek hedef view için */
  const aktifHedef   = aktifHedefId ? hedefler.find(h => h.id === aktifHedefId) ?? null : null;
  const filtreIslem  = aktifHedefId ? islemler.filter(i => i.hedefId === aktifHedefId) : islemler;
  const gaugeMevcut  = mevcutBirikim(filtreIslem);
  const gaugeHedef   = aktifHedef?.toplamHedefKurus ?? toplamHedef;
  const gaugeAylik   = aktifHedef?.aylikOdemeKurus ?? 0;
  const gaugeAd      = aktifHedef?.ad ?? (hedefler.length > 0 ? "Tüm Hedefler" : "Hedef Yok");

  /* ── Boş durum ── */
  if (aktifHedefler.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-2">
        <section className="space-y-2 py-6">
          <p className="label-caps">ACİL DURUM FONU</p>
        </section>
        <div className="card rounded-2xl p-8 text-center">
          <p className="text-gray-400 text-sm mb-3">Henüz bir tasarruf hedefi eklenmedi.</p>
          <button
            onClick={() => setHedefModalAcik(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--forest)] text-white text-sm font-bold hover:opacity-90 transition-colors"
          >
            <Plus className="w-4 h-4" /> İlk Hedefi Ekle
          </button>
        </div>
        <HedefModal
          open={hedefModalAcik}
          onClose={() => { setHedefModalAcik(false); setDuzenleHedef(null); }}
          mevcutHedef={duzenleHedef ?? undefined}
          onKaydet={handleHedefKaydet}
        />
      </div>
    );
  }

  /* ── Ana render ── */
  return (
    <div className="max-w-6xl mx-auto px-2">

      {/* ── A. Hero ── */}
      <section className="py-6">
        <div className="flex items-start justify-between gap-6">
          <div className="space-y-2">
            <p className="label-caps">ACİL DURUM FONU · {aktifHedefler.length} AKTİF HEDEF</p>
            <div className="flex items-baseline gap-3">
              <span className="hero-number" style={{ color: "var(--forest)" }}>
                {tl(toplamMevcut)}
              </span>
              <span className="text-lg text-gray-400">birikti</span>
            </div>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              {tl(toplamHedef)} toplam hedeften {tl(toplamKalan)} kalan
              {son3AyOrt > 0 && <> · aylık {tl(son3AyOrt)} hız</>}
            </p>
          </div>
          <AcilFonSkorBadge skor={skor.skor} durum={skor.durum} />
        </div>
      </section>

      <hr className="section-rule" />

      {/* ── C. 4 Stat Kart ── */}
      <section className="py-2">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">

          {/* Kart 1 — Aktif Hedef */}
          <div className="stat-card">
            <p className="label-caps mb-2">AKTİF HEDEF</p>
            <p className="font-number font-semibold text-xl text-[#0F172A]">{aktifHedefler.length}</p>
            <p className="text-xs mt-1 font-medium" style={{ color: "var(--text-secondary)" }}>
              {hedefDurumlari.kritik > 0 && (
                <span style={{ color: "#C97676" }}>{hedefDurumlari.kritik} kritik</span>
              )}
              {hedefDurumlari.kritik > 0 && hedefDurumlari.dikkat > 0 && " · "}
              {hedefDurumlari.dikkat > 0 && (
                <span style={{ color: "#F59E0B" }}>{hedefDurumlari.dikkat} dikkat</span>
              )}
              {(hedefDurumlari.kritik > 0 || hedefDurumlari.dikkat > 0) && hedefDurumlari.yolunda > 0 && " · "}
              {hedefDurumlari.yolunda > 0 && (
                <span style={{ color: "#10B981" }}>{hedefDurumlari.yolunda} yolunda</span>
              )}
              {hedefDurumlari.kritik === 0 && hedefDurumlari.dikkat === 0 && hedefDurumlari.yolunda === 0 && "Veri yok"}
            </p>
          </div>

          {/* Kart 2 — Bu Ay Birikim */}
          <div className="stat-card">
            <p className="label-caps mb-2">BU AY BİRİKİM</p>
            <p className="font-number font-semibold text-xl text-[#0F172A]">{tl(buAyBirikim)}</p>
            <p className="text-xs mt-1 font-medium">
              {aylikHedeflenenToplam > 0 ? (
                buAyBirikim >= aylikHedeflenenToplam
                  ? <span style={{ color: "#10B981" }}>↑ hedefe ulaştı</span>
                  : <span style={{ color: "#C97676" }}>↓ hedeflenen {tl(aylikHedeflenenToplam)}'den {tl(aylikHedeflenenToplam - buAyBirikim)} düşük</span>
              ) : <span style={{ color: "var(--text-secondary)" }}>Aylık hedef yok</span>}
            </p>
          </div>

          {/* Kart 3 — Aylık Ortalama */}
          <div className="stat-card">
            <p className="label-caps mb-2">AYLIK ORTALAMA</p>
            <p className="font-number font-semibold text-xl text-[#0F172A]">{tl(son3AyOrt)}</p>
            <p className="text-xs mt-1 font-medium">
              {ayDeltaYuzde !== null ? (
                ayDeltaYuzde >= 0
                  ? <span style={{ color: "#10B981" }}>↑ son 3 aydan %{ayDeltaYuzde} yüksek</span>
                  : <span style={{ color: "#C97676" }}>↓ son 3 aydan %{Math.abs(ayDeltaYuzde)} düşük</span>
              ) : <span style={{ color: "var(--text-secondary)" }}>Önceki dönem yok</span>}
            </p>
          </div>

          {/* Kart 4 — Genel Doluluk */}
          <div className="stat-card">
            <p className="label-caps mb-2">GENEL DOLULUK</p>
            <p className="font-number font-semibold text-xl" style={{ color: yuzdeRenk }}>
              %{genelYuzde}
            </p>
            <div className="mt-2 h-1 rounded-full bg-gray-100 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: yuzdeRenk }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, genelYuzde)}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>
      </section>

      <hr className="section-rule" />

      {/* ── E. Pill Switcher ── */}
      <div className="overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        <div className="flex items-center gap-1 p-1 rounded-xl bg-gray-50 border border-gray-200 w-max min-w-full">
          {/* Tüm Hedefler */}
          <button
            onClick={() => setAktifHedef(null)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap"
            style={{
              backgroundColor: aktifHedefId === null ? "rgba(15,61,46,0.08)" : "transparent",
              color:           aktifHedefId === null ? "var(--forest)"       : "#94a3b8",
            }}
          >
            Tüm Hedefler
          </button>

          {/* Her hedef */}
          {aktifHedefler.map(h => {
            const hMevcut = mevcutBirikim(temizIslemler, h.id);
            const hOran   = h.toplamHedefKurus > 0 ? (hMevcut / h.toplamHedefKurus) * 100 : 0;
            const dotRenk = hOran > 70 ? "#10B981" : hOran >= 30 ? "#F59E0B" : "#C97676";
            const aktif   = aktifHedefId === h.id;
            return (
              <button
                key={h.id}
                onClick={() => setAktifHedef(h.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap"
                style={{
                  backgroundColor: aktif ? "rgba(15,61,46,0.08)" : "transparent",
                  color:           aktif ? "var(--forest)"        : "#64748B",
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: dotRenk }} />
                {h.ad}
              </button>
            );
          })}

          {/* Yeni Hedef */}
          <button
            onClick={() => { setDuzenleHedef(null); setHedefModalAcik(true); }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-[var(--forest)] transition-colors whitespace-nowrap ml-auto"
          >
            <Plus className="w-3.5 h-3.5" /> Yeni
          </button>
        </div>
      </div>

      {/* ── F. İçerik — aktifHedefId'ye göre ── */}
      <section className="py-4">
        {aktifHedefId === null ? (
          /* Tüm Hedefler — editorial satır listesi */
          <div className="rounded-xl border border-black/8 bg-white overflow-hidden">
            {/* Başlık */}
            <div className="hidden lg:grid lg:grid-cols-[minmax(180px,1.4fr)_180px_1fr_60px] gap-4 px-5 py-3 bg-gray-50 border-b border-gray-200 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
              <span>Hedef</span>
              <span>Miktar</span>
              <span>İlerleme</span>
              <span className="text-right">%</span>
            </div>

            <div className="divide-y divide-gray-100">
              {aktifHedefler.map((h, i) => {
                const hMevcut = mevcutBirikim(temizIslemler, h.id);
                const hOran   = h.toplamHedefKurus > 0 ? Math.min(100, (hMevcut / h.toplamHedefKurus) * 100) : 0;
                const hRenk   = hOran > 70 ? "#10B981" : hOran >= 30 ? "#F59E0B" : "#C97676";
                return (
                  <motion.div
                    key={h.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="group px-5 py-3.5 hover:bg-gray-50 transition-colors"
                  >
                    {/* Desktop */}
                    <div className="hidden lg:grid lg:grid-cols-[minmax(180px,1.4fr)_180px_1fr_60px] gap-4 items-center">
                      {/* Hedef adı */}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#0F172A] truncate">{h.ad}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {h.aylikOdemeKurus > 0 && `${tl(h.aylikOdemeKurus)}/ay planı`}
                        </p>
                      </div>
                      {/* Miktar */}
                      <p className="font-number text-sm font-semibold tabular-nums whitespace-nowrap">
                        <span style={{ color: hRenk }}>{tl(hMevcut)}</span>
                        <span className="font-normal text-[11px]" style={{ color: "rgba(0,0,0,0.4)" }}> / {tl(h.toplamHedefKurus)}</span>
                      </p>
                      {/* Progress bar */}
                      <div>
                        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: hRenk }}
                            initial={{ width: 0 }}
                            animate={{ width: `${hOran}%` }}
                            transition={{ duration: 0.6, delay: i * 0.04 }}
                          />
                        </div>
                      </div>
                      {/* Yüzde + aksiyonlar */}
                      <div className="flex items-center justify-end gap-1.5">
                        <span className="font-number text-sm font-medium tabular-nums" style={{ color: hRenk }}>
                          %{Math.round(hOran)}
                        </span>
                        <div className="hidden group-hover:flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => { setDuzenleHedef(h); setHedefModalAcik(true); }}
                            className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-[var(--leaf)] transition-colors"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleHedefSil(h)}
                            className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-[#C97676] transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Mobile — 2 satır */}
                    <div className="lg:hidden space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[#0F172A] truncate">{h.ad}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            {tl(hMevcut)} / {tl(h.toplamHedefKurus)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="font-number text-sm font-semibold tabular-nums" style={{ color: hRenk }}>
                            %{Math.round(hOran)}
                          </span>
                          <button
                            onClick={() => { setDuzenleHedef(h); setHedefModalAcik(true); }}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 border border-gray-200 hover:text-[var(--leaf)] transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleHedefSil(h)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 border border-gray-200 hover:text-[#C97676] transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${hOran}%`, backgroundColor: hRenk }} />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Tek hedef — mevcut FonGauge + RiskPanel */
          <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
            <FonGauge
              ad={gaugeAd}
              mevcut={gaugeMevcut}
              toplamHedefKurus={gaugeHedef}
              aylikOdemeKurus={gaugeAylik}
            />
            <RiskPanel
              islemler={filtreIslem}
              hedef={aktifHedef}
              mevcut={gaugeMevcut}
              toplamHedefKurus={gaugeHedef}
            />
          </div>
        )}
      </section>

      <hr className="section-rule" />

      {/* ── J. İşlem geçmişi ── */}
      <section className="space-y-4 py-2">
        <h2 className="text-sm font-semibold">İşlem Geçmişi</h2>
        <IslemGecmisi />
      </section>

      {/* Modal */}
      <HedefModal
        open={hedefModalAcik}
        onClose={() => { setHedefModalAcik(false); setDuzenleHedef(null); }}
        mevcutHedef={duzenleHedef ?? undefined}
        onKaydet={handleHedefKaydet}
      />
    </div>
  );
}
