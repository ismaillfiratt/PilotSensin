/**
 * KDV hesaplama yardımcısı.
 * Tüm para değerleri TL (float) cinsinden.
 * D/H (dahil/hariç) ve indirilebilirlik desteği ile çalışır.
 */

export interface KdvHesabi {
  brut:          number;   // Toplam ödeme tutarı (KDV dahil)
  net:           number;   // KDV hariç (gider olarak yazılan)
  kdv:           number;   // KDV tutarı
  indirilebilir: number;   // İndirilecek KDV (yurtiçi = kdv, yurtdışı = 0)
}

/**
 * Girilen tutardan KDV bileşenlerini hesaplar.
 *
 * @param girilen        Kullanıcının girdiği tutar (TL)
 * @param kdvDahilHaric  "dahil" → girilen = brüt, "haric" → girilen = net
 * @param kdvOrani       0–100 arasında KDV oranı (0 = KDV'siz)
 * @param indirilebilir  true → KDV beyanında indirilir (yurtiçi), false → indirilmez
 */
export function kdvHesapla(
  girilen:       number,
  kdvDahilHaric: "dahil" | "haric",
  kdvOrani:      number,
  indirilebilir: boolean,
): KdvHesabi {
  if (kdvOrani <= 0 || girilen <= 0) {
    return { brut: girilen, net: girilen, kdv: 0, indirilebilir: 0 };
  }

  const oran = kdvOrani / 100;
  let brut: number, net: number, kdv: number;

  if (kdvDahilHaric === "dahil") {
    brut = girilen;
    net  = girilen / (1 + oran);
    kdv  = brut - net;
  } else {
    net  = girilen;
    kdv  = girilen * oran;
    brut = net + kdv;
  }

  return {
    brut:          round2(brut),
    net:           round2(net),
    kdv:           round2(kdv),
    indirilebilir: indirilebilir ? round2(kdv) : 0,
  };
}

/** 2 ondalık basamakta yuvarlama. */
function round2(n: number) {
  return Math.round(n * 100) / 100;
}
