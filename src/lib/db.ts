/**
 * Supabase CRUD — her tablo için yardımcı fonksiyonlar.
 * RLS sayesinde kullanıcı yalnızca kendi verilerini görür.
 */
import { createClient } from "@/utils/supabase/client";
import type { Islem }       from "./nakit-data";
import type { Gorev }       from "./gorev-data";
import type { Urun }        from "./stok-data";
import type { Bildirim }    from "@/store/bildirimler";
import type { Prosedur, ChecklistItem } from "./prosedur-data";
import type { FonIslem, FonHedef }      from "./acil-fon-data";
import type { IsletmeGideri }           from "./kar-zarar-data";

const sb = () => createClient();

function kontrol(hata: unknown, islem: string) {
  if (hata) {
    const err = hata as { message?: string; code?: string; details?: string };
    console.error(`[DB Hatası] ${islem}:`, err.message ?? hata, { code: err.code, details: err.details });
  }
}

/* ─────────────── NAKİT İŞLEMLER ─────────────── */
export const nakitDB = {
  getAll: async (): Promise<Islem[]> => {
    const { data, error } = await sb()
      .from("nakit_islemler")
      .select("*")
      .order("tarih", { ascending: false });
    kontrol(error, "nakit.getAll");
    return (data ?? []).map((r) => ({
      id: r.id, tip: r.tip, tutar: Number(r.tutar),
      kategori: r.kategori, aciklama: r.aciklama,
      tarih: r.tarih, odemeYontemi: r.odeme_yontemi,
    }));
  },
  ekle: async (userId: string, i: Islem) => {
    const { error } = await sb().from("nakit_islemler").insert({
      id: i.id, user_id: userId, tip: i.tip, tutar: i.tutar,
      kategori: i.kategori, aciklama: i.aciklama,
      tarih: i.tarih, odeme_yontemi: i.odemeYontemi,
    });
    kontrol(error, `nakit.ekle(${i.id})`);
  },
  guncelle: async (i: Islem) => {
    const { error } = await sb().from("nakit_islemler").update({
      tip: i.tip, tutar: i.tutar, kategori: i.kategori,
      aciklama: i.aciklama, tarih: i.tarih, odeme_yontemi: i.odemeYontemi,
    }).eq("id", i.id);
    kontrol(error, `nakit.guncelle(${i.id})`);
  },
  sil: async (id: string) => {
    const { error } = await sb().from("nakit_islemler").delete().eq("id", id);
    kontrol(error, `nakit.sil(${id})`);
  },
};

/* ─────────────── GÖREVLER ─────────────── */
export const gorevlerDB = {
  getAll: async (): Promise<Gorev[]> => {
    const { data, error } = await sb()
      .from("gorevler")
      .select("*")
      .order("olusturma_tarih", { ascending: false });
    kontrol(error, "gorevler.getAll");
    return (data ?? []).map((r) => ({
      id: r.id, baslik: r.baslik, aciklama: r.aciklama,
      sorumlu: r.sorumlu, sonTarih: r.son_tarih,
      oncelik: r.oncelik, durum: r.durum, olusturmaTarih: r.olusturma_tarih,
    }));
  },
  ekle: async (userId: string, g: Gorev) => {
    const { error } = await sb().from("gorevler").insert({
      id: g.id, user_id: userId, baslik: g.baslik, aciklama: g.aciklama,
      sorumlu: g.sorumlu, son_tarih: g.sonTarih,
      oncelik: g.oncelik, durum: g.durum, olusturma_tarih: g.olusturmaTarih,
    });
    kontrol(error, `gorev.ekle(${g.id})`);
  },
  guncelle: async (id: string, g: Partial<Gorev>) => {
    const row: Record<string, unknown> = {};
    if (g.baslik    !== undefined) row.baslik     = g.baslik;
    if (g.aciklama  !== undefined) row.aciklama   = g.aciklama;
    if (g.sorumlu   !== undefined) row.sorumlu    = g.sorumlu;
    if (g.sonTarih  !== undefined) row.son_tarih  = g.sonTarih;
    if (g.oncelik   !== undefined) row.oncelik    = g.oncelik;
    if (g.durum     !== undefined) row.durum      = g.durum;
    const { error } = await sb().from("gorevler").update(row).eq("id", id);
    kontrol(error, `gorev.guncelle(${id})`);
  },
  sil: async (id: string) => {
    const { error } = await sb().from("gorevler").delete().eq("id", id);
    kontrol(error, `gorev.sil(${id})`);
  },
};

/* ─────────────── STOK ─────────────── */
export const stokDB = {
  getAll: async (): Promise<Urun[]> => {
    const { data, error } = await sb().from("stok_urunler").select("*").order("ad");
    kontrol(error, "stok.getAll");
    return (data ?? []).map((r) => ({
      id: r.id, ad: r.ad, sku: r.sku, kategori: r.kategori,
      mevcutAdet: Number(r.mevcut_adet), emniyetStogu: Number(r.emniyet_stogu),
      kritikStok: Number(r.kritik_stok), gunlukSatis: Number(r.gunluk_satis),
      birim: r.birim, sonHareket: r.son_hareket,
    }));
  },
  ekle: async (userId: string, u: Urun) => {
    const { error } = await sb().from("stok_urunler").insert({
      id: u.id, user_id: userId, ad: u.ad, sku: u.sku, kategori: u.kategori,
      mevcut_adet: u.mevcutAdet, emniyet_stogu: u.emniyetStogu,
      kritik_stok: u.kritikStok, gunluk_satis: u.gunlukSatis,
      birim: u.birim, son_hareket: u.sonHareket,
    });
    kontrol(error, `stok.ekle(${u.id})`);
  },
  guncelle: async (id: string, u: Partial<Urun>) => {
    const row: Record<string, unknown> = {};
    if (u.ad           !== undefined) row.ad            = u.ad;
    if (u.sku          !== undefined) row.sku           = u.sku;
    if (u.kategori     !== undefined) row.kategori      = u.kategori;
    if (u.mevcutAdet   !== undefined) row.mevcut_adet   = u.mevcutAdet;
    if (u.emniyetStogu !== undefined) row.emniyet_stogu = u.emniyetStogu;
    if (u.kritikStok   !== undefined) row.kritik_stok   = u.kritikStok;
    if (u.gunlukSatis  !== undefined) row.gunluk_satis  = u.gunlukSatis;
    if (u.birim        !== undefined) row.birim         = u.birim;
    if (u.sonHareket   !== undefined) row.son_hareket   = u.sonHareket;
    const { error } = await sb().from("stok_urunler").update(row).eq("id", id);
    kontrol(error, `stok.guncelle(${id})`);
  },
  sil: async (id: string) => {
    const { error } = await sb().from("stok_urunler").delete().eq("id", id);
    kontrol(error, `stok.sil(${id})`);
  },
};

/* ─────────────── BİLDİRİMLER ─────────────── */
export const bildirimlerDB = {
  getAll: async (): Promise<Bildirim[]> => {
    const { data, error } = await sb()
      .from("bildirimler")
      .select("*")
      .order("tarih", { ascending: false });
    kontrol(error, "bildirimler.getAll");
    return (data ?? []).map((r) => ({
      id: r.id, baslik: r.baslik, mesaj: r.mesaj,
      tip: r.tip, modul: r.modul, tarih: r.tarih, okundu: r.okundu,
    }));
  },
  ekle: async (userId: string, b: Bildirim) => {
    const { error } = await sb().from("bildirimler").insert({
      id: b.id, user_id: userId, baslik: b.baslik, mesaj: b.mesaj,
      tip: b.tip, modul: b.modul, tarih: b.tarih, okundu: b.okundu,
    });
    kontrol(error, `bildirim.ekle(${b.id})`);
  },
  guncelle: async (id: string, okundu: boolean) => {
    const { error } = await sb().from("bildirimler").update({ okundu }).eq("id", id);
    kontrol(error, `bildirim.guncelle(${id})`);
  },
  tumunuGuncelle: async (userId: string) => {
    const { error } = await sb().from("bildirimler").update({ okundu: true }).eq("user_id", userId);
    kontrol(error, "bildirim.tumunuGuncelle");
  },
  sil: async (id: string) => {
    const { error } = await sb().from("bildirimler").delete().eq("id", id);
    kontrol(error, `bildirim.sil(${id})`);
  },
  tumunuSil: async (userId: string) => {
    const { error } = await sb().from("bildirimler").delete().eq("user_id", userId);
    kontrol(error, "bildirim.tumunuSil");
  },
};

/* ─────────────── PROSEDÜRLER ─────────────── */
export const prosedurlerDB = {
  getAll: async (): Promise<Prosedur[]> => {
    const { data, error } = await sb()
      .from("prosedurler")
      .select("*")
      .order("son_guncelleme", { ascending: false });
    kontrol(error, "prosedurler.getAll");
    return (data ?? []).map((r) => ({
      id: r.id, baslik: r.baslik, kategori: r.kategori, aciklama: r.aciklama,
      adimlar: r.adimlar ?? [], sorumlu: r.sorumlu, sonGuncelleme: r.son_guncelleme,
    }));
  },
  ekle: async (userId: string, p: Prosedur) => {
    const { error } = await sb().from("prosedurler").insert({
      id: p.id, user_id: userId, baslik: p.baslik, kategori: p.kategori,
      aciklama: p.aciklama, adimlar: p.adimlar, sorumlu: p.sorumlu,
      son_guncelleme: p.sonGuncelleme,
    });
    kontrol(error, `prosedur.ekle(${p.id})`);
  },
  guncelle: async (p: Prosedur) => {
    const { error } = await sb().from("prosedurler").update({
      baslik: p.baslik, kategori: p.kategori, aciklama: p.aciklama,
      adimlar: p.adimlar, sorumlu: p.sorumlu, son_guncelleme: p.sonGuncelleme,
    }).eq("id", p.id);
    kontrol(error, `prosedur.guncelle(${p.id})`);
  },
  sil: async (id: string) => {
    const { error } = await sb().from("prosedurler").delete().eq("id", id);
    kontrol(error, `prosedur.sil(${id})`);
  },
};

/* ─────────────── CHECKLİST ─────────────── */
export const checklistDB = {
  getAll: async (): Promise<ChecklistItem[]> => {
    const { data, error } = await sb().from("checklist_items").select("*");
    kontrol(error, "checklist.getAll");
    return (data ?? []).map((r) => ({
      id: r.id, baslik: r.baslik, kategori: r.kategori,
      sikligi: r.sikligi, tamamlandi: r.tamamlandi, sorumlu: r.sorumlu ?? "",
    }));
  },
  ekle: async (userId: string, c: ChecklistItem) => {
    const { error } = await sb().from("checklist_items").insert({
      id: c.id, user_id: userId, baslik: c.baslik, kategori: c.kategori,
      sikligi: c.sikligi, tamamlandi: c.tamamlandi, sorumlu: c.sorumlu ?? "",
    });
    kontrol(error, `checklist.ekle(${c.id})`);
  },
  guncelle: async (id: string, tamamlandi: boolean) => {
    const { error } = await sb().from("checklist_items").update({ tamamlandi }).eq("id", id);
    kontrol(error, `checklist.guncelle(${id})`);
  },
  sil: async (id: string) => {
    const { error } = await sb().from("checklist_items").delete().eq("id", id);
    kontrol(error, `checklist.sil(${id})`);
  },
};

/* ─────────────── ACİL FON HEDEFLERİ ─────────────── */
export const acilFonHedeflerDB = {
  getAll: async (): Promise<FonHedef[]> => {
    const { data, error } = await sb()
      .from("acil_fon_hedefler")
      .select("*")
      .order("olusturma_tarih");
    kontrol(error, "acilFonHedefler.getAll");
    return (data ?? []).map((r) => ({
      id: r.id, ad: r.ad,
      toplamHedef: Number(r.toplam_hedef),
      aylikOdeme: Number(r.aylik_odeme),
      odemeGunu: r.odeme_gunu ?? 1,
      aciklama: r.aciklama ?? "",
      olusturmaTarih: r.olusturma_tarih,
    }));
  },
  ekle: async (userId: string, h: FonHedef) => {
    const { error } = await sb().from("acil_fon_hedefler").insert({
      id: h.id, user_id: userId, ad: h.ad,
      toplam_hedef: h.toplamHedef, aylik_odeme: h.aylikOdeme,
      odeme_gunu: h.odemeGunu, aciklama: h.aciklama ?? "",
      olusturma_tarih: h.olusturmaTarih,
    });
    kontrol(error, `acilFonHedef.ekle(${h.id})`);
  },
  guncelle: async (id: string, h: Partial<FonHedef>) => {
    const row: Record<string, unknown> = {};
    if (h.ad          !== undefined) row.ad            = h.ad;
    if (h.toplamHedef !== undefined) row.toplam_hedef  = h.toplamHedef;
    if (h.aylikOdeme  !== undefined) row.aylik_odeme   = h.aylikOdeme;
    if (h.odemeGunu   !== undefined) row.odeme_gunu    = h.odemeGunu;
    if (h.aciklama    !== undefined) row.aciklama      = h.aciklama;
    const { error } = await sb().from("acil_fon_hedefler").update(row).eq("id", id);
    kontrol(error, `acilFonHedef.guncelle(${id})`);
  },
  sil: async (id: string) => {
    const { error } = await sb().from("acil_fon_hedefler").delete().eq("id", id);
    kontrol(error, `acilFonHedef.sil(${id})`);
  },
};

/* ─────────────── ACİL FON İŞLEMLERİ ─────────────── */
export const acilFonIslemlerDB = {
  getAll: async (): Promise<FonIslem[]> => {
    const { data, error } = await sb()
      .from("acil_fon_islemler")
      .select("*")
      .order("tarih", { ascending: false });
    kontrol(error, "acilFonIslemler.getAll");
    return (data ?? []).map((r) => ({
      id: r.id, tip: r.tip, tutar: Number(r.tutar),
      aciklama: r.aciklama, tarih: r.tarih,
      hedefId: r.hedef_id ?? undefined,
    }));
  },
  ekle: async (userId: string, i: FonIslem) => {
    const { error } = await sb().from("acil_fon_islemler").insert({
      id: i.id, user_id: userId, hedef_id: i.hedefId ?? null,
      tip: i.tip, tutar: i.tutar, aciklama: i.aciklama, tarih: i.tarih,
    });
    kontrol(error, `acilFonIslem.ekle(${i.id})`);
  },
  guncelle: async (id: string, i: Omit<FonIslem, "id">) => {
    const { error } = await sb().from("acil_fon_islemler").update({
      tip: i.tip, tutar: i.tutar, aciklama: i.aciklama,
      tarih: i.tarih, hedef_id: i.hedefId ?? null,
    }).eq("id", id);
    kontrol(error, `acilFonIslem.guncelle(${id})`);
  },
  sil: async (id: string) => {
    const { error } = await sb().from("acil_fon_islemler").delete().eq("id", id);
    kontrol(error, `acilFonIslem.sil(${id})`);
  },
};

/* ─────────────── İŞLETME GİDERLERİ ─────────────── */
export type GiderRow = IsletmeGideri & { dbId: string };

export const isletmeGiderleriDB = {
  getAll: async (): Promise<GiderRow[]> => {
    const { data, error } = await sb().from("isletme_giderleri").select("*");
    kontrol(error, "isletmeGiderleri.getAll");
    return (data ?? []).map((r) => ({
      dbId: r.id, kategori: r.kategori, tutar: Number(r.tutar),
    }));
  },
  ekle: async (userId: string, g: IsletmeGideri): Promise<string> => {
    const { data, error } = await sb()
      .from("isletme_giderleri")
      .insert({ user_id: userId, kategori: g.kategori, tutar: g.tutar })
      .select("id")
      .single();
    kontrol(error, "isletmeGider.ekle");
    return data?.id ?? "";
  },
  guncelle: async (dbId: string, tutar: number) => {
    const { error } = await sb()
      .from("isletme_giderleri")
      .update({ tutar })
      .eq("id", dbId);
    kontrol(error, `isletmeGider.guncelle(${dbId})`);
  },
  sil: async (dbId: string) => {
    const { error } = await sb().from("isletme_giderleri").delete().eq("id", dbId);
    kontrol(error, `isletmeGider.sil(${dbId})`);
  },
};
