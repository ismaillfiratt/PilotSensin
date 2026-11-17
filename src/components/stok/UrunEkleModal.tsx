"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Calendar, CreditCard, Layers, ChevronDown } from "lucide-react";
import { type Urun } from "@/lib/stok-data";
import { useStokAyarlar } from "@/store/stokAyarlar";
import { useSirket } from "@/store/sirket";
import { kurus } from "@/lib/para";
import { useStok } from "@/store/stok";
import { aktiviteKaydet } from "@/lib/aktiviteLog";
import { esitTaksitler, type Taksit } from "@/lib/borc-data";
import type { OdemeYontemi } from "@/lib/islemler/types";

/** Ödeme türü kategorisi — peşin, vadeli, taksitli */
type OdemeTuru = "pesin" | "vadeli" | "taksitli";

/** Peşin alt seçenekleri */
type PesinAlt = "nakit" | "kart" | "havale";

interface Props {
  open: boolean;
  onClose: () => void;
  urun?: Urun | null;
  onKaydet: (u: Omit<Urun, "id">) => void;
}

function KdvPanel({
  baslik, dahil, setDahil, oran, setOran, fiyatStr,
}: {
  baslik: string;
  dahil: boolean;
  setDahil: (v: boolean) => void;
  oran: number;
  setOran: (v: number) => void;
  fiyatStr: string;
}) {
  const fiyat = Number(fiyatStr.replace(",", "."));
  const net   = dahil && oran > 0 && fiyat > 0 ? fiyat / (1 + oran / 100) : null;

  return (
    <div className="rounded-xl border border-black/8 bg-[#F9FAFB] p-3 space-y-2">
      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">{baslik}</p>
      <div className="flex gap-1 p-0.5 rounded-lg bg-white border border-black/8">
        {([false, true] as const).map((v) => (
          <button key={String(v)} type="button" onClick={() => setDahil(v)}
            className="flex-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all"
            style={{
              backgroundColor: dahil === v ? "var(--forest)" : "transparent",
              color:           dahil === v ? "#fff"          : "var(--text-secondary)",
            }}>
            {v ? "Dahil" : "Hariç"}
          </button>
        ))}
      </div>
      {dahil && (
        <div className="flex gap-1 flex-wrap">
          {[0, 1, 10, 20].map((o) => (
            <button key={o} type="button" onClick={() => setOran(o)}
              className="flex-1 py-1 rounded-lg text-[11px] font-medium border transition-all"
              style={{
                borderColor:     oran === o ? "var(--forest)"       : "rgba(0,0,0,0.10)",
                backgroundColor: oran === o ? "rgba(15,61,46,0.08)" : "transparent",
                color:           oran === o ? "var(--forest)"       : "var(--text-secondary)",
              }}>
              {o === 0 ? "Yok" : `%${o}`}
            </button>
          ))}
        </div>
      )}
      {net != null && (
        <p className="text-[10px] text-gray-500 border-t border-black/5 pt-1.5">
          <span className="font-number font-medium text-gray-700">{fiyat.toLocaleString("tr-TR")}₺</span>
          {" → "}
          <span className="font-number font-semibold text-[#0F172A]">{net.toLocaleString("tr-TR", { maximumFractionDigits: 2 })}₺</span>
          {" net"}
        </p>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TaksitliPanel — Basit varsayılan + Düzenle modu
   ═══════════════════════════════════════════════════════════ */
function TaksitliPanel({
  toplamKurus, taksitSayisi, setTaksitSayisi,
  ilkVadeTarihi, setIlkVadeTarihi,
  duzenle, setDuzenle,
  ozelTaksitler, setOzelTaksitler,
}: {
  toplamKurus: number;
  taksitSayisi: number;
  setTaksitSayisi: (n: number) => void;
  ilkVadeTarihi: string;
  setIlkVadeTarihi: (s: string) => void;
  duzenle: boolean;
  setDuzenle: (b: boolean) => void;
  ozelTaksitler: Taksit[] | null;
  setOzelTaksitler: (t: Taksit[] | null) => void;
}) {
  // Basit modda — eşit dağılımdan otomatik hesaplanır
  const otoTaksitler = useMemo(
    () => esitTaksitler(toplamKurus, Math.max(1, taksitSayisi), ilkVadeTarihi),
    [toplamKurus, taksitSayisi, ilkVadeTarihi],
  );

  // Düzenleme modunda kullanıcının özelleştirdiği taksitler, yoksa oto
  const gosterilen = ozelTaksitler ?? otoTaksitler;

  const ozelToplam = gosterilen.reduce((t, x) => t + x.tutarKurus, 0);
  const fark = ozelToplam - toplamKurus;

  function taksitGuncelle(i: number, yama: Partial<Taksit>) {
    const yeni = [...gosterilen];
    yeni[i] = { ...yeni[i], ...yama };
    setOzelTaksitler(yeni);
  }

  function duzenlemeyiSifirla() {
    setOzelTaksitler(null);
  }

  function duzenlemeyiBaslat() {
    setOzelTaksitler(otoTaksitler);
    setDuzenle(true);
  }

  return (
    <div className="p-3 rounded-lg space-y-3"
         style={{ background: "rgba(212,163,115,0.06)", border: "0.5px solid rgba(212,163,115,0.25)" }}>

      {/* Basit girdiler */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs block mb-1 font-medium" style={{ color: "var(--text-secondary)" }}>
            Taksit sayısı
          </label>
          <input
            type="number" min={1} max={36}
            value={taksitSayisi}
            onChange={(e) => { setTaksitSayisi(Math.max(1, Math.min(36, Number(e.target.value) || 1))); duzenlemeyiSifirla(); }}
            disabled={duzenle}
            className="w-full px-3 py-2 rounded-lg text-sm"
            style={{
              background: "var(--bg-input, #fff)",
              border:     "0.5px solid var(--border-default, rgba(0,0,0,0.15))",
              color:      "var(--text-primary)",
              opacity:    duzenle ? 0.5 : 1,
            }}
          />
        </div>
        <div>
          <label className="text-xs block mb-1 font-medium" style={{ color: "var(--text-secondary)" }}>
            İlk vade tarihi
          </label>
          <input
            type="date"
            value={ilkVadeTarihi}
            onChange={(e) => { setIlkVadeTarihi(e.target.value); duzenlemeyiSifirla(); }}
            min={new Date().toISOString().slice(0, 10)}
            disabled={duzenle}
            className="w-full px-3 py-2 rounded-lg text-sm"
            style={{
              background: "var(--bg-input, #fff)",
              border:     "0.5px solid var(--border-default, rgba(0,0,0,0.15))",
              color:      "var(--text-primary)",
              opacity:    duzenle ? 0.5 : 1,
            }}
          />
        </div>
      </div>

      {/* Özet / Düzenle butonu */}
      <div className="flex items-center justify-between text-xs">
        <span style={{ color: "var(--text-secondary)" }}>
          Her taksit ~<strong style={{ color: "var(--text-primary)" }}>
            {(otoTaksitler[0]?.tutarKurus / 100 || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
          </strong>
        </span>
        {!duzenle ? (
          <button type="button" onClick={duzenlemeyiBaslat}
                  className="text-xs font-medium underline" style={{ color: "var(--accent)" }}>
            Her taksiti elle düzenle
          </button>
        ) : (
          <button type="button" onClick={() => { duzenlemeyiSifirla(); setDuzenle(false); }}
                  className="text-xs font-medium underline" style={{ color: "var(--accent)" }}>
            Otomatik dağılıma dön
          </button>
        )}
      </div>

      {/* Taksit listesi — sadece düzenleme modunda detaylı, normal modda kompakt */}
      <div className="space-y-1.5 max-h-60 overflow-y-auto">
        {gosterilen.map((t, i) => (
          <div key={t.id} className="flex items-center gap-2 text-xs">
            <span className="w-7 shrink-0 text-center font-medium"
                  style={{ color: "var(--text-secondary)" }}>
              {i + 1}.
            </span>
            <input
              type="date"
              value={t.vadeTarihi}
              onChange={(e) => taksitGuncelle(i, { vadeTarihi: e.target.value })}
              disabled={!duzenle}
              className="flex-1 px-2 py-1.5 rounded-md text-xs"
              style={{
                background: duzenle ? "var(--bg-input, #fff)" : "transparent",
                border:     "0.5px solid var(--border-default, rgba(0,0,0,0.10))",
                color:      "var(--text-primary)",
              }}
            />
            <div className="flex items-center gap-1">
              <input
                type="number" step="0.01" min="0"
                value={(t.tutarKurus / 100).toFixed(2)}
                onChange={(e) => taksitGuncelle(i, { tutarKurus: Math.round(Number(e.target.value || 0) * 100) })}
                disabled={!duzenle}
                className="w-20 px-2 py-1.5 rounded-md text-xs text-right font-number"
                style={{
                  background: duzenle ? "var(--bg-input, #fff)" : "transparent",
                  border:     "0.5px solid var(--border-default, rgba(0,0,0,0.10))",
                  color:      "var(--text-primary)",
                }}
              />
              <span className="text-[10px]" style={{ color: "var(--text-secondary)" }}>₺</span>
            </div>
          </div>
        ))}
      </div>

      {/* Toplam tutarlılık göstergesi */}
      <div className="flex items-center justify-between text-xs pt-2"
           style={{ borderTop: "0.5px solid rgba(0,0,0,0.06)" }}>
        <span style={{ color: "var(--text-secondary)" }}>
          Taksit toplamı / Alım toplamı
        </span>
        <span className="font-number font-medium"
              style={{ color: Math.abs(fark) <= 1 ? "var(--text-primary)" : "var(--color-danger)" }}>
          {(ozelToplam / 100).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} / {(toplamKurus / 100).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
          {Math.abs(fark) > 1 && (
            <span className="ml-1 text-[10px]">(fark {(fark / 100).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺)</span>
          )}
        </span>
      </div>
    </div>
  );
}

const bosForm = {
  ad: "", sku: "", kategori: "", birim: "",
  mevcutAdet: "", emniyetStogu: "", kritikStok: "", gunlukSatis: "",
  birimMaliyetKurus: "", birimSatisFiyatiKurus: "",
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
  const [alisDahil, setAlisDahil]     = useState(false);
  const [alisKdvOrani, setAlisKdv]    = useState(20);
  const [satisDahil, setSatisDahil]   = useState(false);
  const [satisKdvOrani, setSatisKdv]  = useState(20);

  // Alım akışı state'leri (sadece yeni ürün eklerken)
  const [kdvOrani,       setKdvOrani]       = useState(20);
  const [odemeTuru,      setOdemeTuru]      = useState<OdemeTuru>("pesin");
  const [pesinAlt,       setPesinAlt]       = useState<PesinAlt>("nakit");
  const [vadeTarihi,     setVadeTarihi]     = useState<string>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [taksitSayisi,   setTaksitSayisi]   = useState(6);
  const [ilkVadeTarihi,  setIlkVadeTarihi]  = useState<string>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [taksitDuzenle,  setTaksitDuzenle]  = useState(false);
  const [ozelTaksitler,  setOzelTaksitler]  = useState<Taksit[] | null>(null);
  const [acilisEnvanteri, setAcilisEnvanteri] = useState(false);
  const [hata, setHata]     = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);

  useEffect(() => {
    if (!open) return;
    setHata(null);
    setAcilisEnvanteri(false);
    setKdvOrani(20);
    setOdemeTuru("pesin");
    setPesinAlt("nakit");
    setTaksitSayisi(6);
    setTaksitDuzenle(false);
    setOzelTaksitler(null);
    const def = new Date();
    def.setMonth(def.getMonth() + 1);
    const defIso = def.toISOString().slice(0, 10);
    setVadeTarihi(defIso);
    setIlkVadeTarihi(defIso);
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
        birimMaliyetKurus:     urun.birimMaliyetKurus     ? String(urun.birimMaliyetKurus     / 100) : "",
        birimSatisFiyatiKurus: urun.birimSatisFiyatiKurus ? String(urun.birimSatisFiyatiKurus / 100) : "",
      });
      setAlisDahil(urun.alisKdvDahilHaric !== "haric");
      setAlisKdv(urun.alisKdvOrani ?? 20);
      setSatisDahil(urun.satisKdvDahilHaric !== "haric");
      setSatisKdv(urun.satisKdvOrani ?? 20);
    } else {
      setForm({ ...bosForm, birim: birimler[0] ?? "", kategori: kategoriler[0] ?? "" });
    }
  }, [urun, open, birimler, kategoriler]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  if (!open) return null;

  const netFiyat = (girilenTL: string, dahil: boolean, oran: number) => {
    const n = Number(girilenTL.replace(",", "."));
    if (!n || n <= 0) return undefined;
    if (!dahil || oran === 0) return kurus(n);
    return kurus(n / (1 + oran / 100));
  };

  // Alım önizleme hesapları
  const adet         = Number(form.mevcutAdet) || 0;
  const birimNetKurus = netFiyat(form.birimMaliyetKurus, alisDahil, alisKdvOrani) ?? 0;
  const araToplam    = adet * birimNetKurus;
  const kdvTutari    = acilisEnvanteri ? 0 : Math.round(araToplam * kdvOrani / 100);
  const toplam       = araToplam + kdvTutari;

  const urunVerisi = (): Omit<Urun, "id"> => ({
    ad: form.ad, sku: form.sku,
    kategori: form.kategori || kategoriler[0] || "Diğer",
    birim:    form.birim    || birimler[0]    || "adet",
    mevcutAdet:    Number(form.mevcutAdet),
    emniyetStogu:  Number(form.emniyetStogu),
    kritikStok:    Number(form.kritikStok),
    gunlukSatis:   Number(form.gunlukSatis),
    birimMaliyetKurus:     form.birimMaliyetKurus     ? netFiyat(form.birimMaliyetKurus,     alisDahil,  alisKdvOrani)  : undefined,
    birimSatisFiyatiKurus: form.birimSatisFiyatiKurus ? netFiyat(form.birimSatisFiyatiKurus, satisDahil, satisKdvOrani) : undefined,
    alisKdvDahilHaric:  alisDahil  ? "dahil" : "haric",
    alisKdvOrani:       alisKdvOrani,
    satisKdvDahilHaric: satisDahil ? "dahil" : "haric",
    satisKdvOrani:      satisKdvOrani,
    sonHareket: new Date().toISOString(),
    hareketler: urun?.hareketler ?? [],
  });

  const handleKaydet = async () => {
    if (yukleniyor) return;
    setHata(null);
    setYukleniyor(true);

    try {
      // ── Düzenleme modu — sadece güncelle ───────────────────────────────
      if (duzenlemeModu) {
        onKaydet(urunVerisi());
        onClose();
        return;
      }

      // ── Açılış envanteri — KDV/nakit kaydı YOK ─────────────────────────
      if (acilisEnvanteri) {
        await useStok.getState().ekle({ ...urunVerisi() });
        void aktiviteKaydet({
          modul: "stok",
          eylem: "acilis-envanter",
          ozet: `${form.ad} — açılış envanteri (${form.mevcutAdet} ${form.birim})`,
        });
        onClose();
        return;
      }

      // ── Normal alım — stok + KDV + nakit ────────────────────────────────
      if (!form.birimMaliyetKurus || birimNetKurus <= 0) {
        setHata("Birim alış fiyatı girilmeden alım kaydı oluşturulamaz.");
        return;
      }

      // Ödeme türüne göre alimYap argümanlarını hazırla + validation
      let odemeYontemi: OdemeYontemi;
      let vadeTarihiArg: string | undefined;
      let taksitlerArg: Taksit[] | undefined;

      const bugun = new Date().toISOString().slice(0, 10);

      if (odemeTuru === "pesin") {
        odemeYontemi = pesinAlt;
      } else if (odemeTuru === "vadeli") {
        if (!vadeTarihi) {
          setHata("Vadeli ödemede vade tarihi seçilmelidir.");
          return;
        }
        if (vadeTarihi < bugun) {
          setHata("Vade tarihi geçmiş bir tarih olamaz.");
          return;
        }
        odemeYontemi = "vadeli";
        vadeTarihiArg = vadeTarihi;
      } else {
        // taksitli
        const taksitler = ozelTaksitler ?? esitTaksitler(toplam, taksitSayisi, ilkVadeTarihi);
        if (taksitler.length === 0) {
          setHata("En az 1 taksit olmalı.");
          return;
        }
        const taksitToplam = taksitler.reduce((t, x) => t + x.tutarKurus, 0);
        if (Math.abs(taksitToplam - toplam) > 1) {
          setHata(`Taksit toplamı alım tutarı ile uyuşmuyor (fark: ${((taksitToplam - toplam) / 100).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺).`);
          return;
        }
        odemeYontemi = "taksitli";
        taksitlerArg = taksitler;
      }

      // 1. Ürünü 0 stokla ekle — Supabase yazısını atla; alimYap'ın stokGuncelle çağrısı tek yetkili yazıyı yapacak
      const urunId = await useStok.getState().ekle({ ...urunVerisi(), mevcutAdet: 0 }, { skipSave: true });

      // 2. Alım yap (stok artır + KDV + nakit veya borç)
      const { alimYap } = await import("@/lib/islemler/alim");
      const sonuc = await alimYap({
        urunId,
        adet:                 Number(form.mevcutAdet),
        birimAlisFiyatiKurus: birimNetKurus,
        kdvOrani:             kdvOrani / 100,
        odemeYontemi,
        vadeTarihi:           vadeTarihiArg,
        taksitler:            taksitlerArg,
        aciklama: `${form.ad} — ilk alım (${form.mevcutAdet} ${form.birim})`,
      });

      if (!sonuc.basarili) {
        setHata("Alım kaydedilemedi: " + (sonuc.hata ?? "bilinmeyen hata"));
        await useStok.getState().sil(urunId);
        return;
      }

      onClose();
    } catch (e) {
      console.error("[UrunEkleModal]", e);
      setHata("Beklenmeyen bir hata oluştu.");
    } finally {
      setYukleniyor(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void handleKaydet();
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
              <h2 className="text-lg font-bold text-gray-800">{duzenlemeModu ? "Ürünü Düzenle" : "Stok Ekle"}</h2>
              {duzenlemeModu && <p className="text-xs text-gray-400 mt-0.5">{urun.sku}</p>}
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-800 hover:bg-gray-50 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-4">
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
              <div>
                <label className="text-xs text-gray-400 font-medium block mb-1.5">Birim Satış Fiyatı (₺)</label>
                <input type="number" min="0" step="0.01" value={form.birimSatisFiyatiKurus} onChange={(e) => set("birimSatisFiyatiKurus", e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[var(--leaf)] text-sm" />
              </div>
            </div>

            {/* KDV dahil / hariç */}
            <div className="grid grid-cols-2 gap-2">
              <KdvPanel
                baslik="Alış KDV"
                dahil={alisDahil}
                setDahil={setAlisDahil}
                oran={alisKdvOrani}
                setOran={setAlisKdv}
                fiyatStr={form.birimMaliyetKurus}
              />
              <KdvPanel
                baslik="Satış KDV"
                dahil={satisDahil}
                setDahil={setSatisDahil}
                oran={satisKdvOrani}
                setOran={setSatisKdv}
                fiyatStr={form.birimSatisFiyatiKurus}
              />
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

            {/* ── ALIM AKIŞI — sadece yeni ürün eklerken ─────────────────────── */}
            {!duzenlemeModu && (
              <div className="border-t border-gray-200 pt-4 space-y-3">

                {/* Açılış Envanteri toggle */}
                <div
                  className="p-3 rounded-xl"
                  style={{
                    background: acilisEnvanteri ? "rgba(245,158,11,0.06)" : "var(--bg-secondary, #F9FAFB)",
                    border: "0.5px solid " + (acilisEnvanteri ? "rgba(245,158,11,0.3)" : "var(--border-default, rgba(0,0,0,0.08))"),
                  }}
                >
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acilisEnvanteri}
                      onChange={e => setAcilisEnvanteri(e.target.checked)}
                      style={{ accentColor: "#B45309" }}
                      className="mt-0.5 shrink-0"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium"
                        style={{ color: acilisEnvanteri ? "#B45309" : "var(--text-primary, #0F172A)" }}>
                        📦 Açılış Envanteri
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary, #64748b)" }}>
                        İşletmeye yeni kayıt oldun ve elindeki mevcut stokları sisteme giriyorsan işaretle.
                        Nakit çıkışı ve KDV kaydı oluşmaz — sadece envanter kaydı yapılır.
                      </p>
                    </div>
                  </label>
                </div>

                {/* Normal alım alanları */}
                {!acilisEnvanteri && (
                  <>
                    {/* KDV Oranı */}
                    <div>
                      <label className="text-xs block mb-1.5 font-medium" style={{ color: "var(--text-secondary)" }}>
                        Alım KDV Oranı
                      </label>
                      <select
                        value={kdvOrani}
                        onChange={e => setKdvOrani(Number(e.target.value))}
                        className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none"
                        style={{
                          background: "var(--bg-input, #F9FAFB)",
                          border: "0.5px solid var(--border-default, rgba(0,0,0,0.08))",
                          color: "var(--text-primary)",
                        }}
                      >
                        <option value={0}>%0</option>
                        <option value={1}>%1</option>
                        <option value={10}>%10</option>
                        <option value={20}>%20 (Standart)</option>
                      </select>
                    </div>

                    {/* Ödeme Türü — Üst seviye: Peşin / Vadeli / Taksitli */}
                    <div>
                      <label className="text-xs block mb-1.5 font-medium" style={{ color: "var(--text-secondary)" }}>
                        Ödeme Türü
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {([
                          { v: "pesin",    l: "Peşin",    Icon: CreditCard },
                          { v: "vadeli",   l: "Vadeli",   Icon: Calendar   },
                          { v: "taksitli", l: "Taksitli", Icon: Layers     },
                        ] as const).map((opt) => {
                          const aktif = odemeTuru === opt.v;
                          return (
                            <button
                              key={opt.v}
                              type="button"
                              onClick={() => { setOdemeTuru(opt.v); setOzelTaksitler(null); setTaksitDuzenle(false); }}
                              className="py-2 px-3 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                              style={{
                                background: aktif ? "var(--mint)" : "transparent",
                                color:      aktif ? "var(--forest)" : "var(--text-secondary)",
                                border:     "0.5px solid " + (aktif ? "var(--forest)" : "var(--border-default, rgba(0,0,0,0.08))"),
                              }}
                            >
                              <opt.Icon className="w-3.5 h-3.5" />
                              {opt.l}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Peşin alt seçici — Nakit/Kart/Havale */}
                    {odemeTuru === "pesin" && (
                      <div>
                        <label className="text-xs block mb-1.5 font-medium" style={{ color: "var(--text-secondary)" }}>
                          Peşin yöntemi
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {([
                            { v: "nakit",  l: "Nakit"  },
                            { v: "kart",   l: "Kart"   },
                            { v: "havale", l: "Havale" },
                          ] as const).map((opt) => {
                            const aktif = pesinAlt === opt.v;
                            return (
                              <button
                                key={opt.v}
                                type="button"
                                onClick={() => setPesinAlt(opt.v)}
                                className="py-2 px-3 rounded-lg text-xs font-medium transition-colors"
                                style={{
                                  background: aktif ? "var(--mint)" : "transparent",
                                  color:      aktif ? "var(--forest)" : "var(--text-secondary)",
                                  border:     "0.5px solid " + (aktif ? "var(--forest)" : "var(--border-default, rgba(0,0,0,0.08))"),
                                }}
                              >
                                {opt.l}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Vadeli — tek vade tarihi */}
                    {odemeTuru === "vadeli" && (
                      <div className="p-3 rounded-lg space-y-2"
                           style={{ background: "rgba(212,163,115,0.06)", border: "0.5px solid rgba(212,163,115,0.25)" }}>
                        <label className="text-xs block font-medium" style={{ color: "var(--text-secondary)" }}>
                          Vade tarihi
                        </label>
                        <input
                          type="date"
                          value={vadeTarihi}
                          onChange={(e) => setVadeTarihi(e.target.value)}
                          min={new Date().toISOString().slice(0, 10)}
                          className="w-full px-3 py-2 rounded-lg text-sm"
                          style={{
                            background:  "var(--bg-input, #fff)",
                            border:      "0.5px solid var(--border-default, rgba(0,0,0,0.15))",
                            color:       "var(--text-primary)",
                          }}
                        />
                        <p className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
                          Bu tarihte kasanızdan <strong>{(toplam / 100).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺</strong> düşecek.
                        </p>
                      </div>
                    )}

                    {/* Taksitli — taksit sayısı + ilk vade + düzenle */}
                    {odemeTuru === "taksitli" && (
                      <TaksitliPanel
                        toplamKurus={toplam}
                        taksitSayisi={taksitSayisi}
                        setTaksitSayisi={setTaksitSayisi}
                        ilkVadeTarihi={ilkVadeTarihi}
                        setIlkVadeTarihi={setIlkVadeTarihi}
                        duzenle={taksitDuzenle}
                        setDuzenle={setTaksitDuzenle}
                        ozelTaksitler={ozelTaksitler}
                        setOzelTaksitler={setOzelTaksitler}
                      />
                    )}

                    {/* KDV önizleme */}
                    {adet > 0 && birimNetKurus > 0 && (
                      <div className="p-3 rounded-lg space-y-1" style={{ background: "var(--bg-secondary, #F9FAFB)" }}>
                        <div className="flex justify-between text-sm">
                          <span style={{ color: "var(--text-secondary)" }}>
                            Ara toplam ({adet} × {(birimNetKurus / 100).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺):
                          </span>
                          <span className="font-medium">{(araToplam / 100).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺</span>
                        </div>
                        {kdvOrani > 0 && (
                          <div className="flex justify-between text-sm">
                            <span style={{ color: "var(--text-secondary)" }}>KDV (%{kdvOrani}):</span>
                            <span className="font-medium">{(kdvTutari / 100).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺</span>
                          </div>
                        )}
                        <div
                          className="flex justify-between text-sm font-semibold pt-2 mt-1"
                          style={{ borderTop: "0.5px solid var(--border-default, rgba(0,0,0,0.08))" }}
                        >
                          <span>Toplam ödenecek:</span>
                          <span style={{ color: "var(--forest)" }}>
                            {(toplam / 100).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Açılış envanteri uyarı banner'ı */}
                {acilisEnvanteri && (
                  <div
                    className="p-3 rounded-lg text-xs"
                    style={{
                      background: "rgba(245,158,11,0.08)",
                      border: "0.5px solid rgba(245,158,11,0.2)",
                      color: "#B45309",
                    }}
                  >
                    <strong>Açılış envanteri olarak kaydedilecek.</strong><br />
                    KDV kaydı, nakit çıkışı ve gider kaydı yapılmayacak. Bu ürün önceden alındığı
                    varsayılıyor — KDV&apos;si geçmiş dönemlere ait, ayrı beyan edilir.
                  </div>
                )}
              </div>
            )}

            {hata && (
              <p className="text-sm text-red-500">{hata}</p>
            )}

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-400 text-sm font-medium hover:bg-gray-50 transition-colors">
                İptal
              </button>
              <button type="submit" disabled={yukleniyor}
                className="flex-1 py-3 rounded-xl text-sm font-bold hover:opacity-90 transition-colors disabled:opacity-60"
                style={{
                  background: "var(--accent)",
                  color:      "var(--text-on-forest)",
                }}>
                {yukleniyor
                  ? "Kaydediliyor..."
                  : duzenlemeModu
                  ? "Değişiklikleri Kaydet"
                  : acilisEnvanteri
                  ? "Açılış Stoku Ekle"
                  : odemeTuru === "vadeli"
                  ? "Vadeli Alım & Ekle"
                  : odemeTuru === "taksitli"
                  ? `${taksitSayisi} Taksit & Ekle`
                  : "Alım Yap & Ekle"}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
