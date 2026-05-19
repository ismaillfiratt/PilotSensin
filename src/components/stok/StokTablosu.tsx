"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Search, Plus, History, Pencil, Trash2, ShoppingCart } from "lucide-react";
import { stokDurumu, gunKaldi, type Urun } from "@/lib/stok-data";
import { useStok }       from "@/store/stok";
import { useSirket }     from "@/store/sirket";
import { useKdvHavuzu } from "@/store/kdvHavuzu";
import { useSatislar }   from "@/store/satislar";
import { onaylaSil }     from "@/lib/onay";
import { useGeriAl }     from "@/store/geriAl";
import StokSeviyesi  from "./StokSeviyesi";
import HareketiModal from "./HareketiModal";
import UrunEkleModal from "./UrunEkleModal";
import SatisModal    from "./SatisModal";

type Filtre = "tumu" | "kritik" | "uyari" | "olu" | "normal";

const filtreSecenekleri: { value: Filtre; label: string; color: string; activeBg: string }[] = [
  { value: "tumu",   label: "Tümü",     color: "#475569", activeBg: "#F1F5F9" },
  { value: "kritik", label: "Kritik",   color: "#EF4444", activeBg: "#FEF2F2" },
  { value: "uyari",  label: "Uyarı",    color: "#F59E0B", activeBg: "#FFFBEB" },
  { value: "olu",    label: "Ölü Stok", color: "#94A3B8", activeBg: "#F8FAFC" },
  { value: "normal", label: "Normal",   color: "#10B981", activeBg: "#F0FDF4" },
];

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

  const handleSil = async (urun: Urun) => {
    const baglıSayisi = useSatislar.getState().kayitlar.filter(
      (k) => k.urunId === urun.id && !k.silindi
    ).length;

    const { onaylandi, kaskad } = await onaylaSil({ tip: "urun", isim: urun.ad, baglıSayisi });
    if (!onaylandi) return;

    const kaskadIslemId = kaskad && baglıSayisi > 0 ? crypto.randomUUID() : undefined;

    if (kaskadIslemId) {
      const kaskadKayitlar = useSatislar.getState().kayitlar
        .filter((k) => k.urunId === urun.id && !k.silindi);
      await Promise.all(kaskadKayitlar.map((k) => useSatislar.getState().sil(k.id, { kaskadIslemId })));
    }
    kdvUrunSil(urun.id);
    await storesSil(urun.id, { kaskadIslemId });

    useGeriAl.getState().goster({
      mesaj: `${urun.ad} silindi.${kaskadIslemId ? ` ${baglıSayisi} bağlı kayıt da silindi.` : ""}`,
      sureMs: 10000,
      geriAlFn: async () => {
        await useStok.getState().geriAl(urun.id);
        if (kaskadIslemId) {
          const silinenSatislar = useSatislar.getState().kayitlar.filter((k) => k.kaskadIslemId === kaskadIslemId);
          await Promise.all(silinenSatislar.map((k) => useSatislar.getState().geriAl(k.id)));
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
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold transition-opacity hover:opacity-90"
              style={{ background: "var(--forest)" }}
            >
              <Plus className="w-4 h-4" />Stok Ekle
            </button>
          )}
        </div>
      </div>

      {/* Tablo */}
      <div className="card overflow-hidden">
        {/* Başlıklar — desktop */}
        <div className="hidden lg:grid lg:grid-cols-[minmax(180px,2fr)_120px_minmax(160px,2fr)_100px_110px_120px] gap-x-4 px-5 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <span>Ürün</span>
          <span>Kategori</span>
          <span>Stok Seviyesi</span>
          <span>Gün. Satış</span>
          <span>Değer</span>
          <span>İşlemler</span>
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
                    {isPilot && (
                      <button onClick={() => handleSil(urun)}
                        className="min-w-11 min-h-11 flex items-center justify-center rounded-xl text-gray-400 border border-gray-200 active:text-red-500 active:border-red-200 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Desktop satır */}
                <div className="hidden lg:grid lg:grid-cols-[minmax(180px,2fr)_120px_minmax(160px,2fr)_100px_110px_120px] gap-x-4 px-5 py-4 items-center hover:bg-gray-50 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{urun.ad}</p>
                    <p className="text-xs text-gray-400">{urun.sku || "—"}</p>
                  </div>
                  <div className="flex items-center">
                    <span className="text-xs text-gray-500 px-2 py-1 rounded-lg bg-gray-100 whitespace-nowrap">{urun.kategori}</span>
                  </div>
                  <div><StokSeviyesi urun={urun} /></div>
                  <div>
                    <p className="text-sm text-gray-700 font-medium font-number">{urun.gunlukSatis} {urun.birim}</p>
                    {gun !== null && (
                      <p className={`text-xs mt-0.5 font-number ${gun <= 3 ? "text-red-500" : gun <= 7 ? "text-amber-500" : "text-gray-400"}`}>
                        {gun} gün
                      </p>
                    )}
                  </div>
                  <div>
                    {deger !== null ? (
                      <>
                        <p className="text-sm text-gray-700 font-medium font-number">
                          {(deger / 100).toLocaleString("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 })}
                        </p>
                        <p className="text-xs text-gray-400 font-number">
                          {urun.birimMaliyetKurus != null ? (urun.birimMaliyetKurus / 100).toLocaleString("tr-TR", { style: "currency", currency: "TRY" }) : undefined}/birim
                        </p>
                      </>
                    ) : <span className="text-xs text-gray-300">—</span>}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setSatis(urun)} title="Satış Yap"
                      className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs text-gray-500 border border-gray-200 hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50 transition-all">
                      <ShoppingCart className="w-3.5 h-3.5" /><span className="hidden xl:inline">Sat</span>
                    </button>
                    <button onClick={() => setHareket(urun)} title="Stok Hareketi"
                      className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs text-gray-500 border border-gray-200 hover:border-amber-300 hover:text-amber-600 hover:bg-amber-50 transition-all">
                      <History className="w-3.5 h-3.5" /><span className="hidden xl:inline">Hareket</span>
                    </button>
                    {isPilot && (
                      <button onClick={() => setDuzenle(urun)} title="Düzenle"
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 border border-gray-200 hover:border-gray-300 hover:text-gray-600 transition-all">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {isPilot && (
                      <button onClick={() => handleSil(urun)} title="Sil"
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 border border-gray-200 hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
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
