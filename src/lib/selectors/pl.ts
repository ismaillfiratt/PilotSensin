/**
 * P&L (Kâr-Zarar) selector — tek çağrıda tüm tabloyu üretir.
 * Kâr-Zarar sayfası bu fonksiyonu kullanır; mock veriye bağımlılık kalmaz.
 */

import type { SatisKaydi } from "@/store/satislar";
import type { GiderItem }  from "@/lib/db";
import type { Kurus }      from "@/lib/para";

export interface PLSatiri {
  etiket:    string;
  tutarKurus:     Kurus;
  /** Satış hasılatına oranı (0–1). Gösterim için %. */
  oran?:     number;
  altSatir?: boolean;
  ayrac?:    boolean;
  vurgu?:    "pozitif" | "negatif" | "nötr";
}

export interface PLSonucu {
  ciroKurus:          Kurus;
  smmKurus:           Kurus;
  brutKarKurus:       Kurus;
  brutMarj:      number;
  toplamGiderKurus:   Kurus;
  netKarKurus:        Kurus;
  netMarj:       number;
  basaBazCiroKurus:   Kurus;
  satirlar:      PLSatiri[];
  donemBaslangic: string;
  donemBitis:    string;
}

/**
 * Seçili tarih aralığı için P&L tablosunu hesaplar.
 * @param kayitlar   useSatislar().kayitlar
 * @param giderler   useIsletmeGiderleri().giderler
 * @param baslangic  ISO tarih string (YYYY-MM-DD), varsayılan: ay başı
 * @param bitis      ISO tarih string (YYYY-MM-DD), varsayılan: bugün
 */
export function plTablosu(
  kayitlar:   SatisKaydi[],
  giderler:   GiderItem[],
  baslangic?: string,
  bitis?:     string,
): PLSonucu {
  const bugun   = new Date();
  const ayBasi  = new Date(bugun.getFullYear(), bugun.getMonth(), 1);

  const basTs = baslangic
    ? new Date(baslangic).setHours(0, 0, 0, 0)
    : ayBasi.getTime();
  const bitTs = bitis
    ? new Date(bitis).setHours(23, 59, 59, 999)
    : bugun.setHours(23, 59, 59, 999);

  const donemKayitlar = kayitlar.filter((k) => {
    if (k.iadeEdildi || k.silindi) return false;
    const t = new Date(k.tarih).getTime();
    return t >= basTs && t <= bitTs;
  });

  const ciroKurus        = donemKayitlar.reduce((t, k) => t + k.toplamCiroKurus, 0);
  const smmKurus         = donemKayitlar.reduce((t, k) => t + k.birimAlisFiyatiKurus * k.adet, 0);
  const brutKarKurus     = (ciroKurus - smmKurus);
  const brutMarj         = ciroKurus > 0 ? brutKarKurus / ciroKurus : 0;
  const toplamGiderKurus = giderler.reduce((t, g) => t + g.tutarKurus, 0);
  const netKarKurus      = (brutKarKurus - toplamGiderKurus);
  const netMarj          = ciroKurus > 0 ? netKarKurus / ciroKurus : 0;
  const basaBazCiroKurus = (brutMarj > 0 ? toplamGiderKurus / brutMarj : 0);

  const oran = (t: number) => (ciroKurus > 0 ? t / ciroKurus : 0);

  const satirlar: PLSatiri[] = [
    // ── Hasılat ──────────────────────────────────────────────────────────
    { etiket: "Satış Hasılatı", tutarKurus: ciroKurus, oran: 1, vurgu: "pozitif" },
    { etiket: "─", tutarKurus: 0, ayrac: true },

    // ── SMM ──────────────────────────────────────────────────────────────
    { etiket: "Satılan Mal Maliyeti (SMM)", tutarKurus: (-smmKurus), oran: oran(smmKurus), altSatir: true, vurgu: "negatif" },
    { etiket: "─", tutarKurus: 0, ayrac: true },

    // ── Brüt Kâr ─────────────────────────────────────────────────────────
    {
      etiket: `Brüt Kâr  (%${(brutMarj * 100).toFixed(1)} marj)`,
      tutarKurus:  brutKarKurus,
      oran:   oran(brutKarKurus),
      vurgu:  brutKarKurus >= 0 ? "pozitif" : "negatif",
    },
    { etiket: "─", tutarKurus: 0, ayrac: true },

    // ── İşletme Giderleri ────────────────────────────────────────────────
    ...giderler.map((g) => ({
      etiket:   g.kategori,
      tutarKurus:    (-g.tutarKurus),
      oran:     oran(g.tutarKurus),
      altSatir: true,
      vurgu:    "negatif" as const,
    })),
    {
      etiket: "Toplam İşletme Gideri",
      tutarKurus:  (-toplamGiderKurus),
      oran:   oran(toplamGiderKurus),
      vurgu:  "negatif" as const,
    },
    { etiket: "─", tutarKurus: 0, ayrac: true },

    // ── Net Kâr ──────────────────────────────────────────────────────────
    {
      etiket: `Net Kâr  (%${(netMarj * 100).toFixed(1)} marj)`,
      tutarKurus:  netKarKurus,
      oran:   oran(netKarKurus),
      vurgu:  netKarKurus >= 0 ? "pozitif" : "negatif",
    },
  ];

  return {
    ciroKurus,
    smmKurus,
    brutKarKurus,
    brutMarj,
    toplamGiderKurus,
    netKarKurus,
    netMarj,
    basaBazCiroKurus,
    satirlar,
    donemBaslangic: new Date(basTs).toISOString().split("T")[0],
    donemBitis:     new Date(bitTs).toISOString().split("T")[0],
  };
}

/**
 * Yardımcı — bu ayın P&L'ini tek satırda al.
 */
export function buayinPL(
  kayitlar: SatisKaydi[],
  giderler: GiderItem[],
): PLSonucu {
  return plTablosu(kayitlar, giderler);
}
