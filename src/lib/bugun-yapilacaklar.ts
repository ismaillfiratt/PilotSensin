import { useGorevler }   from "@/store/gorevler";
import { useProsedurler } from "@/store/prosedurler";
import { isDue }          from "@/lib/prosedur-data";
import { ONCELIK_CONFIG } from "@/lib/gorev-data";
import { KRITIKLIK_RENK } from "@/lib/prosedur-data";
import type { Gorev }         from "@/lib/gorev-data";
import type { ChecklistItem } from "@/lib/prosedur-data";
import type { FonHedef, FonIslem } from "@/lib/acil-fon-data";

export interface YapilacakOge {
  id:            string;
  tip:           "gorev" | "checklist" | "odeme" | "oto-kontrol";
  baslik:        string;
  altYazi?:      string;
  tamamlandi:    boolean;
  manuelToggle:  boolean;
  oncelik:       number;
  oncelikLabel?: string;
  oncelikRenk?:  string;
  ilgiliLink?:   string;
  onToggle?:     () => void;
  ikon:          "gorev" | "checklist" | "odeme" | "oto-kontrol" | "vade";
  meta?:         Record<string, unknown>;
}

interface ToplaParams {
  gorevler:         Gorev[];
  checklist:        ChecklistItem[];
  hedefler:         FonHedef[];
  acilFonIslemler:  FonIslem[];
}

function isToday(iso: string): boolean {
  if (!iso) return false;
  const d     = new Date(iso);
  const bugun = new Date();
  return (
    d.getDate()     === bugun.getDate() &&
    d.getMonth()    === bugun.getMonth() &&
    d.getFullYear() === bugun.getFullYear()
  );
}

export function bugunYapilacaklariTopla(p: ToplaParams): YapilacakOge[] {
  const { gorevler, checklist, hedefler, acilFonIslemler } = p;
  const liste: YapilacakOge[] = [];

  // ── A. Görevler — bugün son tarihi olanlar ────────────────────────────────
  gorevler
    .filter((g) => !g.silindi && isToday(g.sonTarih))
    .forEach((g) => {
      const cfg = ONCELIK_CONFIG[g.oncelik];
      liste.push({
        id:           `gorev-${g.id}`,
        tip:          "gorev",
        baslik:       g.baslik,
        altYazi:      g.sorumlu
          ? `${g.sorumlu}${g.aciklama ? ` • ${g.aciklama}` : ""}`
          : g.aciklama,
        tamamlandi:   g.durum === "tamamlandi",
        manuelToggle: true,
        oncelik:
          g.oncelik === "acil"   ? 100 :
          g.oncelik === "yuksek" ? 80  :
          g.oncelik === "normal" ? 50  : 30,
        oncelikLabel: cfg?.label,
        oncelikRenk:  cfg?.color,
        ilgiliLink:   "/gorevler",
        onToggle:     () =>
          useGorevler.getState().durumDegis(
            g.id,
            g.durum === "tamamlandi" ? "yapilacak" : "tamamlandi"
          ),
        ikon: "gorev",
      });
    });

  // ── B. Günlük checklist — manuel, bugün yapılması gereken ─────────────────
  checklist
    .filter((c) => !c.silindi && c.sikligi === "gunluk" && !c.otomatikKontrol && isDue(c))
    .forEach((c) => {
      const renk = c.kritiklik ? KRITIKLIK_RENK[c.kritiklik] : null;
      liste.push({
        id:           `checklist-${c.id}`,
        tip:          "checklist",
        baslik:       c.baslik,
        altYazi:      c.kategori,
        tamamlandi:   c.tamamlandi,
        manuelToggle: true,
        oncelik:
          c.kritiklik === "kritik" ? 95 :
          c.kritiklik === "yuksek" ? 75 : 45,
        oncelikLabel:
          c.kritiklik === "kritik" ? "Kritik" :
          c.kritiklik === "yuksek" ? "Yüksek" : "Normal",
        oncelikRenk:  renk?.color,
        ilgiliLink:   "/prosedurler",
        onToggle:     () => useProsedurler.getState().checklistToggle(c.id),
        ikon:         "checklist",
      });
    });

  // ── C. Acil fon ödemesi — bugün ödeme günü olan hedefler ─────────────────
  const bugun    = new Date();
  const bugunGun = bugun.getDate();
  hedefler
    .filter((h) => !h.silindi && h.odemeGunu === bugunGun && h.aylikOdemeKurus > 0)
    .forEach((h) => {
      const buAyOdeme = acilFonIslemler.find(
        (i) =>
          i.hedefId === h.id &&
          i.tip     === "yatirma" &&
          !i.silindi &&
          new Date(i.tarih).getMonth()    === bugun.getMonth() &&
          new Date(i.tarih).getFullYear() === bugun.getFullYear()
      );
      liste.push({
        id:           `odeme-${h.id}`,
        tip:          "odeme",
        baslik:       `${h.ad} aylık ödemesi`,
        altYazi:      `₺${(h.aylikOdemeKurus / 100).toLocaleString("tr-TR")} • Acil Fon`,
        tamamlandi:   !!buAyOdeme,
        manuelToggle: false,
        oncelik:      85,
        oncelikLabel: "Ödeme",
        oncelikRenk:  "#F59E0B",
        ilgiliLink:   "/acil-fon",
        ikon:         "odeme",
      });
    });

  // ── D. Otomatik kontrol özeti ─────────────────────────────────────────────
  const otoKontroller  = checklist.filter((c) => !c.silindi && c.otomatikKontrol);
  const toplamSayi     = otoKontroller.length;
  const yapildiSayisi  = otoKontroller.filter((c) => c.tamamlandi).length;

  if (toplamSayi > 0) {
    liste.push({
      id:           "oto-kontrol-ozet",
      tip:          "oto-kontrol",
      baslik:       "Otomatik kontroller",
      altYazi:      `${yapildiSayisi}/${toplamSayi} kontrol başarılı — sistem otomatik takip ediyor`,
      tamamlandi:   yapildiSayisi === toplamSayi,
      manuelToggle: false,
      oncelik:      yapildiSayisi === toplamSayi ? 10 : 60,
      ilgiliLink:   "/prosedurler",
      ikon:         "oto-kontrol",
    });
  }

  // ── Sıralama: bekleyenler önce (öncelik desc), tamamlananlar sonra ────────
  return liste.sort((a, b) => {
    if (a.tamamlandi !== b.tamamlandi) return a.tamamlandi ? 1 : -1;
    return b.oncelik - a.oncelik;
  });
}
