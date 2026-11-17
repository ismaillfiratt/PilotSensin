import { useNakit }       from "@/store/nakit";
import { useStok }        from "@/store/stok";
import { useGorevler }    from "@/store/gorevler";
import { useProsedurler } from "@/store/prosedurler";
import { stokDurumu }     from "@/lib/stok-data";
import { senkronizeEt }   from "@/lib/uyari-motoru";
import { debounce }       from "@/lib/utils";
import type { OtomatikKontrol } from "@/lib/prosedur-data";
import type { Islem }     from "@/lib/nakit-data";
import type { Urun }      from "@/lib/stok-data";
import type { Gorev }     from "@/lib/gorev-data";

interface KontrolBaglami {
  nakitIslemleri: Islem[];
  stokUrunleri:   Urun[];
  gorevler:       Gorev[];
}

// ── Koşul fonksiyonları (true = kontrol geçti = tamamlandi) ──────────────────
const KONTROL_KURALLARI: Record<OtomatikKontrol, (baglam: KontrolBaglami) => boolean> = {
  nakit_negatif: (baglam) => {
    const bakiye = baglam.nakitIslemleri
      .filter((i) => !i.silindi)
      .reduce((s, i) => s + (i.tip === "gelir" ? i.tutarKurus : -i.tutarKurus), 0);
    return bakiye >= 0;
  },

  kritik_stok: (baglam) => {
    return baglam.stokUrunleri.filter(
      (u) => !u.silindi && stokDurumu(u) === "kritik"
    ).length === 0;
  },

  gecik_gorev: (baglam) => {
    const simdi = new Date();
    return baglam.gorevler.filter(
      (g) => !g.silindi && g.durum !== "tamamlandi" && g.sonTarih && new Date(g.sonTarih) < simdi
    ).length === 0;
  },
};

function otoKontrolBaglami(): KontrolBaglami {
  return {
    nakitIslemleri: useNakit.getState().islemler,
    stokUrunleri:   useStok.getState().urunler,
    gorevler:       useGorevler.getState().gorevler,
  };
}

export async function otoKontroleriCalistir(rol: "pilot" | "copilot"): Promise<void> {
  const { checklist, checklistToggle } = useProsedurler.getState();
  const baglam = otoKontrolBaglami();

  const otomatikler = checklist.filter(
    (item) => !item.silindi && item.otomatikKontrol
  );

  for (const item of otomatikler) {
    const kural = KONTROL_KURALLARI[item.otomatikKontrol!];
    if (!kural) continue;

    const istenen = kural(baglam);
    if (istenen !== item.tamamlandi) {
      await checklistToggle(item.id);
    }
  }

  // Oto kontrol bitti — uyarı motorunu da güncelle
  senkronizeEt(rol);
}

export const debouncedOtoKontrol = debounce(otoKontroleriCalistir, 500);
