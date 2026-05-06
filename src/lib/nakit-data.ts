export type IslemTipi = "gelir" | "gider";

export type OdemeyYontemi = "nakit" | "kart" | "havale" | "cek";

export interface Islem {
  id: string;
  tip: IslemTipi;
  tutar: number;
  kategori: string;
  aciklama: string;
  tarih: string; // ISO
  odemeYontemi: OdemeyYontemi;
}

export const GELIR_KATEGORILERI = [
  "Satış", "Hizmet Geliri", "Kira Geliri", "Faiz Geliri", "Diğer Gelir",
];

export const GIDER_KATEGORILERI = [
  "Kira", "Personel", "Tedarik / Hammadde", "Faturalar", "Vergi & SGK",
  "Pazarlama", "Ekipman", "Bakım & Onarım", "Diğer Gider",
];

// Son 8 haftalık mock işlemler
function tarih(gunGeri: number) {
  return new Date(Date.now() - gunGeri * 86400000).toISOString();
}

export const MOCK_ISLEMLER: Islem[] = [
  // Bu hafta
  { id: "i1",  tip: "gelir", tutar: 12400, kategori: "Satış",              aciklama: "Günlük satış",         tarih: tarih(0),  odemeYontemi: "nakit"  },
  { id: "i2",  tip: "gelir", tutar: 3200,  kategori: "Satış",              aciklama: "Kart ile satış",       tarih: tarih(1),  odemeYontemi: "kart"   },
  { id: "i3",  tip: "gider", tutar: 8500,  kategori: "Tedarik / Hammadde", aciklama: "Haftalık tedarik",     tarih: tarih(1),  odemeYontemi: "havale" },
  { id: "i4",  tip: "gider", tutar: 1200,  kategori: "Faturalar",          aciklama: "Elektrik faturası",    tarih: tarih(2),  odemeYontemi: "havale" },
  { id: "i5",  tip: "gelir", tutar: 9800,  kategori: "Satış",              aciklama: "Hafta sonu satışları", tarih: tarih(3),  odemeYontemi: "nakit"  },
  { id: "i6",  tip: "gider", tutar: 2200,  kategori: "Personel",           aciklama: "Haftalık avans",       tarih: tarih(3),  odemeYontemi: "nakit"  },
  // Geçen hafta
  { id: "i7",  tip: "gelir", tutar: 11200, kategori: "Satış",              aciklama: "Günlük satış",         tarih: tarih(7),  odemeYontemi: "nakit"  },
  { id: "i8",  tip: "gelir", tutar: 2800,  kategori: "Hizmet Geliri",      aciklama: "Danışmanlık",          tarih: tarih(8),  odemeYontemi: "havale" },
  { id: "i9",  tip: "gider", tutar: 9200,  kategori: "Tedarik / Hammadde", aciklama: "Stok takviyesi",       tarih: tarih(8),  odemeYontemi: "kart"   },
  { id: "i10", tip: "gider", tutar: 15000, kategori: "Kira",               aciklama: "Aylık kira",           tarih: tarih(9),  odemeYontemi: "havale" },
  { id: "i11", tip: "gelir", tutar: 8600,  kategori: "Satış",              aciklama: "Hafta sonu satışları", tarih: tarih(10), odemeYontemi: "nakit"  },
  { id: "i12", tip: "gider", tutar: 3400,  kategori: "Vergi & SGK",        aciklama: "KDV ödemesi",          tarih: tarih(11), odemeYontemi: "havale" },
  // 2 hafta önce
  { id: "i13", tip: "gelir", tutar: 13500, kategori: "Satış",              aciklama: "Günlük satış",         tarih: tarih(14), odemeYontemi: "nakit"  },
  { id: "i14", tip: "gider", tutar: 7800,  kategori: "Tedarik / Hammadde", aciklama: "Tedarik ödemesi",      tarih: tarih(15), odemeYontemi: "kart"   },
  { id: "i15", tip: "gider", tutar: 1800,  kategori: "Pazarlama",          aciklama: "Sosyal medya reklamı", tarih: tarih(16), odemeYontemi: "kart"   },
  { id: "i16", tip: "gelir", tutar: 10200, kategori: "Satış",              aciklama: "Hafta sonu satışları", tarih: tarih(17), odemeYontemi: "nakit"  },
  { id: "i17", tip: "gider", tutar: 2600,  kategori: "Personel",           aciklama: "Personel avansı",      tarih: tarih(18), odemeYontemi: "nakit"  },
  // 3 hafta önce
  { id: "i18", tip: "gelir", tutar: 10800, kategori: "Satış",              aciklama: "Günlük satış",         tarih: tarih(21), odemeYontemi: "nakit"  },
  { id: "i19", tip: "gider", tutar: 9100,  kategori: "Tedarik / Hammadde", aciklama: "Aylık tedarik",        tarih: tarih(22), odemeYontemi: "havale" },
  { id: "i20", tip: "gider", tutar: 950,   kategori: "Bakım & Onarım",     aciklama: "Buzdolabı tamiri",     tarih: tarih(23), odemeYontemi: "nakit"  },
  { id: "i21", tip: "gelir", tutar: 9400,  kategori: "Satış",              aciklama: "Hafta sonu satışları", tarih: tarih(24), odemeYontemi: "nakit"  },
  { id: "i22", tip: "gider", tutar: 1600,  kategori: "Faturalar",          aciklama: "Su & doğalgaz",        tarih: tarih(25), odemeYontemi: "havale" },
  // 4 hafta önce
  { id: "i23", tip: "gelir", tutar: 14200, kategori: "Satış",              aciklama: "Yoğun gün",            tarih: tarih(28), odemeYontemi: "nakit"  },
  { id: "i24", tip: "gider", tutar: 15000, kategori: "Kira",               aciklama: "Aylık kira",           tarih: tarih(29), odemeYontemi: "havale" },
  { id: "i25", tip: "gider", tutar: 8400,  kategori: "Tedarik / Hammadde", aciklama: "Stok alımı",           tarih: tarih(30), odemeYontemi: "kart"   },
  { id: "i26", tip: "gelir", tutar: 11600, kategori: "Satış",              aciklama: "Haftalık satış",       tarih: tarih(31), odemeYontemi: "nakit"  },
  { id: "i27", tip: "gider", tutar: 22000, kategori: "Personel",           aciklama: "Aylık maaş ödemesi",   tarih: tarih(32), odemeYontemi: "havale" },
  { id: "i28", tip: "gider", tutar: 2100,  kategori: "Vergi & SGK",        aciklama: "SGK primi",            tarih: tarih(33), odemeYontemi: "havale" },
];

export interface OzetSatir { etiket: string; gelir: number; gider: number; net: number }

// Günlük: son 24 saat, saatlik gruplar
export function saatlikOzet(): OzetSatir[] {
  const simdi = new Date();
  return Array.from({ length: 24 }, (_, i) => {
    const saat = new Date(simdi);
    saat.setHours(simdi.getHours() - 23 + i, 0, 0, 0);
    const saatSonu = new Date(saat);
    saatSonu.setMinutes(59, 59, 999);

    const islemler = MOCK_ISLEMLER.filter((x) => {
      const t = new Date(x.tarih);
      return t >= saat && t <= saatSonu;
    });
    const gelir = islemler.filter((x) => x.tip === "gelir").reduce((s, x) => s + x.tutar, 0);
    const gider = islemler.filter((x) => x.tip === "gider").reduce((s, x) => s + x.tutar, 0);
    return { etiket: `${String(saat.getHours()).padStart(2, "0")}:00`, gelir, gider, net: gelir - gider };
  });
}

// Haftalık: son 7 gün, günlük gruplar
export function haftalikOzet(): OzetSatir[] {
  return Array.from({ length: 7 }, (_, i) => {
    const gun = new Date();
    gun.setDate(gun.getDate() - 6 + i);
    gun.setHours(0, 0, 0, 0);
    const gunSonu = new Date(gun);
    gunSonu.setHours(23, 59, 59, 999);

    const islemler = MOCK_ISLEMLER.filter((x) => {
      const t = new Date(x.tarih);
      return t >= gun && t <= gunSonu;
    });
    const gelir = islemler.filter((x) => x.tip === "gelir").reduce((s, x) => s + x.tutar, 0);
    const gider = islemler.filter((x) => x.tip === "gider").reduce((s, x) => s + x.tutar, 0);
    return {
      etiket: gun.toLocaleDateString("tr-TR", { weekday: "short", day: "numeric" }),
      gelir,
      gider,
      net: gelir - gider,
    };
  });
}

// Aylık: son 30 gün, günlük gruplar
export function aylikOzet(): OzetSatir[] {
  return Array.from({ length: 30 }, (_, i) => {
    const gun = new Date();
    gun.setDate(gun.getDate() - 29 + i);
    gun.setHours(0, 0, 0, 0);
    const gunSonu = new Date(gun);
    gunSonu.setHours(23, 59, 59, 999);

    const islemler = MOCK_ISLEMLER.filter((x) => {
      const t = new Date(x.tarih);
      return t >= gun && t <= gunSonu;
    });
    const gelir = islemler.filter((x) => x.tip === "gelir").reduce((s, x) => s + x.tutar, 0);
    const gider = islemler.filter((x) => x.tip === "gider").reduce((s, x) => s + x.tutar, 0);
    return {
      etiket: gun.toLocaleDateString("tr-TR", { day: "numeric", month: "short" }),
      gelir,
      gider,
      net: gelir - gider,
    };
  });
}

// Özel tarih aralığı: günlük gruplar
export function ozelAralikOzet(baslangic: string, bitis: string): OzetSatir[] {
  const bas = new Date(baslangic); bas.setHours(0, 0, 0, 0);
  const bit = new Date(bitis);     bit.setHours(23, 59, 59, 999);
  const gunSayisi = Math.round((bit.getTime() - bas.getTime()) / 86400000) + 1;

  return Array.from({ length: gunSayisi }, (_, i) => {
    const gun = new Date(bas); gun.setDate(bas.getDate() + i);
    const gunSonu = new Date(gun); gunSonu.setHours(23, 59, 59, 999);
    const islemler = MOCK_ISLEMLER.filter((x) => {
      const t = new Date(x.tarih); return t >= gun && t <= gunSonu;
    });
    const gelir = islemler.filter((x) => x.tip === "gelir").reduce((s, x) => s + x.tutar, 0);
    const gider = islemler.filter((x) => x.tip === "gider").reduce((s, x) => s + x.tutar, 0);
    return {
      etiket: gun.toLocaleDateString("tr-TR", { day: "numeric", month: "short" }),
      gelir, gider, net: gelir - gider,
    };
  });
}

// Kategori dağılımı
export function kategoriDagilimi(tip: IslemTipi) {
  const map: Record<string, number> = {};
  MOCK_ISLEMLER.filter((i) => i.tip === tip).forEach((i) => {
    map[i.kategori] = (map[i.kategori] || 0) + i.tutar;
  });
  return Object.entries(map)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function formatTL(n: number) {
  return "₺" + n.toLocaleString("tr-TR");
}
