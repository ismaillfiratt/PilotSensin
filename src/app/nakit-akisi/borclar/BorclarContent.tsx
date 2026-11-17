"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Calendar, AlertTriangle, CheckCircle2, Clock,
  ChevronDown, Wallet, Trash2, RotateCcw, Plus,
} from "lucide-react";
import { useBorclar } from "@/store/borclar";
import { useSirket } from "@/store/sirket";
import {
  borclarOzet, kalanBorc, odenenTutar, tamamenOdendi,
  taksitDurumu, type Borc, type Taksit, type TaksitDurum,
} from "@/lib/borc-data";
import { taksitOdemeYap, taksitOdemeGeriAl } from "@/lib/islemler/taksitOdeme";
import TaksitOdemeModal from "@/components/borclar/TaksitOdemeModal";
import BorcEkleModal    from "@/components/borclar/BorcEkleModal";
import { onaylaSil } from "@/lib/onay";

/* ═══════════════════════════════════════════════════════
   Helper'lar (UI içi)
   ═══════════════════════════════════════════════════════ */

function formatTL(kurus: number): string {
  return (kurus / 100).toLocaleString("tr-TR", {
    style: "currency", currency: "TRY", minimumFractionDigits: 0, maximumFractionDigits: 0,
  });
}

function formatTLFull(kurus: number): string {
  return (kurus / 100).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " ₺";
}

function formatTarih(iso: string): string {
  return new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
}

function gunFarki(vade: string, simdi = new Date()): number {
  const v = new Date(vade);
  return Math.ceil((v.getTime() - simdi.getTime()) / 86400000);
}

function durumBilgisi(durum: TaksitDurum): { etiket: string; renk: string; bgRgba: string } {
  switch (durum) {
    case "odendi":     return { etiket: "Ödendi",     renk: "var(--text-secondary)", bgRgba: "rgba(120,120,120,0.10)" };
    case "gecikti":    return { etiket: "Gecikmiş",   renk: "var(--color-danger)",   bgRgba: "rgba(201,118,118,0.15)" };
    case "yaklasiyor": return { etiket: "Yaklaşıyor", renk: "var(--color-warning)",  bgRgba: "rgba(212,163,115,0.15)" };
    case "bekliyor":   return { etiket: "Bekliyor",   renk: "var(--text-secondary)", bgRgba: "rgba(120,120,120,0.08)" };
  }
}

/* ═══════════════════════════════════════════════════════
   Borç Kartı — expandable
   ═══════════════════════════════════════════════════════ */

function BorcKarti({
  borc, onTaksitOdeyi, onTaksitGeriAl, onBorcSil,
}: {
  borc: Borc;
  onTaksitOdeyi: (b: Borc, t: Taksit) => void;
  onTaksitGeriAl: (b: Borc, t: Taksit) => void;
  onBorcSil: (b: Borc) => void;
}) {
  const [acik, setAcik] = useState(false);
  const kalan  = kalanBorc(borc);
  const odenen = odenenTutar(borc);
  const ilerleme = borc.toplamTutarKurus > 0 ? (odenen / borc.toplamTutarKurus) * 100 : 0;
  const odendiSay = borc.taksitler.filter((t) => t.odendiAt !== null).length;

  return (
    <motion.div
      layout
      className="card rounded-xl overflow-hidden"
      style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
    >
      {/* Üst — özet */}
      <button
        type="button"
        onClick={() => setAcik(!acik)}
        className="w-full text-left px-4 py-3.5 hover:bg-black/5 transition-colors"
      >
        <div className="flex items-center justify-between gap-3 mb-2.5">
          <p className="text-sm font-semibold flex-1 truncate" style={{ color: "var(--text-primary)" }}>
            {borc.aciklama}
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
              {odendiSay}/{borc.taksitler.length}
            </span>
            <motion.div animate={{ rotate: acik ? 180 : 0 }} transition={{ duration: 0.18 }}>
              <ChevronDown className="w-4 h-4" style={{ color: "var(--text-tertiary)" }} />
            </motion.div>
          </div>
        </div>

        <div className="flex items-end justify-between gap-3 mb-2">
          <div>
            <p className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Kalan borç</p>
            <p className="text-lg font-bold font-number" style={{ color: kalan === 0 ? "var(--text-secondary)" : "var(--text-primary)" }}>
              {formatTLFull(kalan)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Toplam</p>
            <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              {formatTLFull(borc.toplamTutarKurus)}
            </p>
          </div>
        </div>

        {/* İlerleme barı */}
        <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: "rgba(120,120,120,0.15)" }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${ilerleme}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{ background: tamamenOdendi(borc) ? "var(--text-secondary)" : "var(--accent)" }}
          />
        </div>
      </button>

      {/* Genişletilmiş — taksit listesi */}
      <AnimatePresence>
        {acik && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="border-t" style={{ borderColor: "var(--border-subtle)" }}>
              {borc.taksitler.map((t) => {
                const durum = taksitDurumu(t);
                const dInfo = durumBilgisi(durum);
                const gun   = t.odendiAt ? 0 : gunFarki(t.vadeTarihi);

                return (
                  <div key={t.id}
                       className="flex items-center gap-3 px-4 py-3 border-b last:border-0"
                       style={{ borderColor: "var(--border-subtle)" }}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                         style={{ background: dInfo.bgRgba, color: dInfo.renk }}>
                      {t.siraNo}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                        {formatTLFull(t.tutarKurus)}
                      </p>
                      <p className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
                        {t.odendiAt
                          ? <>Ödendi: {formatTarih(t.odendiAt)}</>
                          : <>Vade: {formatTarih(t.vadeTarihi)}
                              {durum === "gecikti"    && <span style={{ color: "var(--color-danger)" }}> · {-gun} gün gecikme</span>}
                              {durum === "yaklasiyor" && <span style={{ color: "var(--color-warning)" }}> · {gun} gün kaldı</span>}
                              {durum === "bekliyor"   && <span> · {gun} gün kaldı</span>}
                            </>
                        }
                      </p>
                    </div>

                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0"
                          style={{ background: dInfo.bgRgba, color: dInfo.renk }}>
                      {dInfo.etiket}
                    </span>

                    {t.odendiAt ? (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onTaksitGeriAl(borc, t); }}
                        title="Ödemeyi geri al"
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-black/5 transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" style={{ color: "var(--text-tertiary)" }} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onTaksitOdeyi(borc, t); }}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-90"
                        style={{ background: "var(--accent)", color: "var(--text-on-forest)" }}
                      >
                        Ödedim
                      </button>
                    )}
                  </div>
                );
              })}

              {/* Borç sil butonu */}
              <div className="px-4 py-3 flex justify-end" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onBorcSil(borc); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:bg-black/5"
                  style={{ color: "var(--color-danger)" }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Bu borcu sil
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   Ana sayfa
   ═══════════════════════════════════════════════════════ */

export default function BorclarContent() {
  const { borclar, sil: borcSil } = useBorclar();
  const { rol } = useSirket();
  const [modalAcik,     setModalAcik]     = useState(false);
  const [borcEkleAcik,  setBorcEkleAcik]  = useState(false);
  const [seciliBorc,    setSeciliBorc]    = useState<Borc | null>(null);
  const [seciliTaksit,  setSeciliTaksit]  = useState<Taksit | null>(null);

  // Filtrelenmiş aktif borçlar
  const aktifBorclar = useMemo(
    () => borclar.filter((b) => !b.silindi),
    [borclar],
  );

  // Özet hesaplamaları
  const ozet = useMemo(() => borclarOzet(borclar), [borclar]);

  // Bu ay ödenecek toplam
  const buAyTutar = useMemo(() => {
    const simdi = new Date();
    const ayBasi = new Date(simdi.getFullYear(), simdi.getMonth(), 1);
    const aySonu = new Date(simdi.getFullYear(), simdi.getMonth() + 1, 0);
    let toplam = 0;
    for (const b of aktifBorclar) {
      for (const t of b.taksitler) {
        if (t.odendiAt) continue;
        const vade = new Date(t.vadeTarihi);
        if (vade >= ayBasi && vade <= aySonu) toplam += t.tutarKurus;
      }
    }
    return toplam;
  }, [aktifBorclar]);

  // Yaklaşan ve gecikmiş taksitler (timeline)
  const acilTaksitler = useMemo(() => {
    const sira: Array<{ borc: Borc; taksit: Taksit; durum: TaksitDurum }> = [];
    for (const b of aktifBorclar) {
      for (const t of b.taksitler) {
        if (t.odendiAt) continue;
        const d = taksitDurumu(t);
        if (d === "gecikti" || d === "yaklasiyor") {
          sira.push({ borc: b, taksit: t, durum: d });
        }
      }
    }
    return sira.sort((a, c) => a.taksit.vadeTarihi.localeCompare(c.taksit.vadeTarihi));
  }, [aktifBorclar]);

  const handleOdemeOnayla = async (params: {
    odemeYontemi: "nakit" | "kart" | "havale" | "cek";
    tarih: string;
    not: string;
  }) => {
    if (!seciliBorc || !seciliTaksit) return;
    const sonuc = await taksitOdemeYap({
      borcId:       seciliBorc.id,
      taksitId:     seciliTaksit.id,
      odemeYontemi: params.odemeYontemi,
      tarih:        new Date(params.tarih + "T12:00:00").toISOString(),
      not:          params.not || undefined,
    });
    if (!sonuc.basarili) {
      throw new Error(sonuc.hata ?? "Ödeme kaydedilemedi");
    }
  };

  const handleTaksitGeriAl = async (borc: Borc, taksit: Taksit) => {
    const onay = await onaylaSil({ tip: "ödeme", isim: `Taksit ${taksit.siraNo}` });
    if (!onay.onaylandi) return;
    await taksitOdemeGeriAl(borc.id, taksit.id);
  };

  const handleBorcSil = async (borc: Borc) => {
    const onay = await onaylaSil({ tip: "borç", isim: borc.aciklama });
    if (!onay.onaylandi) return;
    await borcSil(borc.id);
  };

  return (
    <div className="max-w-6xl mx-auto px-2">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm py-4" style={{ color: "var(--text-secondary)" }}>
        <Link href="/nakit-akisi" className="flex items-center gap-1 hover:underline">
          <ArrowLeft className="w-3.5 h-3.5" />
          Nakit Akışı
        </Link>
        <span>/</span>
        <span style={{ color: "var(--text-primary)" }}>Borçlar</span>
      </div>

      {/* Hero */}
      <section className="py-6">
        <div className="flex items-start justify-between gap-6">
          <div className="space-y-2">
            <p className="label-caps">BORÇLAR · VADELİ ÖDEMELER</p>
            <div className="flex items-baseline gap-3">
              <span className="hero-number">{formatTLFull(ozet.toplamKalanKurus)}</span>
            </div>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              {ozet.aktifBorcSayisi > 0 ? (
                <>
                  {ozet.aktifBorcSayisi} aktif borç
                  {ozet.gecikenTaksitSayisi > 0 && (
                    <> · <span className="font-medium" style={{ color: "var(--color-danger)" }}>
                      {ozet.gecikenTaksitSayisi} gecikmiş taksit
                    </span></>
                  )}
                </>
              ) : (
                <>Aktif borç yok 🎉</>
              )}
            </p>
          </div>
        </div>
      </section>

      <hr className="section-rule" />

      {/* Metric kartları */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 py-2">
        {[
          { label: "TOPLAM KALAN",  deger: formatTLFull(ozet.toplamKalanKurus),    Icon: Wallet,          alt: `${ozet.aktifBorcSayisi} borç` },
          { label: "BU AY ÖDENECEK", deger: formatTLFull(buAyTutar),                 Icon: Calendar,        alt: "Vadesi bu ay olan" },
          { label: "GECİKMİŞ",       deger: formatTLFull(ozet.toplamGecikenKurus),   Icon: AlertTriangle,   alt: `${ozet.gecikenTaksitSayisi} taksit`, kritik: ozet.gecikenTaksitSayisi > 0 },
          { label: "YAKLAŞAN",       deger: ozet.yaklasanTaksitSayisi + " taksit",   Icon: Clock,           alt: "3 gün içinde vadeli" },
        ].map(({ label, deger, Icon, alt, kritik }) => (
          <div key={label} className="card rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="label-caps text-[10px]">{label}</p>
              <Icon className="w-3.5 h-3.5" style={{ color: kritik ? "var(--color-danger)" : "var(--text-tertiary)" }} />
            </div>
            <p className="text-lg font-bold font-number leading-tight"
               style={{ color: kritik ? "var(--color-danger)" : "var(--text-primary)" }}>
              {deger}
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: "var(--text-secondary)" }}>{alt}</p>
          </div>
        ))}
      </section>

      <hr className="section-rule" />

      {/* Acil taksitler — yaklaşan + gecikmiş */}
      {acilTaksitler.length > 0 && (
        <>
          <section className="space-y-3 py-2">
            <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              <AlertTriangle className="w-4 h-4" style={{ color: "var(--color-warning)" }} />
              Yaklaşan ve gecikmiş taksitler
              <span className="text-xs font-normal" style={{ color: "var(--text-secondary)" }}>
                ({acilTaksitler.length})
              </span>
            </h2>
            <div className="card rounded-xl overflow-hidden">
              {acilTaksitler.map(({ borc, taksit, durum }, i) => {
                const dInfo = durumBilgisi(durum);
                const gun   = gunFarki(taksit.vadeTarihi);
                return (
                  <div key={taksit.id}
                       className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? "border-t" : ""}`}
                       style={{ borderColor: "var(--border-subtle)" }}>
                    <div className="w-10 h-10 rounded-lg flex flex-col items-center justify-center shrink-0"
                         style={{ background: dInfo.bgRgba, color: dInfo.renk }}>
                      <span className="text-[10px] font-medium uppercase">{new Date(taksit.vadeTarihi).toLocaleDateString("tr-TR", { month: "short" })}</span>
                      <span className="text-sm font-bold leading-none">{new Date(taksit.vadeTarihi).getDate()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                        {borc.aciklama}
                      </p>
                      <p className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
                        Taksit {taksit.siraNo}/{borc.taksitler.length}
                        {" · "}
                        <span style={{ color: dInfo.renk }}>
                          {durum === "gecikti" ? `${-gun} gün gecikme` : `${gun} gün kaldı`}
                        </span>
                      </p>
                    </div>
                    <p className="text-sm font-bold font-number shrink-0"
                       style={{ color: "var(--text-primary)" }}>
                      {formatTLFull(taksit.tutarKurus)}
                    </p>
                    <button
                      type="button"
                      onClick={() => { setSeciliBorc(borc); setSeciliTaksit(taksit); setModalAcik(true); }}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-90 shrink-0"
                      style={{ background: "var(--accent)", color: "var(--text-on-forest)" }}
                    >
                      Ödedim
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
          <hr className="section-rule" />
        </>
      )}

      {/* Tüm borçlar */}
      <section className="space-y-3 py-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Tüm borçlar
          </h2>
          {rol === "pilot" && (
            <button
              type="button"
              onClick={() => setBorcEkleAcik(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-90"
              style={{ background: "#1F5C44", color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF", fontWeight: 600 }}
            >
              <Plus className="w-3.5 h-3.5" />
              Borç Ekle
            </button>
          )}
        </div>

        {aktifBorclar.length === 0 ? (
          <div className="card rounded-xl p-8 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-3"
                 style={{ background: "rgba(120,120,120,0.10)" }}>
              <CheckCircle2 className="w-6 h-6" style={{ color: "var(--text-secondary)" }} />
            </div>
            <p className="text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>
              Henüz borcunuz yok
            </p>
            <p className="text-xs max-w-md mx-auto" style={{ color: "var(--text-secondary)" }}>
              Stok alımı yaparken &ldquo;Vadeli&rdquo; veya &ldquo;Taksitli&rdquo; seçerseniz borçlarınız buraya kaydedilir.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {aktifBorclar.map((b) => (
              <BorcKarti
                key={b.id}
                borc={b}
                onTaksitOdeyi={(borc, taksit) => {
                  setSeciliBorc(borc);
                  setSeciliTaksit(taksit);
                  setModalAcik(true);
                }}
                onTaksitGeriAl={handleTaksitGeriAl}
                onBorcSil={handleBorcSil}
              />
            ))}
          </div>
        )}
      </section>

      {/* Borç ekleme modal */}
      <BorcEkleModal
        open={borcEkleAcik}
        onClose={() => setBorcEkleAcik(false)}
      />

      {/* Ödeme modal */}
      <TaksitOdemeModal
        open={modalAcik}
        borc={seciliBorc}
        taksit={seciliTaksit}
        onClose={() => { setModalAcik(false); setSeciliBorc(null); setSeciliTaksit(null); }}
        onOnayla={handleOdemeOnayla}
      />
    </div>
  );
}
