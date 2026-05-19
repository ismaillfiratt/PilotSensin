"use client";

import { useState, useEffect } from "react";
import { X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { kurus } from "@/lib/para";
import { useNakitAkis, type TekrarPeriyot } from "@/store/nakitAkis";
import { useNakitAyarlar } from "@/store/nakitAyarlar";

interface Props {
  acik: boolean;
  kapat: () => void;
}

function bugunStr() { return new Date().toISOString().split("T")[0]; }

const TEKRAR_SECENEKLERI: { value: TekrarPeriyot | "tek"; label: string; periyotlu: boolean }[] = [
  { value: "tek",    label: "Tek seferlik",  periyotlu: false },
  { value: "gunluk", label: "Her gün",       periyotlu: false },
  { value: "haftalik", label: "Her hafta",   periyotlu: true  },
  { value: "aylik",  label: "Her ay",        periyotlu: true  },
  { value: "2ayda1", label: "2 ayda bir",    periyotlu: true  },
  { value: "3ayda1", label: "3 ayda bir",    periyotlu: true  },
];

const HAFTA_GUNLERI = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];

export default function PlanlananKalemModal({ acik, kapat }: Props) {
  const { ekle, tekrarlayanEkle } = useNakitAkis();
  const { gelirKategoriler, giderKategoriler, kategoriEkle, kategoriSil } = useNakitAyarlar();

  const [tip,      setTip]      = useState<"gelir" | "gider">("gider");
  const [tutar,    setTutar]    = useState("");
  const [aciklama, setAciklama] = useState("");
  const [tarih,    setTarih]    = useState(bugunStr());
  const [tekrar,   setTekrar]   = useState<TekrarPeriyot | "tek">("tek");
  const [gunNo,    setGunNo]    = useState("1");
  const [haftaGun, setHaftaGun] = useState("1"); // 0=Pazar
  const [katYonet, setKatYonet] = useState(false);
  const [yeniKat,  setYeniKat]  = useState("");

  const kategoriler = tip === "gelir" ? gelirKategoriler : giderKategoriler;
  const [kategori, setKategori] = useState(kategoriler[0] ?? "");

  useEffect(() => {
    setKategori(kategoriler[0] ?? "");
    setKatYonet(false);
  }, [tip]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (acik) {
      setTip("gider"); setTutar(""); setAciklama("");
      setTarih(bugunStr()); setTekrar("tek");
      setGunNo("1"); setKatYonet(false); setYeniKat("");
    }
  }, [acik]);

  const secenekBilgi = TEKRAR_SECENEKLERI.find((s) => s.value === tekrar);

  const handleKaydet = () => {
    const sayi = parseFloat(tutar.replace(",", "."));
    if (isNaN(sayi) || sayi <= 0 || !kategori) return;

    if (tekrar === "tek") {
      ekle({ tip, kategori, tutarKurus: kurus(sayi), vadeTarihi: tarih, tamamlandi: false, aciklama, kaynak: "manuel" });
    } else {
      tekrarlayanEkle({
        ad:           aciklama || kategori,
        tip,
        kategori,
        tutarKurus:   kurus(sayi),
        odemeGunu:    tekrar === "haftalik" ? Number(haftaGun) : Number(gunNo),
        aktif:        true,
        tekrarPeriyot: tekrar as TekrarPeriyot,
      });
    }
    kapat();
  };

  const handleKatEkle = () => {
    if (!yeniKat.trim()) return;
    kategoriEkle(tip, yeniKat.trim());
    setKategori(yeniKat.trim());
    setYeniKat("");
  };

  if (!acik) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={kapat}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md mx-4 shadow-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white rounded-t-2xl px-6 pt-6 pb-4 border-b border-black/5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold">Yeni planlanan kalem</h3>
            <button onClick={kapat} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F3F4F6] transition-colors">
              <X className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
            </button>
          </div>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* Tip */}
          <div className="grid grid-cols-2 gap-2">
            {(["gelir", "gider"] as const).map((t) => (
              <button key={t} onClick={() => setTip(t)}
                className={cn(
                  "py-2 rounded-lg border text-sm font-medium transition-colors",
                  t === "gelir"
                    ? tip === "gelir" ? "bg-emerald-50 border-emerald-400 text-emerald-700" : "bg-white border-black/10 text-gray-400"
                    : tip === "gider" ? "bg-[#C97676]/10 border-[#C97676] text-[#C97676]"  : "bg-white border-black/10 text-gray-400"
                )}>
                {t === "gelir" ? "Gelir" : "Gider"}
              </button>
            ))}
          </div>

          {/* Tutar */}
          <div>
            <label className="label-caps">TUTAR</label>
            <input type="text" inputMode="decimal" value={tutar}
              onChange={(e) => { const v = e.target.value; if (/^[0-9]*[.,]?[0-9]*$/.test(v)) setTutar(v); }}
              className="w-full mt-1 px-3 py-2.5 rounded-lg border border-black/10 text-sm focus:outline-none focus:border-[var(--leaf)]"
              placeholder="0,00" />
          </div>

          {/* Kategori + yönetim */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="label-caps">KATEGORİ</label>
              <button
                onClick={() => setKatYonet((v) => !v)}
                className="text-[10px] font-medium px-2 py-0.5 rounded border transition-colors"
                style={{
                  color:       katYonet ? "var(--forest)" : "var(--text-secondary)",
                  borderColor: katYonet ? "var(--forest)" : "rgba(0,0,0,0.10)",
                }}
              >
                Yönet
              </button>
            </div>

            {/* Kategori yönetim paneli */}
            {katYonet && (
              <div className="mb-2 p-3 rounded-lg border border-black/8 bg-gray-50 space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  {kategoriler.map((k) => (
                    <div key={k} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white border border-black/10 text-xs">
                      <span>{k}</span>
                      <button onClick={() => kategoriSil(tip, k)} className="text-gray-400 hover:text-[#C97676] transition-colors">
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-1.5">
                  <input type="text" value={yeniKat} onChange={(e) => setYeniKat(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleKatEkle(); } }}
                    placeholder="Yeni kategori adı"
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-white border border-black/10 text-xs focus:outline-none" />
                  <button onClick={handleKatEkle}
                    className="px-2.5 py-1.5 rounded-lg text-white text-xs"
                    style={{ background: "var(--forest)" }}>
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            <select value={kategori} onChange={(e) => setKategori(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-black/10 text-sm focus:outline-none bg-white">
              {kategoriler.map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>

          {/* Açıklama */}
          <div>
            <label className="label-caps">AÇIKLAMA</label>
            <input type="text" value={aciklama} onChange={(e) => setAciklama(e.target.value)}
              className="w-full mt-1 px-3 py-2.5 rounded-lg border border-black/10 text-sm focus:outline-none focus:border-[var(--leaf)]"
              placeholder="Kira ödemesi, kira geliri…" />
          </div>

          {/* Tekrar */}
          <div>
            <label className="label-caps">TEKRAR</label>
            <select value={tekrar} onChange={(e) => setTekrar(e.target.value as typeof tekrar)}
              className="w-full mt-1 px-3 py-2.5 rounded-lg border border-black/10 text-sm focus:outline-none bg-white">
              {TEKRAR_SECENEKLERI.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Planlanan tarih (tek seferlik) */}
          {tekrar === "tek" && (
            <div>
              <label className="label-caps">PLANLANAN TARİH</label>
              <input type="date" value={tarih} onChange={(e) => setTarih(e.target.value)}
                className="w-full mt-1 px-3 py-2.5 rounded-lg border border-black/10 text-sm focus:outline-none" />
            </div>
          )}

          {/* Haftalık: gün seçimi */}
          {tekrar === "haftalik" && (
            <div>
              <label className="label-caps">HAFTANIN GÜNÜ</label>
              <select value={haftaGun} onChange={(e) => setHaftaGun(e.target.value)}
                className="w-full mt-1 px-3 py-2.5 rounded-lg border border-black/10 text-sm focus:outline-none bg-white">
                {HAFTA_GUNLERI.map((g, i) => <option key={i} value={String(i)}>{g}</option>)}
              </select>
            </div>
          )}

          {/* Aylık / 2 ayda 1 / 3 ayda 1: gün no */}
          {secenekBilgi?.periyotlu && tekrar !== "haftalik" && (
            <div>
              <label className="label-caps">HER PERİYODUN KAÇINCI GÜNÜ?</label>
              <input type="number" min="1" max="31" value={gunNo} onChange={(e) => setGunNo(e.target.value)}
                className="w-full mt-1 px-3 py-2.5 rounded-lg border border-black/10 text-sm focus:outline-none" />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white rounded-b-2xl px-6 pt-3 pb-5 border-t border-black/5 flex gap-2">
          <button onClick={kapat}
            className="flex-1 py-2.5 rounded-lg border border-black/10 text-sm font-medium text-gray-500 hover:bg-[#F3F4F6] transition-colors">
            İptal
          </button>
          <button onClick={handleKaydet} disabled={!tutar || !kategori}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-40"
            style={{ background: "var(--forest)" }}>
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}
