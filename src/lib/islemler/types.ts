/**
 * İşlemler katmanı — ortak tip tanımları.
 * Her iş olayı (satış, alım, gider, düzeltme) bu tipleri kullanır.
 * islemId, ilgili tüm store kayıtlarını birbirine bağlar.
 */

import type { Kurus } from "@/lib/para";

/** Tüm ödeme yöntemleri */
export type OdemeYontemi = "nakit" | "kart" | "havale" | "cek" | "vadeli";

/** İşlem sonuç zarfı — atomik fonksiyonlar bunu döner */
export interface IslemSonuc<T = void> {
  basarili:   boolean;
  islemId:    string;
  veri?:      T;
  hata?:      string;
}

/** Satış işlemi girdisi */
export interface SatisGirdi {
  /** Stok ürün id'si. Hizmet satışlarında null geçilebilir. */
  urunId:           string | null;
  /** Serbest metin ürün adı (urunId null ise zorunlu) */
  urunAd?:          string;
  /** Satılan adet */
  adet:             number;
  /** KDV hariç birim satış fiyatı (kuruş) */
  birimSatisFiyatiKurus: Kurus;
  /** Kesir (0–1). Ör: 0.20 = %20 KDV */
  kdvOrani:         number;
  /** Ödeme yöntemi. "vadeli" ise nakit kaydı oluşturulmaz. */
  odemeYontemi:     OdemeYontemi;
  /** İşlem tarihi (ISO). Verilmezse şimdiki zaman. */
  tarih?:           string;
  /** Opsiyonel açıklama */
  aciklama?:        string;
  /** Caller tarafından sağlanan idempotency anahtarı. Aynı islemId ile tekrar çağrı yapılırsa işlem atlanır. */
  islemId?:         string;
}

/** Alım (tedarik/stok girişi) işlemi girdisi */
export interface AlimGirdi {
  /** Stok ürün id'si */
  urunId:           string;
  /** Alınan adet */
  adet:             number;
  /** KDV hariç birim alış fiyatı (kuruş) */
  birimAlisFiyatiKurus:  Kurus;
  /** Kesir (0–1). Ör: 0.20 = %20 KDV */
  kdvOrani:         number;
  /** Ödeme yöntemi */
  odemeYontemi:     OdemeYontemi;
  /** İşlem tarihi (ISO). Verilmezse şimdiki zaman. */
  tarih?:           string;
  /** Opsiyonel açıklama */
  aciklama?:        string;
  /** Caller tarafından sağlanan idempotency anahtarı. */
  islemId?:         string;
}

/** Gider işlemi girdisi */
export interface GiderGirdi {
  /** Gider kategorisi (GIDER_KATEGORILERI listesinden) */
  kategori:        string;
  /** Gider tutarı (kuruş) — KDV dahil ise kdvOrani de verilmeli */
  tutarKurus:           Kurus;
  /** Ödeme yöntemi */
  odemeYontemi:    OdemeYontemi;
  /** KDV oranı. 0 veya verilmezse KDV kaydı oluşturulmaz. */
  kdvOrani?:       number;
  /** İşlem tarihi (ISO). Verilmezse şimdiki zaman. */
  tarih?:          string;
  /** Opsiyonel açıklama */
  aciklama?:       string;
  /** Caller tarafından sağlanan idempotency anahtarı. */
  islemId?:        string;
}

/** Stok düzeltme girdisi (fire, sayım farkı vb.) */
export interface DuzeltmeGirdi {
  /** Stok ürün id'si */
  urunId:    string;
  /** Yeni mevcut adet (mutlak değer) */
  yeniAdet:  number;
  /** Düzeltme sebebi */
  sebep:     "fire" | "sayim-farki" | "iade" | "diger";
  /** Opsiyonel açıklama */
  aciklama?: string;
}
