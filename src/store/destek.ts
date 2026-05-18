"use client";

import { create } from "zustand";
import { createClient } from "@/utils/supabase/client";
import {
  type DestekTalep, type DestekMesaj, type DestekKategori,
  type DestekOncelik, type DestekDurum, type DestekEk,
  taleptenRow, mesajdanRow,
} from "@/lib/destek-data";

interface YeniTalepForm {
  konu:     string;
  kategori: DestekKategori;
  oncelik:  DestekOncelik;
  mesaj:    string;
  ekler:    DestekEk[];
}

interface DestekStore {
  talepler:       DestekTalep[];
  mesajlar:       Record<string, DestekMesaj[]>;
  yukleniyor:     boolean;
  mesajYukleniyor: Record<string, boolean>;

  taleplerYukle:   () => Promise<void>;
  mesajlarYukle:   (talepId: string) => Promise<void>;
  yeniTalep:       (form: YeniTalepForm, kullaniciId: string, kullaniciEmail: string, kullaniciAd: string | null, sirketId: string | null) => Promise<string | null>;
  yeniMesaj:       (talepId: string, mesaj: string, ekler: DestekEk[], icNot?: boolean) => Promise<DestekMesaj | null>;
  durumGuncelle:   (talepId: string, yeniDurum: DestekDurum) => Promise<void>;
  memnuniyetVer:   (talepId: string, puan: number, yorum?: string) => Promise<void>;
  kullaniciOkundu: (talepId: string) => Promise<void>;
  adminOkundu:     (talepId: string) => Promise<void>;
  syncTalep:       (talep: DestekTalep) => void;
  syncMesaj:       (mesaj: DestekMesaj) => void;
}

export const useDestek = create<DestekStore>((set, get) => ({
  talepler:        [],
  mesajlar:        {},
  yukleniyor:      false,
  mesajYukleniyor: {},

  taleplerYukle: async () => {
    set({ yukleniyor: true });
    const sb = createClient();
    const { data } = await sb
      .from("destek_talepleri")
      .select("*")
      .order("son_mesaj_tarihi", { ascending: false });
    set({
      talepler: (data ?? []).map(r => taleptenRow(r as Record<string, unknown>)),
      yukleniyor: false,
    });
  },

  mesajlarYukle: async (talepId) => {
    set(s => ({ mesajYukleniyor: { ...s.mesajYukleniyor, [talepId]: true } }));
    const sb = createClient();
    const { data } = await sb
      .from("destek_mesajlari")
      .select("*")
      .eq("talep_id", talepId)
      .order("olusturma", { ascending: true });
    set(s => ({
      mesajlar: {
        ...s.mesajlar,
        [talepId]: (data ?? []).map(r => mesajdanRow(r as Record<string, unknown>)),
      },
      mesajYukleniyor: { ...s.mesajYukleniyor, [talepId]: false },
    }));
  },

  yeniTalep: async (form, kullaniciId, kullaniciEmail, kullaniciAd, sirketId) => {
    const sb = createClient();
    const { data: talep, error: talepErr } = await sb
      .from("destek_talepleri")
      .insert({
        kullanici_id:    kullaniciId,
        kullanici_email: kullaniciEmail,
        kullanici_ad:    kullaniciAd,
        sirket_id:       sirketId,
        konu:            form.konu,
        kategori:        form.kategori,
        oncelik:         form.oncelik,
      })
      .select()
      .single();
    if (talepErr || !talep) return null;

    await sb.from("destek_mesajlari").insert({
      talep_id:     talep.id,
      gonderen_tip: "kullanici",
      gonderen_id:  kullaniciId,
      gonderen_ad:  kullaniciAd,
      mesaj:        form.mesaj,
      ekler:        form.ekler,
    });

    const yeniTalepObj = taleptenRow(talep as Record<string, unknown>);
    set(s => ({ talepler: [yeniTalepObj, ...s.talepler] }));
    return talep.id as string;
  },

  yeniMesaj: async (talepId, mesaj, ekler, icNot = false) => {
    const sb = createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return null;

    const talep = get().talepler.find(t => t.id === talepId);

    const { data, error } = await sb
      .from("destek_mesajlari")
      .insert({
        talep_id:     talepId,
        gonderen_tip: "kullanici",
        gonderen_id:  user.id,
        gonderen_ad:  talep?.kullaniciAd ?? null,
        mesaj,
        ekler,
        ic_not: icNot,
      })
      .select()
      .single();
    if (error || !data) return null;

    await sb
      .from("destek_talepleri")
      .update({ son_mesaj_tarihi: new Date().toISOString(), guncellenme: new Date().toISOString() })
      .eq("id", talepId);

    const yeni = mesajdanRow(data as Record<string, unknown>);
    set(s => ({
      mesajlar: {
        ...s.mesajlar,
        [talepId]: [...(s.mesajlar[talepId] ?? []), yeni],
      },
    }));
    return yeni;
  },

  durumGuncelle: async (talepId, yeniDurum) => {
    const sb = createClient();
    const eskiTalep = get().talepler.find(t => t.id === talepId);
    await sb
      .from("destek_talepleri")
      .update({ durum: yeniDurum, guncellenme: new Date().toISOString() })
      .eq("id", talepId);

    // Sistem mesajı ekle
    if (eskiTalep) {
      const { DURUM_ETIKETLERI } = await import("@/lib/destek-data");
      await sb.from("destek_mesajlari").insert({
        talep_id:     talepId,
        gonderen_tip: "sistem",
        mesaj:        `Talep durumu "${DURUM_ETIKETLERI[eskiTalep.durum]}" → "${DURUM_ETIKETLERI[yeniDurum]}" olarak değiştirildi.`,
      });
    }

    set(s => ({
      talepler: s.talepler.map(t =>
        t.id === talepId ? { ...t, durum: yeniDurum } : t
      ),
    }));
  },

  memnuniyetVer: async (talepId, puan, yorum) => {
    const sb = createClient();
    await sb
      .from("destek_talepleri")
      .update({ memnuniyet_puan: puan, memnuniyet_yorum: yorum ?? null })
      .eq("id", talepId);
    set(s => ({
      talepler: s.talepler.map(t =>
        t.id === talepId ? { ...t, memnuniyetPuan: puan, memnuniyetYorum: yorum ?? null } : t
      ),
    }));
  },

  kullaniciOkundu: async (talepId) => {
    const sb = createClient();
    await sb
      .from("destek_talepleri")
      .update({ kullanici_okundu: true })
      .eq("id", talepId);
    await sb
      .from("destek_mesajlari")
      .update({ okundu: true })
      .eq("talep_id", talepId)
      .eq("gonderen_tip", "admin");
    set(s => ({
      talepler: s.talepler.map(t =>
        t.id === talepId ? { ...t, kullaniciOkundu: true } : t
      ),
    }));
  },

  adminOkundu: async (talepId) => {
    const sb = createClient();
    await sb
      .from("destek_talepleri")
      .update({ admin_okundu: true })
      .eq("id", talepId);
    await sb
      .from("destek_mesajlari")
      .update({ okundu: true })
      .eq("talep_id", talepId)
      .eq("gonderen_tip", "kullanici");
    set(s => ({
      talepler: s.talepler.map(t =>
        t.id === talepId ? { ...t, adminOkundu: true } : t
      ),
    }));
  },

  syncTalep: (talep) => {
    set(s => {
      const var_ = s.talepler.find(t => t.id === talep.id);
      if (var_) return { talepler: s.talepler.map(t => t.id === talep.id ? talep : t) };
      return { talepler: [talep, ...s.talepler] };
    });
  },

  syncMesaj: (mesaj) => {
    set(s => {
      const liste = s.mesajlar[mesaj.talepId] ?? [];
      if (liste.find(m => m.id === mesaj.id)) return s;
      return { mesajlar: { ...s.mesajlar, [mesaj.talepId]: [...liste, mesaj] } };
    });
  },
}));
