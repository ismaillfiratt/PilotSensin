"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { kurus } from "@/lib/para";
import { useNakitAkis } from "@/store/nakitAkis";
import { useNakitAyarlar } from "@/store/nakitAyarlar";

interface Props {
  acik: boolean;
  kapat: () => void;
}

function bugunStr() { return new Date().toISOString().split("T")[0]; }

export default function PlanlananKalemModal({ acik, kapat }: Props) {
  const { ekle, tekrarlayanEkle } = useNakitAkis();
  const { gelirKategoriler, giderKategoriler } = useNakitAyarlar();

  const [tip,    setTip]    = useState<"gelir" | "gider">("gider");
  const [tutar,  setTutar]  = useState("");
  const [aciklama, setAciklama] = useState("");
  const [tarih,  setTarih]  = useState(bugunStr());
  const [tekrar, setTekrar] = useState<"tek" | "aylik" | "haftalik">("tek");
  const [gunNo,  setGunNo]  = useState("1");

  const kategoriler = tip === "gelir" ? gelirKategoriler : giderKategoriler;
  const [kategori, setKategori] = useState(kategoriler[0] ?? "");

  useEffect(() => {
    setKategori(kategoriler[0] ?? "");
  }, [tip]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (acik) {
      setTip("gider"); setTutar(""); setAciklama("");
      setTarih(bugunStr()); setTekrar("tek"); setGunNo("1");
    }
  }, [acik]);

  const handleKaydet = () => {
    const sayi = parseFloat(tutar.replace(",", "."));
    if (isNaN(sayi) || sayi <= 0) return;

    if (tekrar === "aylik") {
      tekrarlayanEkle({
        ad:         aciklama || kategori,
        tip,
        kategori,
        tutarKurus: kurus(sayi),
        odemeGunu:  Number(gunNo),
        aktif:      true,
      });
    } else {
      ekle({
        tip,
        kategori,
        tutarKurus:  kurus(sayi),
        vadeTarihi:  tarih,
        tamamlandi:  false,
        aciklama,
        kaynak:      "manuel",
      });
    }
    kapat();
  };

  if (!acik) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={kapat}
    >
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">Yeni planlanan kalem</h3>
          <button
            onClick={kapat}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F3F4F6] transition-colors"
          >
            <X className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
          </button>
        </div>

        {/* Tip */}
        <div className="grid grid-cols-2 gap-2">
          {(["gelir", "gider"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTip(t)}
              className={cn(
                "py-2 rounded-lg border text-sm font-medium transition-colors",
                t === "gelir"
                  ? tip === "gelir"
                    ? "bg-emerald-50 border-emerald-400 text-emerald-700"
                    : "bg-white border-black/10 text-gray-400"
                  : tip === "gider"
                    ? "bg-[#C97676]/10 border-[#C97676] text-[#C97676]"
                    : "bg-white border-black/10 text-gray-400"
              )}
            >
              {t === "gelir" ? "Gelir" : "Gider"}
            </button>
          ))}
        </div>

        {/* Tutar */}
        <div>
          <label className="label-caps">TUTAR</label>
          <input
            type="text"
            inputMode="decimal"
            value={tutar}
            onChange={(e) => {
              const v = e.target.value;
              if (/^[0-9]*[.,]?[0-9]*$/.test(v)) setTutar(v);
            }}
            className="w-full mt-1 px-3 py-2.5 rounded-lg border border-black/10 text-sm focus:outline-none focus:border-[var(--leaf)]"
            placeholder="0,00"
          />
        </div>

        {/* Kategori */}
        <div>
          <label className="label-caps">KATEGORİ</label>
          <select
            value={kategori}
            onChange={(e) => setKategori(e.target.value)}
            className="w-full mt-1 px-3 py-2.5 rounded-lg border border-black/10 text-sm focus:outline-none bg-white"
          >
            {kategoriler.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>

        {/* Açıklama */}
        <div>
          <label className="label-caps">AÇIKLAMA</label>
          <input
            type="text"
            value={aciklama}
            onChange={(e) => setAciklama(e.target.value)}
            className="w-full mt-1 px-3 py-2.5 rounded-lg border border-black/10 text-sm focus:outline-none focus:border-[var(--leaf)]"
            placeholder="Kira ödemesi, kira geliri…"
          />
        </div>

        {/* Tekrar türü */}
        <div>
          <label className="label-caps">TEKRAR</label>
          <select
            value={tekrar}
            onChange={(e) => setTekrar(e.target.value as typeof tekrar)}
            className="w-full mt-1 px-3 py-2.5 rounded-lg border border-black/10 text-sm focus:outline-none bg-white"
          >
            <option value="tek">Tek seferlik</option>
            <option value="aylik">Aylık tekrar</option>
          </select>
        </div>

        {/* Tarih veya Gün no */}
        {tekrar === "tek" ? (
          <div>
            <label className="label-caps">TARİH</label>
            <input
              type="date"
              value={tarih}
              onChange={(e) => setTarih(e.target.value)}
              className="w-full mt-1 px-3 py-2.5 rounded-lg border border-black/10 text-sm focus:outline-none"
            />
          </div>
        ) : (
          <div>
            <label className="label-caps">HER AYIN KAÇINDA?</label>
            <input
              type="number"
              min="1" max="31"
              value={gunNo}
              onChange={(e) => setGunNo(e.target.value)}
              className="w-full mt-1 px-3 py-2.5 rounded-lg border border-black/10 text-sm focus:outline-none"
            />
          </div>
        )}

        {/* Footer */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={kapat}
            className="flex-1 py-2.5 rounded-lg border border-black/10 text-sm font-medium text-gray-500 hover:bg-[#F3F4F6] transition-colors"
          >
            İptal
          </button>
          <button
            onClick={handleKaydet}
            disabled={!tutar || !kategori}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-40"
            style={{ background: "var(--forest)" }}
          >
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}
