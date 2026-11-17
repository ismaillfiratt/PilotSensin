"use client";

import { useState, useEffect } from "react";
import { Info, CheckCircle2, Loader2, Code2, FileText, FileSpreadsheet } from "lucide-react";
import { useStok }             from "@/store/stok";
import { useGorevler }         from "@/store/gorevler";
import { useNakit }            from "@/store/nakit";
import { useSatislar }         from "@/store/satislar";
import { useIsletmeGiderleri } from "@/store/isletmeGiderleri";
import { useAcilFon }          from "@/store/acilFon";
import { useProsedurler }      from "@/store/prosedurler";
import { useKdvHavuzu }        from "@/store/kdvHavuzu";
import { toast }               from "@/store/toast";
import { aktiviteKaydet }      from "@/lib/aktiviteLog";
import { indirJSON, indirExcel, indirCSVZip } from "@/lib/veriExport";

const KART      = "bg-white rounded-xl p-5";
const KART_STIL = { border: "0.5px solid rgba(0,0,0,0.08)" };

type Format = "json" | "excel" | "csv";

interface Modul { key: string; label: string; aciklama: string }
const MODULLER: Modul[] = [
  { key: "urunler",      label: "Ürünler",              aciklama: "Stok ürünleri"        },
  { key: "gorevler",     label: "Görevler",              aciklama: "Görev kayıtları"      },
  { key: "nakit",        label: "Nakit İşlemleri",       aciklama: "Gelir/gider işlemleri"},
  { key: "satislar",     label: "Satışlar",              aciklama: "Satış kayıtları"      },
  { key: "giderler",     label: "İşletme Giderleri",     aciklama: "Gider kalemleri"      },
  { key: "acilFonHedef", label: "Acil Fon Hedefleri",    aciklama: "Fon hedefleri"        },
  { key: "acilFonIslem", label: "Acil Fon İşlemleri",    aciklama: "Fon işlem geçmişi"    },
  { key: "prosedurler",  label: "SOP Prosedürler",       aciklama: "Prosedür belgeleri"   },
  { key: "checklist",    label: "Kontrol Listesi",        aciklama: "Checklist maddeleri"  },
  { key: "kdvHavuzu",   label: "KDV Kayıtları",          aciklama: "KDV havuzu"           },
  { key: "profil",       label: "Profil Bilgilerim",      aciklama: "Hesap bilgilerin"     },
];

const TUM_ANAHTARLAR = MODULLER.map(m => m.key);

interface FormatSecenegi {
  key:     Format;
  label:   string;
  ozet:    string;
  detay:   string;
  icon:    React.ElementType;
}

const FORMATLAR: FormatSecenegi[] = [
  {
    key:   "json",
    label: "JSON",
    ozet:  "Geliştirici dostu, tek dosya",
    detay: "Tüm veriler hiyerarşik şekilde, programatik erişim için ideal",
    icon:  Code2,
  },
  {
    key:   "csv",
    label: "CSV",
    ozet:  "Excel/Sheets uyumlu, ZIP içinde",
    detay: "Her modül ayrı .csv dosyası, ZIP olarak indirilir",
    icon:  FileText,
  },
  {
    key:   "excel",
    label: "Excel (.xlsx)",
    ozet:  "Tek Excel dosyası, çok sheetli",
    detay: "Her modül ayrı sayfa, formüller eklenebilir",
    icon:  FileSpreadsheet,
  },
];

const FORMAT_UZANTI: Record<Format, string> = { json: "json", csv: "zip", excel: "xlsx" };

export default function VeriIndirPanel() {
  const [secili,   setSecili]   = useState<Set<string>>(new Set(TUM_ANAHTARLAR));
  const [format,   setFormat]   = useState<Format | "">("");
  const [loading,  setLoading]  = useState(false);
  const [sayilar,  setSayilar]  = useState<Record<string, number>>({});

  useEffect(() => {
    setSayilar({
      urunler:      useStok.getState().urunler.filter(u => !u.silindi).length,
      gorevler:     useGorevler.getState().gorevler.filter(g => !g.silindi).length,
      nakit:        useNakit.getState().islemler.filter(i => !i.silindi).length,
      satislar:     useSatislar.getState().kayitlar.filter(k => !k.silindi).length,
      giderler:     useIsletmeGiderleri.getState().giderler.filter(g => !g.silindi).length,
      acilFonHedef: useAcilFon.getState().hedefler.filter(h => !h.silindi).length,
      acilFonIslem: useAcilFon.getState().islemler.filter(i => !i.silindi).length,
      prosedurler:  useProsedurler.getState().prosedurler.filter(p => !p.silindi).length,
      checklist:    useProsedurler.getState().checklist.filter(c => !c.silindi).length,
      kdvHavuzu:    useKdvHavuzu.getState().kayitlar.length,
      profil:       1,
    });
  }, []);

  const toggleModul = (key: string) => {
    setSecili(prev => {
      const s = new Set(prev);
      s.has(key) ? s.delete(key) : s.add(key);
      return s;
    });
  };

  const canIndir  = secili.size > 0 && format !== "";
  const modulArr  = Array.from(secili);

  const handleIndir = async () => {
    if (!canIndir || !format) return;
    setLoading(true);
    try {
      let dosyaAdi: string;
      if (format === "json")  dosyaAdi = await indirJSON(modulArr);
      else if (format === "excel") dosyaAdi = await indirExcel(modulArr);
      else                    dosyaAdi = await indirCSVZip(modulArr);

      const toplamKayit = modulArr.reduce((acc, k) => acc + (sayilar[k] ?? 0), 0);
      void aktiviteKaydet({
        modul: "profil",
        eylem: "veri-export",
        ozet:  `Verilerini ${format.toUpperCase()} formatında dışa aktardı`,
        meta:  { format, modul_sayisi: modulArr.length, toplam_kayit: toplamKayit },
      });

      toast.basari(`Dosya indirildi: ${dosyaAdi}`);
    } catch (e) {
      toast.hata(`İndirme hatası: ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const butonEtiket = loading
    ? "Hazırlanıyor..."
    : !format
    ? "Format seç"
    : secili.size === 0
    ? "Önce modül seç"
    : `İndir (.${FORMAT_UZANTI[format as Format]})`;

  return (
    <div className="space-y-4">

      {/* Panel başlık */}
      <div>
        <p className="label-caps">VERİ YÖNETİMİ</p>
        <h2 className="text-xl font-medium text-gray-900 mt-1">Verilerimi İndir</h2>
        <p className="text-sm text-gray-500 mt-1">
          Tüm verilerini JSON, CSV (zip) veya Excel olarak dışa aktar — KVKK kapsamında
        </p>
      </div>

      {/* ── KART 1 — Bilgi banner ── */}
      <div
        className={KART + " flex items-start gap-3"}
        style={{ ...KART_STIL, background: "rgba(15,61,46,0.04)" }}
      >
        <Info className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "var(--forest)" }} />
        <p className="text-xs text-gray-600 leading-relaxed">
          İndirilen veriler <strong>şu an aktif kayıtlarını</strong> içerir. Silinmiş
          kayıtlar (çöp kutusu) dahil edilmez. Veriler şifresiz indirilir — güvenli bir
          yerde sakla.
        </p>
      </div>

      {/* ── KART 2 — Modül seçimi ── */}
      <div className={KART + " space-y-3"} style={KART_STIL}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-800">
              Hangi verileri indirmek istiyorsun?
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setSecili(new Set(TUM_ANAHTARLAR))}
              className="text-xs font-medium transition-colors"
              style={{ color: "var(--forest)" }}
            >
              Tümünü seç
            </button>
            <button
              onClick={() => setSecili(new Set())}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Temizle
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 pt-1">
          {MODULLER.map(({ key, label }) => {
            const isaretli = secili.has(key);
            const sayi     = sayilar[key] ?? 0;
            return (
              <label
                key={key}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-gray-50 transition-all"
              >
                <input
                  type="checkbox"
                  checked={isaretli}
                  onChange={() => toggleModul(key)}
                  className="w-4 h-4 rounded shrink-0"
                  style={{ accentColor: "var(--forest)" }}
                />
                <div className="min-w-0">
                  <p className="text-sm text-gray-700">{label}</p>
                  <p className="text-xs text-gray-400">{sayi} kayıt</p>
                </div>
                {isaretli && (
                  <CheckCircle2
                    className="w-3.5 h-3.5 shrink-0 ml-auto"
                    style={{ color: "var(--forest)" }}
                  />
                )}
              </label>
            );
          })}
        </div>
      </div>

      {/* ── KART 3 — Format seçimi ── */}
      <div className={KART + " space-y-3"} style={KART_STIL}>
        <p className="text-sm font-medium text-gray-800">Format seç</p>
        <div className="grid grid-cols-3 gap-3">
          {FORMATLAR.map(({ key, label, ozet, detay, icon: Icon }) => {
            const aktif = format === key;
            return (
              <button
                key={key}
                onClick={() => setFormat(key)}
                className="relative flex flex-col items-center gap-2 p-4 rounded-xl transition-all text-center"
                style={{
                  border:          aktif ? "1.5px solid var(--forest)" : "0.5px solid rgba(0,0,0,0.08)",
                  backgroundColor: aktif ? "rgba(15,61,46,0.03)"       : "transparent",
                  transform:       aktif ? "scale(1.01)"               : undefined,
                }}
              >
                {aktif && (
                  <CheckCircle2
                    className="absolute top-2 right-2 w-4 h-4"
                    style={{ color: "var(--forest)" }}
                  />
                )}
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{
                    backgroundColor: aktif ? "rgba(15,61,46,0.08)" : "rgba(0,0,0,0.04)",
                  }}
                >
                  <Icon className="w-4.5 h-4.5" style={{ color: aktif ? "var(--forest)" : "#94a3b8" }} />
                </div>
                <span
                  className="text-xs font-semibold"
                  style={{ color: aktif ? "var(--forest)" : "#94a3b8" }}
                >
                  {label}
                </span>
                <span className="text-[10px] leading-tight text-gray-400">{ozet}</span>
                <span className="text-[10px] leading-tight text-gray-300 hidden lg:block">
                  {detay}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── KART 4 — İndir ── */}
      <div
        className={KART + " flex items-center justify-between gap-4"}
        style={KART_STIL}
      >
        <p className="text-xs text-gray-400">
          {secili.size > 0
            ? `${secili.size} modül · ${modulArr.reduce((a, k) => a + (sayilar[k] ?? 0), 0)} kayıt seçildi`
            : "Henüz modül seçilmedi"}
        </p>
        <button
          onClick={handleIndir}
          disabled={!canIndir || loading}
          className="shrink-0 px-6 py-2.5 rounded-xl text-sm font-medium text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          style={{ backgroundColor: canIndir && !loading ? "var(--forest)" : "#94a3b8" }}
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {butonEtiket}
        </button>
      </div>

    </div>
  );
}
