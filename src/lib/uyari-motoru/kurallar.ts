import { stokDurumu }     from "@/lib/stok-data";
import { mevcutBirikim }  from "@/lib/acil-fon-data";
import type { Uyari, UyariBaglami } from "./tipler";

function tl(kurus: number): string {
  return (kurus / 100).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── A. Kasa bakiyesi negatif ──────────────────────────────────────────────────
export function nakitNegatifKurali(baglam: UyariBaglami): Uyari | null {
  const { nakitIslemleri } = baglam;

  const bakiye = nakitIslemleri
    .filter((i) => !i.silindi)
    .reduce((acc, i) => acc + (i.tip === "gelir" ? i.tutarKurus : -i.tutarKurus), 0);

  if (bakiye >= 0) return null;

  return {
    id:               "nakit-negatif",
    tip:              "kritik",
    modul:            "nakit-akisi",
    baslik:           "Kasa bakiyesi negatif",
    mesaj:            `Mevcut bakiye: ₺${tl(bakiye)} — acil aksiyon gerekli`,
    ilgiliLink:       "/nakit-akisi",
    oncelik:          100,
    metric:           bakiye,
    modulAksiyonKey:  "nakit-akisi",
  };
}

// ── B. Kasa minimum eşiğin altında ───────────────────────────────────────────
export function kasaMinAltiKurali(baglam: UyariBaglami): Uyari | null {
  const { nakitIslemleri, kasaMinEsikKurus } = baglam;

  if (kasaMinEsikKurus <= 0) return null;

  const bakiye = nakitIslemleri
    .filter((i) => !i.silindi)
    .reduce((acc, i) => acc + (i.tip === "gelir" ? i.tutarKurus : -i.tutarKurus), 0);

  if (bakiye >= kasaMinEsikKurus) return null;

  return {
    id:               "kasa-min-alti",
    tip:              "uyari",
    modul:            "nakit-akisi",
    baslik:           "Kasa minimum eşiğin altında",
    mesaj:            `Bakiye ₺${tl(bakiye)} · Eşik ₺${tl(kasaMinEsikKurus)}`,
    ilgiliLink:       "/nakit-akisi",
    oncelik:          80,
    metric:           bakiye,
    modulAksiyonKey:  "nakit-akisi",
  };
}

// ── C. Kritik stok ────────────────────────────────────────────────────────────
export function kritikStokKurali(baglam: UyariBaglami): Uyari | null {
  const kritikler = baglam.stokUrunleri.filter(
    (u) => !u.silindi && stokDurumu(u) === "kritik"
  );

  if (kritikler.length === 0) return null;

  return {
    id:               "stok-kritik",
    tip:              "kritik",
    modul:            "stok",
    baslik:           `${kritikler.length} ürün kritik stokta`,
    mesaj:            "Hemen tedarik gerekli — bu ürünler bitmek üzere",
    ilgiliLink:       "/stok?filtre=kritik",
    oncelik:          90,
    metric:           -kritikler.length,   // daha fazla kritik = daha negatif = daha kötü
    modulAksiyonKey:  "stok",
  };
}

// ── D. Gecikmiş görev ─────────────────────────────────────────────────────────
export function gecikGorevKurali(baglam: UyariBaglami): Uyari | null {
  const bugunBasi = new Date();
  bugunBasi.setHours(0, 0, 0, 0);

  const gec = baglam.gorevler.filter(
    (g) =>
      !g.silindi &&
      g.durum !== "tamamlandi" &&
      g.sonTarih &&
      new Date(g.sonTarih) < bugunBasi
  );

  if (gec.length === 0) return null;

  return {
    id:               "gorev-gecikmis",
    tip:              "uyari",
    modul:            "gorevler",
    baslik:           `${gec.length} gecikmiş görev`,
    mesaj:            "Son tarihi geçmiş ve hâlâ açık görevler var",
    ilgiliLink:       "/gorevler?filtre=geciken",
    oncelik:          70,
    metric:           -gec.length,         // daha fazla geciken = daha negatif = daha kötü
    modulAksiyonKey:  "gorev",
  };
}

// ── E. Acil fon yetersiz ──────────────────────────────────────────────────────
export function acilFonYetersizKurali(baglam: UyariBaglami): Uyari | null {
  const { acilFonHedefler, acilFonIslemler } = baglam;

  const kritikler = acilFonHedefler.filter((h) => {
    if (h.silindi || h.toplamHedefKurus <= 0) return false;
    const mevcut = mevcutBirikim(acilFonIslemler.filter((i) => !i.silindi), h.id);
    return mevcut / h.toplamHedefKurus < 0.3;
  });

  if (kritikler.length === 0) return null;

  return {
    id:               "acil-fon-yetersiz",
    tip:              "uyari",
    modul:            "acil-fon",
    baslik:           `${kritikler.length} acil fon hedefi yetersiz`,
    mesaj:            "Hedefin %30 altındaki birikimler — düzenli ödeme gerekli",
    ilgiliLink:       "/acil-fon",
    oncelik:          60,
    metric:           -kritikler.length,   // daha fazla yetersiz hedef = daha negatif = daha kötü
    modulAksiyonKey:  "acil-fon",
  };
}

// ── Kural listesi — buraya yeni kural eklemek yeterli ────────────────────────
export const TUM_KURALLAR = [
  nakitNegatifKurali,
  kasaMinAltiKurali,
  kritikStokKurali,
  gecikGorevKurali,
  acilFonYetersizKurali,
];
