import { useStok }             from "@/store/stok";
import { useGorevler }         from "@/store/gorevler";
import { useNakit }            from "@/store/nakit";
import { useSatislar }         from "@/store/satislar";
import { useIsletmeGiderleri } from "@/store/isletmeGiderleri";
import { useAcilFon }          from "@/store/acilFon";
import { useProsedurler }      from "@/store/prosedurler";
import { useBildirimler }      from "@/store/bildirimler";
import { useKdvHavuzu }        from "@/store/kdvHavuzu";
import { useSirket }           from "@/store/sirket";
import { useBildirimAyarlari } from "@/store/bildirimAyarlari";
import { useNakitAkis }        from "@/store/nakitAkis";
import { useBorclar }          from "@/store/borclar";

// Tema anahtarı korunur — kullanıcıdan bağımsız tarayıcı tercihi
const KORUNAN_KEYLER = new Set([
  "pilotsensin-tema-v2",
  "pilot-last-user-id",   // bu helper'ın kendi anahtarı
]);

const TEMIZLENECEK_KEYLER = [
  "pilot-stok-v1",
  "pilot-gorevler-v1",
  "pilot-nakit-v1",
  "pilot-satislar-v1",
  "pilot-giderler-v1",
  "pilot-acil-fon-v2",
  "pilot-prosedurler",
  "pilot-bildirimler-v1",
  "pilot-kdv-havuzu-v1",
  "pilot-borclar-v1",
  "pilot-nakit-akis-v1",
  "pilot-nakit-ayarlar-v1",
  "pilot-stok-ayarlar-v1",
  "pilot-urun-marj-v1",
  "pilot-urun-maliyet-v4",
  "pilot-bildirim-ayarlari-v1",
  "pilotsensin-uyari-snooze-v1",
  "pilot-arama-recent",
  "pilot-uyari-durumlari-v1",
  "pilot-modul-aksiyonlari-v1",
  "pilot-uyari-manuel-kapali-v1",
  "pilot-borc-ayarlar-v1",
];

/** Tüm kullanıcı verilerini bellekten ve localStorage'dan temizler. Tema korunur. */
export function storesSifirla(): void {
  // ── In-memory sıfırlama (partial merge — replace: false) ────────────────
  useStok.setState({ urunler: [] });
  useGorevler.setState({ gorevler: [] });
  useNakit.setState({ islemler: [] });
  useSatislar.setState({ kayitlar: [] });
  useIsletmeGiderleri.setState({ giderler: [] });
  useAcilFon.setState({ hedefler: [], islemler: [], aktifHedefId: null });
  useProsedurler.setState({ prosedurler: [], checklist: [], silinenSablonMaddeleri: [], silinenSopSablonMaddeleri: [] });
  useBildirimler.setState({ bildirimler: [] });
  useKdvHavuzu.setState({ kayitlar: [] });
  useBorclar.setState({ borclar: [] });
  useNakitAkis.setState({ kalemler: [], tekrarlayanlar: [] });
  useSirket.setState({ companyId: null, rol: null, rolAdi: "", sirketAdi: "" });
  useBildirimAyarlari.setState({
    modul: { stok: true, "nakit-akisi": true, "kar-zarar": true, gorevler: true,
             prosedurler: true, "acil-fon": true, sistem: true, ekip: true },
    tip:   { kritik: true, uyari: true, bilgi: true, basari: true },
    ses: true, push: false,
    sessizSaat: { aktif: false, baslangic: "22:00", bitis: "08:00" },
    kasaMinEsikKurus: 0,
  });

  // ── localStorage temizleme ───────────────────────────────────────────────
  if (typeof localStorage === "undefined") return;

  TEMIZLENECEK_KEYLER.forEach((k) => localStorage.removeItem(k));

  // Güvence: pilot- ile başlayan, korunan listede olmayan her şeyi de sil
  Object.keys(localStorage)
    .filter((k) => (k.startsWith("pilot-") || k.startsWith("pilotsensin-")) && !KORUNAN_KEYLER.has(k))
    .forEach((k) => localStorage.removeItem(k));
}
