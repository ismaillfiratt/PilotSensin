"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Search, Plus, History, Pencil, Trash2, ShoppingCart, MoreHorizontal } from "lucide-react";
import { stokDurumu, gunKaldi, type Urun } from "@/lib/stok-data";
import { useStok }       from "@/store/stok";
import { useSirket }     from "@/store/sirket";
import { useKdvHavuzu } from "@/store/kdvHavuzu";
import { useSatislar }   from "@/store/satislar";
import { useNakit }      from "@/store/nakit";
import { onaylaSil }     from "@/lib/onay";
import { useGeriAl }     from "@/store/geriAl";
import StokSeviyesi  from "./StokSeviyesi";
import HareketiModal from "./HareketiModal";
import UrunEkleModal from "./UrunEkleModal";
import SatisModal    from "./SatisModal";

type Filtre = "tumu" | "kritik" | "uyari" | "olu" | "normal";

// Tek COL sabiti — header ve satırlar aynı şablonu kullanır → hizalama garantili
const COL = "lg:grid-cols-[minmax(180px,1.6fr)_100px_minmax(140px,1.4fr)_80px_140px_200px]";

const filtreSecenekleri: { value: Filtre; label: string; color: string; activeBg: string }[] = [
  { value: "tumu",   label: "Tümü",     color: "#475569", activeBg: "#F1F5F9" },
  { value: "kritik", label: "Kritik",   color: "#EF4444", activeBg: "#FEF2F2" },
  { value: "uyari",  label: "Uyarı",    color: "#F59E0B", activeBg: "#FFFBEB" },
  { value: "olu",    label: "Ölü Stok", color: "#94A3B8", activeBg: "#F8FAFC" },
  { value: "normal", label: "Normal",   color: "#10B981", activeBg: "#F0FDF4" },
];

interface UrunAksiyonMenuProps {
  urun:       Urun;
  isPilot:    boolean;
  onSat:      (u: Urun) => void;
  onHareket:  (u: Urun) => void;
  onDuzenle:  (u: Urun) => void;
  onSil:      (u: Urun) => void;
}

function UrunAksiyonMenu({ urun, isPilot, onSat, onHareket, onDuzenle, onSil }: UrunAksiyonMenuProps) {
  const [acik, setAcik] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAcik(false);
    }
    if (acik) document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [acik]);

  return (
    <div className="flex items-center gap-1.5 justify-end min-w-0 flex-nowrap whitespace-nowrap">
      <button
        onClick={() => onSat(urun)}
        title="Satış Yap"
        className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs
                   text-gray-500 border border-gray-200
                   hover:border-emerald-300 hover:text-emerald-600
                   hover:bg-emerald-50 transition-all"
      >
        <ShoppingCart className="w-3.5 h-3.5" />
        <span className="hidden xl:inline">Sat</span>
      </button>

      <button
        onClick={() => onHareket(urun)}
        title="Stok Hareketi"
        className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs
                   text-gray-500 border border-gray-200
                   hover:border-amber-300 hover:text-amber-600
                   hover:bg-amber-50 transition-all"
      >
        <History className="w-3.5 h-3.5" />
        <span className="hidden xl:inline">Hareket</span>
      </button>

      <div ref={ref} className="relative">
        <button
          onClick={() => setAcik((p) => !p)}
          title="Daha fazla"
          className="w-7 h-7 flex items-center justify-center rounded-lg
                     text-gray-500 border border-gray-200
                     hover:border-gray-300 hover:bg-gray-50 transition-all"
        >
          <MoreHorizontal className="w-3.5 h-3.5" />
        </button>

        {acik && (
          <div className="absolute right-0 top-full mt-1 w-32 bg-white
                          rounded-lg shadow-lg border border-gray-200
                          overflow-hidden z-20">
            {isPilot && (
              <button
                onClick={() => { onDuzenle(urun); setAcik(false); }}
                className="w-full flex items-center gap-2 px-3 py-2
                           text-xs text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Pencil className="w-3.5 h-3.5 text-gray-500" />
                Düzenle
              </button>
            )}
            <button
              onClick={() => { onSil(urun); setAcik(false); }}
              className="w-full flex items-center gap-2 px-3 py-2
                         text-xs font-medium text-[#C97676]
                         hover:bg-[#FEF3F2] transition-colors
                         border-t border-gray-100"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Sil
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

interface Props { otomatikAcilModal?: boolean; }

export default function StokTablosu({ otomatikAcilModal }: Props) {
  const router = useRouter();
  const { urunler, ekle, guncelle, sil: storesSil } = useStok();
  const { rol } = useSirket();
  const { urunSil: kdvUrunSil } = useKdvHavuzu();
  const isPilot = rol === "pilot" || !rol;

  const [arama,       setArama]       = useState("");
  const [filtre,      setFiltre]      = useState<Filtre>("tumu");
  const [hareket,     setHareket]     = useState<Urun | null>(null);
  const [satis,       setSatis]       = useState<Urun | null>(null);
  const [duzenle,     setDuzenle]     = useState<Urun | null>(null);
  const [urunEkleAcik, setUrunEkleAcik] = useState(false);

  const handleTumunuSil = async () => {
    const silinecekler = filtrelenmis;
    if (silinecekler.length === 0) return;
    const { onaylandi } = await onaylaSil({
      tip: "urun",
      isim: `Tüm ${silinecekler.length} ürün`,
      baglıSayisi: silinecekler.length,
    });
    if (!onaylandi) return;
    await Promise.all(silinecekler.map((u) => storesSil(u.id)));
    useGeriAl.getState().goster({
      mesaj: `${silinecekler.length} ürün silindi.`,
      sureMs: 12000,
      geriAlFn: async () => {
        await Promise.all(silinecekler.map((u) => useStok.getState().geriAl(u.id)));
      },
    });
  };

  const handleSil = async (urun: Urun) => {
    const baglıSatislar = useSatislar.getState().kayitlar.filter(
      (k) => k.urunId === urun.id && !k.silindi
    );
    const baglıSayisi = baglıSatislar.length;

    const { onaylandi, kaskad } = await onaylaSil({ tip: "urun", isim: urun.ad, baglıSayisi });
    if (!onaylandi) return;

    const kaskadIslemId = kaskad && baglıSayisi > 0 ? crypto.randomUUID() : undefined;

    if (kaskadIslemId) {
      // Satış kayıtlarını soft-delete
      await Promise.all(baglıSatislar.map((k) => useSatislar.getState().sil(k.id, { kaskadIslemId })));

      // Bu satışlara ait nakit gelir kayıtlarını da soft-delete
      const islemIdleri = baglıSatislar.map((k) => k.islemId).filter(Boolean) as string[];
      const baglıNakit = useNakit.getState().islemler.filter(
        (n) => n.islemId && islemIdleri.includes(n.islemId) && !n.silindi
      );
      await Promise.all(baglıNakit.map((n) => useNakit.getState().sil(n.id)));
    }

    kdvUrunSil(urun.id);
    await storesSil(urun.id, { kaskadIslemId });

    useGeriAl.getState().goster({
      mesaj: `${urun.ad} silindi.${kaskadIslemId ? ` ${baglıSayisi} bağlı satış ve nakit kaydı da silindi.` : ""}`,
      sureMs: 10000,
      geriAlFn: async () => {
        await useStok.getState().geriAl(urun.id);
        if (kaskadIslemId) {
          const silinenSatislar = useSatislar.getState().kayitlar.filter((k) => k.kaskadIslemId === kaskadIslemId);
          await Promise.all(silinenSatislar.map((k) => useSatislar.getState().geriAl(k.id)));
          // Nakit kayıtlarını da geri al
          const islemIdleri2 = silinenSatislar.map((k) => k.islemId).filter(Boolean) as string[];
          const silinenNakit = useNakit.getState().islemler.filter(
            (n) => n.islemId && islemIdleri2.includes(n.islemId) && n.silindi
          );
          await Promise.all(silinenNakit.map((n) => useNakit.getState().geriAl(n.id)));
        }
      },
    });
  };

  useEffect(() => {
    if (otomatikAcilModal) { setUrunEkleAcik(true); router.replace("/stok"); }
  }, [otomatikAcilModal, router]);

  const filtrelenmis = useMemo(() => urunler.filter((u) => {
    if (u.silindi) return false;
    const aramaUyum = arama === ""
      || u.ad.toLowerCase().includes(arama.toLowerCase())
      || u.sku.toLowerCase().includes(arama.toLowerCase())
      || u.kategori.toLowerCase().includes(arama.toLowerCase());
    return aramaUyum && (filtre === "tumu" || stokDurumu(u) === filtre);
  }), [urunler, arama, filtre]);

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Ürün, SKU veya kategori ara..."
            value={arama}
            onChange={(e) => setArama(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-800 placeholder-gray-400 text-sm focus:outline-none focus:border-(--leaf) transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            <div className="flex items-center gap-1 p-1 rounded-xl bg-gray-50 border border-gray-200 w-max">
              {filtreSecenekleri.map(({ value, label, color, activeBg }) => {
                const count = value === "tumu"
                  ? urunler.filter((u) => !u.silindi).length
                  : urunler.filter((u) => !u.silindi && stokDurumu(u) === value).length;
                const isActive = filtre === value;
                return (
                  <button
                    key={value}
                    onClick={() => setFiltre(value)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{
                      backgroundColor: isActive ? activeBg : "transparent",
                      color:           isActive ? color    : "#94A3B8",
                      border:          isActive ? `1px solid ${color}30` : "1px solid transparent",
                    }}
                  >
                    {label} <span className="text-[10px] opacity-60">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
          {isPilot && (
            <button
              onClick={() => setUrunEkleAcik(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium transition-opacity hover:opacity-90"
              style={{ background: "var(--forest)" }}
            >
              <Plus className="w-4 h-4" />Stok Ekle
            </button>
          )}
        </div>
      </div>

      {/* Tablo */}
      <div className="card">
        {/* Başlıklar — desktop */}
        <div className={`hidden lg:grid ${COL} gap-x-3 px-5 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider`}>
          <span>Ürün</span>
          <span>Kategori</span>
          <span>Stok Seviyesi</span>
          <span className="text-right">Gün. Satış</span>
          <span className="text-right">Değer</span>
          <span className="text-right">İşlemler</span>
        </div>

        <div className="divide-y divide-gray-100">
          {filtrelenmis.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <p className="text-gray-400 text-sm font-medium">Henüz ürün yok</p>
              <p className="text-gray-300 text-xs">İlk ürününüzü eklemek için "Stok Ekle" butonuna tıklayın.</p>
            </div>
          ) : filtrelenmis.map((urun, i) => {
            const gun   = gunKaldi(urun);
            const deger = urun.birimMaliyetKurus ? urun.mevcutAdet * urun.birimMaliyetKurus : null;

            return (
              <motion.div key={urun.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>

                {/* Mobile kart */}
                <div className="lg:hidden px-4 py-3 space-y-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{urun.ad}</p>
                      <p className="text-xs text-gray-400">{urun.sku || urun.kategori}</p>
                    </div>
                    <span className="text-xs text-gray-500 px-2 py-1 rounded-lg bg-gray-100 shrink-0">{urun.kategori}</span>
                  </div>
                  <StokSeviyesi urun={urun} />
                  <div className="flex items-center justify-between">
                    {gun !== null && (
                      <p className={`text-xs font-number ${gun <= 3 ? "text-red-500" : gun <= 7 ? "text-amber-500" : "text-gray-400"}`}>
                        {gun} gün kaldı
                      </p>
                    )}
                    {deger !== null && (
                      <p className="text-xs text-gray-500 font-number">
                        {(deger / 100).toLocaleString("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 })}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setSatis(urun)}
                      className="flex-1 flex items-center justify-center gap-1.5 min-h-11 rounded-xl text-xs text-emerald-600 border border-emerald-200 bg-emerald-50 active:bg-emerald-100 transition-colors">
                      <ShoppingCart className="w-3.5 h-3.5" />Sat
                    </button>
                    <button onClick={() => setHareket(urun)}
                      className="flex-1 flex items-center justify-center gap-1.5 min-h-11 rounded-xl text-xs text-amber-600 border border-amber-200 bg-amber-50 active:bg-amber-100 transition-colors">
                      <History className="w-3.5 h-3.5" />Hareket
                    </button>
                    {isPilot && (
                      <button onClick={() => setDuzenle(urun)}
                        className="min-w-11 min-h-11 flex items-center justify-center rounded-xl text-gray-400 border border-gray-200 active:bg-gray-100 transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => handleSil(urun)}
                      className="flex items-center justify-center gap-1.5 min-w-11 min-h-11 rounded-xl text-xs font-medium text-[#C97676] border border-transparent hover:bg-[#FEF3F2] hover:border-[rgba(201,118,118,0.25)] transition-colors">
                      <Trash2 className="w-4 h-4" />Sil
                    </button>
                  </div>
                </div>

                {/* Desktop satır */}
                <div className={`hidden lg:grid ${COL} gap-x-3 px-5 py-4 items-center hover:bg-gray-50 transition-colors`}>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{urun.ad}</p>
                    <p className="text-xs text-gray-400">{urun.sku || "—"}</p>
                  </div>
                  <div className="flex items-center">
                    <span className="text-xs text-gray-500 px-2 py-1 rounded-lg bg-gray-100 whitespace-nowrap">{urun.kategori}</span>
                  </div>
                  <div><StokSeviyesi urun={urun} /></div>
                  <div className="text-right">
                    <p className="text-sm text-gray-700 font-medium font-number tabular-nums">{urun.gunlukSatis} {urun.birim}</p>
                    {gun !== null && (
                      <p className={`text-xs mt-0.5 font-number tabular-nums ${gun <= 3 ? "text-red-500" : gun <= 7 ? "text-amber-500" : "text-gray-400"}`}>
                        {gun} gün
                      </p>
                    )}
                  </div>
                  <div className="min-w-0 overflow-hidden text-right">
                    {deger !== null ? (
                      <>
                        <p className="text-sm text-gray-700 font-medium font-number tabular-nums truncate whitespace-nowrap">
                          {(deger / 100).toLocaleString("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 })}
                        </p>
                        <p className="text-xs text-gray-400 font-number tabular-nums truncate whitespace-nowrap">
                          {urun.birimMaliyetKurus != null ? (urun.birimMaliyetKurus / 100).toLocaleString("tr-TR", { style: "currency", currency: "TRY" }) : "—"}/birim
                        </p>
                      </>
                    ) : <span className="text-xs text-gray-300">—</span>}
                  </div>
                  <UrunAksiyonMenu
                    urun={urun}
                    isPilot={isPilot}
                    onSat={setSatis}
                    onHareket={setHareket}
                    onDuzenle={setDuzenle}
                    onSil={handleSil}
                  />
                </div>

              </motion.div>
            );
          })}
        </div>

        <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400 bg-gray-50">
          {filtrelenmis.length} / {urunler.filter((u) => !u.silindi).length} ürün
        </div>
      </div>

      <HareketiModal urun={hareket} onClose={() => setHareket(null)} />
      <SatisModal    urun={satis}   onClose={() => setSatis(null)} />
      <UrunEkleModal open={urunEkleAcik} onClose={() => setUrunEkleAcik(false)} onKaydet={(u) => ekle(u)} />
      <UrunEkleModal open={!!duzenle} urun={duzenle} onClose={() => setDuzenle(null)} onKaydet={(u) => duzenle && guncelle(duzenle.id, u)} />
    </>
  );
}
