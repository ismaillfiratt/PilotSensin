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

/* ─────────────── NAKİT İŞLEMLER ─────────────── */
export const nakitDB = {
  getAll: async (): Promise<Islem[]> => {
    const { data } = await sb().from("nakit_islemler").select("*").order("tarih", { ascending: false });
    return (data ?? []).map(r => ({
      id: r.id, tip: r.tip, tutar: Number(r.tutar),
      kategori: r.kategori, aciklama: r.aciklama,
      tarih: r.tarih, odemeYontemi: r.odeme_yontemi,
    }));
  },
  ekle: async (userId: string, i: Islem) => {
    await sb().from("nakit_islemler").insert({
      id: i.id, user_id: userId, tip: i.tip, tutar: i.tutar,
      kategori: i.kategori, aciklama: i.aciklama,
      tarih: i.tarih, odeme_yontemi: i.odemeYontemi,
    });
  },
  guncelle: async (i: Islem) => {
    await sb().from("nakit_islemler").update({
      tip: i.tip, tutar: i.tutar, kategori: i.kategori,
      aciklama: i.aciklama, tarih: i.tarih, odeme_yontemi: i.odemeYontemi,
    }).eq("id", i.id);
  },
  sil: async (id: string) => {
    await sb().from("nakit_islemler").delete().eq("id", id);
  },
};

/* ─────────────── GÖREVLER ─────────────── */
export const gorevlerDB = {
  getAll: async (): Promise<Gorev[]> => {
    const { data } = await sb().from("gorevler").select("*").order("olusturma_tarih", { ascending: false });
    return (data ?? []).map(r => ({
      id: r.id, baslik: r.baslik, aciklama: r.aciklama,
      sorumlu: r.sorumlu, sonTarih: r.son_tarih,
      oncelik: r.oncelik, durum: r.durum, olusturmaTarih: r.olusturma_tarih,
    }));
  },
  ekle: async (userId: string, g: Gorev) => {
    await sb().from("gorevler").insert({
      id: g.id, user_id: userId, baslik: g.baslik, aciklama: g.aciklama,
      sorumlu: g.sorumlu, son_tarih: g.sonTarih,
      oncelik: g.oncelik, durum: g.durum, olusturma_tarih: g.olusturmaTarih,
    });
  },
  guncelle: async (id: string, g: Partial<Gorev>) => {
    const row: Record<string, unknown> = {};
    if (g.baslik    !== undefined) row.baslik     = g.baslik;
    if (g.aciklama  !== undefined) row.aciklama   = g.aciklama;
    if (g.sorumlu   !== undefined) row.sorumlu    = g.sorumlu;
    if (g.sonTarih  !== undefined) row.son_tarih  = g.sonTarih;
    if (g.oncelik   !== undefined) row.oncelik    = g.oncelik;
    if (g.durum     !== undefined) row.durum      = g.durum;
    await sb().from("gorevler").update(row).eq("id", id);
  },
  sil: async (id: string) => {
    await sb().from("gorevler").delete().eq("id", id);
  },
};

/* ─────────────── STOK ─────────────── */
export const stokDB = {
  getAll: async (): Promise<Urun[]> => {
    const { data } = await sb().from("stok_urunler").select("*").order("ad");
    return (data ?? []).map(r => ({
      id: r.id, ad: r.ad, sku: r.sku, kategori: r.kategori,
      mevcutAdet: Number(r.mevcut_adet), emniyetStogu: Number(r.emniyet_stogu),
      kritikStok: Number(r.kritik_stok), gunlukSatis: Number(r.gunluk_satis),
      birim: r.birim, sonHareket: r.son_hareket,
    }));
  },
  ekle: async (userId: string, u: Urun) => {
    await sb().from("stok_urunler").insert({
      id: u.id, user_id: userId, ad: u.ad, sku: u.sku, kategori: u.kategori,
      mevcut_adet: u.mevcutAdet, emniyet_stogu: u.emniyetStogu,
      kritik_stok: u.kritikStok, gunluk_satis: u.gunlukSatis,
      birim: u.birim, son_hareket: u.sonHareket,
    });
  },
  guncelle: async (id: string, u: Partial<Urun>) => {
    const row: Record<string, unknown> = {};
    if (u.ad          !== undefined) row.ad            = u.ad;
    if (u.sku         !== undefined) row.sku           = u.sku;
    if (u.kategori    !== undefined) row.kategori      = u.kategori;
    if (u.mevcutAdet  !== undefined) row.mevcut_adet   = u.mevcutAdet;
    if (u.emniyetStogu !== undefined) row.emniyet_stogu = u.emniyetStogu;
    if (u.kritikStok  !== undefined) row.kritik_stok   = u.kritikStok;
    if (u.gunlukSatis !== undefined) row.gunluk_satis  = u.gunlukSatis;
    if (u.birim       !== undefined) row.birim         = u.birim;
    if (u.sonHareket  !== undefined) row.son_hareket   = u.sonHareket;
    await sb().from("stok_urunler").update(row).eq("id", id);
  },
  sil: async (id: string) => {
    await sb().from("stok_urunler").delete().eq("id", id);
  },
};

/* ─────────────── BİLDİRİMLER ─────────────── */
export const bildirimlerDB = {
  getAll: async (): Promise<Bildirim[]> => {
    const { data } = await sb().from("bildirimler").select("*").order("tarih", { ascending: false });
    return (data ?? []).map(r => ({
      id: r.id, baslik: r.baslik, mesaj: r.mesaj,
      tip: r.tip, modul: r.modul, tarih: r.tarih, okundu: r.okundu,
    }));
  },
  ekle: async (userId: string, b: Bildirim) => {
    await sb().from("bildirimler").insert({
      id: b.id, user_id: userId, baslik: b.baslik, mesaj: b.mesaj,
      tip: b.tip, modul: b.modul, tarih: b.tarih, okundu: b.okundu,
    });
  },
  guncelle: async (id: string, okundu: boolean) => {
    await sb().from("bildirimler").update({ okundu }).eq("id", id);
  },
  tumunuGuncelle: async (userId: string) => {
    await sb().from("bildirimler").update({ okundu: true }).eq("user_id", userId);
  },
  sil: async (id: string) => {
    await sb().from("bildirimler").delete().eq("id", id);
  },
  tumunuSil: async (userId: string) => {
    await sb().from("bildirimler").delete().eq("user_id", userId);
  },
};

/* ─────────────── PROSEDÜRLER ─────────────── */
export const prosedurlerDB = {
  getAll: async (): Promise<Prosedur[]> => {
    const { data } = await sb().from("prosedurler").select("*").order("son_guncelleme", { ascending: false });
    return (data ?? []).map(r => ({
      id: r.id, baslik: r.baslik, kategori: r.kategori, aciklama: r.aciklama,
      adimlar: r.adimlar ?? [], sorumlu: r.sorumlu, sonGuncelleme: r.son_guncelleme,
    }));
  },
  ekle: async (userId: string, p: Prosedur) => {
    await sb().from("prosedurler").insert({
      id: p.id, user_id: userId, baslik: p.baslik, kategori: p.kategori,
      aciklama: p.aciklama, adimlar: p.adimlar, sorumlu: p.sorumlu,
      son_guncelleme: p.sonGuncelleme,
    });
  },
  guncelle: async (p: Prosedur) => {
    await sb().from("prosedurler").update({
      baslik: p.baslik, kategori: p.kategori, aciklama: p.aciklama,
      adimlar: p.adimlar, sorumlu: p.sorumlu, son_guncelleme: p.sonGuncelleme,
    }).eq("id", p.id);
  },
  sil: async (id: string) => {
    await sb().from("prosedurler").delete().eq("id", id);
  },
};

/* ─────────────── CHECKLİST ─────────────── */
export const checklistDB = {
  getAll: async (): Promise<ChecklistItem[]> => {
    const { data } = await sb().from("checklist_items").select("*");
    return (data ?? []).map(r => ({
      id: r.id, baslik: r.baslik, kategori: r.kategori,
      sikligi: r.sikligi, tamamlandi: r.tamamlandi, sorumlu: r.sorumlu ?? "",
    }));
  },
  ekle: async (userId: string, c: ChecklistItem) => {
    await sb().from("checklist_items").insert({
      id: c.id, user_id: userId, baslik: c.baslik, kategori: c.kategori,
      sikligi: c.sikligi, tamamlandi: c.tamamlandi,
    });
  },
  guncelle: async (id: string, tamamlandi: boolean) => {
    await sb().from("checklist_items").update({ tamamlandi }).eq("id", id);
  },
  sil: async (id: string) => {
    await sb().from("checklist_items").delete().eq("id", id);
  },
};

/* ─────────────── ACİL FON HEDEFLERİ ─────────────── */
export const acilFonHedeflerDB = {
  getAll: async (): Promise<FonHedef[]> => {
    const { data } = await sb().from("acil_fon_hedefler").select("*").order("olusturma_tarih");
    return (data ?? []).map(r => ({
      id: r.id, ad: r.ad, toplamHedef: Number(r.toplam_hedef),
      aylikOdeme: Number(r.aylik_odeme), odemeGunu: r.odeme_gunu ?? 1,
      aciklama: r.aciklama ?? "", olusturmaTarih: r.olusturma_tarih,
    }));
  },
  ekle: async (userId: string, h: FonHedef) => {
    await sb().from("acil_fon_hedefler").insert({
      id: h.id, user_id: userId, ad: h.ad,
      toplam_hedef: h.toplamHedef, aylik_odeme: h.aylikOdeme,
      olusturma_tarih: h.olusturmaTarih,
    });
  },
  guncelle: async (id: string, h: Partial<FonHedef>) => {
    const row: Record<string, unknown> = {};
    if (h.ad          !== undefined) row.ad            = h.ad;
    if (h.toplamHedef !== undefined) row.toplam_hedef  = h.toplamHedef;
    if (h.aylikOdeme  !== undefined) row.aylik_odeme   = h.aylikOdeme;
    await sb().from("acil_fon_hedefler").update(row).eq("id", id);
  },
  sil: async (id: string) => {
    await sb().from("acil_fon_hedefler").delete().eq("id", id);
  },
};

/* ─────────────── ACİL FON İŞLEMLERİ ─────────────── */
export const acilFonIslemlerDB = {
  getAll: async (): Promise<FonIslem[]> => {
    const { data } = await sb().from("acil_fon_islemler").select("*").order("tarih", { ascending: false });
    return (data ?? []).map(r => ({
      id: r.id, tip: r.tip, tutar: Number(r.tutar),
      aciklama: r.aciklama, tarih: r.tarih, hedefId: r.hedef_id ?? undefined,
    }));
  },
  ekle: async (userId: string, i: FonIslem) => {
    await sb().from("acil_fon_islemler").insert({
      id: i.id, user_id: userId, hedef_id: i.hedefId ?? null,
      tip: i.tip, tutar: i.tutar, aciklama: i.aciklama, tarih: i.tarih,
    });
  },
  guncelle: async (id: string, i: Omit<FonIslem, "id">) => {
    await sb().from("acil_fon_islemler").update({
      tip: i.tip, tutar: i.tutar, aciklama: i.aciklama,
      tarih: i.tarih, hedef_id: i.hedefId ?? null,
    }).eq("id", id);
  },
  sil: async (id: string) => {
    await sb().from("acil_fon_islemler").delete().eq("id", id);
  },
};

/* ─────────────── İŞLETME GİDERLERİ ─────────────── */
export const isletmeGiderleriDB = {
  getAll: async (): Promise<(IsletmeGideri & { dbId: string })[]> => {
    const { data } = await sb().from("isletme_giderleri").select("*");
    return (data ?? []).map(r => ({ dbId: r.id, kategori: r.kategori, tutar: Number(r.tutar) }));
  },
  ekle: async (userId: string, g: IsletmeGideri): Promise<string> => {
    const { data } = await sb().from("isletme_giderleri")
      .insert({ user_id: userId, kategori: g.kategori, tutar: g.tutar })
      .select("id").single();
    return data?.id ?? "";
  },
  guncelle: async (dbId: string, tutar: number) => {
    await sb().from("isletme_giderleri").update({ tutar }).eq("id", dbId);
  },
  sil: async (dbId: string) => {
    await sb().from("isletme_giderleri").delete().eq("id", dbId);
  },
};
