"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertTriangle, Info, Zap } from "lucide-react";
import { useNakit }       from "@/store/nakit";
import { useGorevler }    from "@/store/gorevler";
import { useStok }        from "@/store/stok";
import { useAcilFon }     from "@/store/acilFon";
import { useProsedurler } from "@/store/prosedurler";
import { stokDurumu }     from "@/lib/stok-data";
import { mevcutBirikim }  from "@/lib/acil-fon-data";
import { isDue }          from "@/lib/prosedur-data";
import { trGunBaslangici, trGunSonu, useGunDegisimi } from "@/lib/tarih";

type Tip = "kritik" | "uyari" | "bilgi";
interface Gorev { id: string; mesaj: string; tip: Tip; href: string; }

const tipConfig: Record<Tip, { renk: string; bg: string; icon: typeof AlertTriangle }> = {
  kritik: { renk: "#ef4444", bg: "rgba(239,68,68,0.1)",   icon: AlertTriangle },
  uyari:  { renk: "#fbc024", bg: "rgba(251,192,36,0.1)",  icon: AlertTriangle },
  bilgi:  { renk: "#3b82f6", bg: "rgba(59,130,246,0.1)",  icon: Info          },
};

export default function BugunYapilacaklar() {
  const { islemler }                 = useNakit();
  const { gorevler }                 = useGorevler();
  const { urunler }                  = useStok();
  const { hedefler, islemler: fonIslemler } = useAcilFon();
  const { checklist }                = useProsedurler();

  // Gece yarısı TR'de geçince bileşeni yenile (günlük görevler güncellenir)
  const [gunSayaci, setGunSayaci] = useState(0);
  useGunDegisimi(() => setGunSayaci((n) => n + 1));

  const gorevListesi = useMemo((): Gorev[] => {
    const liste: Gorev[] = [];
    const bugun    = new Date();
    const gunBasi  = trGunBaslangici(); // TR gece yarısı 00:00+03:00
    const gunSonu_ = trGunSonu();       // TR gece yarısı 23:59:59+03:00

    // ── Gecikmiş görevler — TR takvim gününe göre ───────────────────────
    gorevler
      .filter(g => g.durum !== "tamamlandi" && new Date(g.sonTarih) < gunBasi)
      .slice(0, 3)
      .forEach(g => liste.push({ id: `gorev-${g.id}`, mesaj: `"${g.baslik}" görevi gecikti`, tip: "kritik", href: "/gorevler" }));

    // ── Bugün biten acil görevler — TR gün sınırları ────────────────────
    gorevler
      .filter(g => g.durum !== "tamamlandi" && g.oncelik === "acil" && new Date(g.sonTarih) >= gunBasi && new Date(g.sonTarih) <= gunSonu_)
      .slice(0, 2)
      .forEach(g => liste.push({ id: `acil-${g.id}`, mesaj: `"${g.baslik}" bugün bitiyor — acil`, tip: "kritik", href: "/gorevler" }));

    // ── Kritik stok ──────────────────────────────────────────────────────
    urunler
      .filter(u => stokDurumu(u) === "kritik")
      .slice(0, 3)
      .forEach(u => liste.push({ id: `stok-${u.id}`, mesaj: `${u.ad} kritik stokta (${u.mevcutAdet} ${u.birim}) — sipariş ver`, tip: "kritik", href: "/stok" }));

    // ── Negatif nakit akışı ──────────────────────────────────────────────
    if (islemler.length > 0) {
      const gelir = islemler.filter(i => i.tip === "gelir").reduce((s, i) => s + i.tutarKurus, 0);
      const gider = islemler.filter(i => i.tip === "gider").reduce((s, i) => s + i.tutarKurus, 0);
      if (gelir - gider < 0)
        liste.push({ id: "nakit-negatif", mesaj: "Nakit akışı negatif — giderleri incele", tip: "uyari", href: "/nakit-akisi" });
    }

    // ── Acil durum fonu — SADECE ödeme günüyse hatırlat ────────────────
    if (hedefler.length === 0 && fonIslemler.length === 0) {
      liste.push({ id: "acil-fon-bos", mesaj: "Acil durum fonu henüz oluşturulmadı — hedef ekle", tip: "bilgi", href: "/acil-fon" });
    } else {
      const trBugünGun = gunBasi.getDate(); // Istanbul gün numarası
      hedefler.forEach(hedef => {
        // Bugün bu hedefin ödeme günü mü? — TR takvim günü ile karşılaştır
        if (trBugünGun !== hedef.odemeGunu) return;

        // Bu ay bu hedef için ne kadar yatırıldı?
        const buAyOdendi = fonIslemler
          .filter(i => i.hedefId === hedef.id && i.tip === "yatirma")
          .filter(i => {
            const t = new Date(i.tarih);
            return t.getMonth() === bugun.getMonth() && t.getFullYear() === bugun.getFullYear();
          })
          .reduce((s, i) => s + i.tutarKurus, 0);

        const kalan = hedef.aylikOdemeKurus - buAyOdendi;
        if (kalan > 0) {
          liste.push({
            id:    `acil-fon-odeme-${hedef.id}`,
            mesaj: `"${hedef.ad}" için bugün aylık ₺${(kalan / 100).toLocaleString("tr-TR")} ödeme günü`,
            tip:   "uyari",
            href:  "/acil-fon",
          });
        }
      });

      // Hedef var ama %50'nin altında ve ödeme günü değilse bilgi ver
      hedefler.forEach(hedef => {
        if (trBugünGun === hedef.odemeGunu) return; // zaten yukarıda işlendi
        const hMevcut = mevcutBirikim(fonIslemler, hedef.id);
        const oran = hedef.toplamHedefKurus > 0 ? hMevcut / hedef.toplamHedefKurus : 0;
        if (oran < 0.25 && hedef.toplamHedefKurus > 0) {
          liste.push({
            id:    `acil-fon-dusuk-${hedef.id}`,
            mesaj: `"${hedef.ad}" hedefi çok düşük (%${Math.round(oran * 100)}) — fon yatırmayı düşün`,
            tip:   "bilgi",
            href:  "/acil-fon",
          });
        }
      });
    }

    // ── Kontrol listesi — frekans tabanlı, otomatik hariç ──────────────────
    const bekleyen = checklist.filter(c => !c.otomatikKontrol && isDue(c));
    const kritikBekleyen = bekleyen.filter(c => c.kritiklik === "kritik" || c.kritiklik === "yuksek");

    if (kritikBekleyen.length > 0) {
      liste.push({
        id:    "checklist-kritik",
        mesaj: `${kritikBekleyen.length} kritik kontrol maddesi bekliyor — prosedürleri incele`,
        tip:   "uyari",
        href:  "/prosedurler",
      });
    } else if (bekleyen.length > 0) {
      liste.push({
        id:    "checklist-bekleyen",
        mesaj: `${bekleyen.length} kontrol maddesi yapılmayı bekliyor`,
        tip:   "bilgi",
        href:  "/prosedurler",
      });
    }

    return liste;
  }, [gorevler, urunler, islemler, fonIslemler, hedefler, checklist, gunSayaci]);

  const mobilGoster   = gorevListesi.slice(0, 3);
  const kalan         = gorevListesi.length - 3;

  return (
    <div className="glass-card rounded-2xl p-4 md:p-5 flex flex-col h-full">
      <div className="flex items-center justify-between gap-2 mb-3 md:mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[rgba(251,192,36,0.15)] flex items-center justify-center">
            <Zap className="w-4 h-4 text-[#fbc024]" />
          </div>
          <h2 className="text-xs md:text-sm font-semibold text-white">Bugün Ne Yapmalısın?</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        <AnimatePresence>
          {gorevListesi.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-6 gap-2">
              <CheckCircle2 className="w-8 h-8 md:w-10 md:h-10 text-[#22c55e]" />
              <p className="text-sm text-white font-medium">Her şey yolunda!</p>
              <p className="text-xs text-[#64748b] text-center">Bugün için bekleyen önemli bir görev yok.</p>
            </motion.div>
          ) : (
            <>
              {/* Mobile: ilk 3 öge */}
              {mobilGoster.map((item, i) => {
                const cfg  = tipConfig[item.tip];
                const Icon = cfg.icon;
                return (
                  <motion.div key={item.id}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }} transition={{ delay: i * 0.05 }}>
                    <Link href={item.href}
                      className="flex items-start gap-2.5 p-3 rounded-xl border transition-all active:scale-[0.99]"
                      style={{ borderColor: `${cfg.renk}30`, backgroundColor: cfg.bg }}>
                      <Icon className="w-4 h-4 mt-0.5 shrink-0" style={{ color: cfg.renk }} />
                      <span className="text-xs leading-relaxed" style={{ color: cfg.renk }}>{item.mesaj}</span>
                    </Link>
                  </motion.div>
                );
              })}

              {/* Mobile'da kalan öge sayısı / Desktop'ta gizli ögeler */}
              {kalan > 0 && (
                <div className="md:hidden">
                  <Link href="/gorevler" className="block text-center text-xs text-[#fbc024] py-2">
                    +{kalan} daha →
                  </Link>
                </div>
              )}
              {gorevListesi.slice(3).map((item, i) => {
                const cfg  = tipConfig[item.tip];
                const Icon = cfg.icon;
                return (
                  <motion.div key={item.id}
                    className="hidden md:block"
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }} transition={{ delay: (i + 3) * 0.05 }}>
                    <Link href={item.href}
                      className="flex items-start gap-2.5 p-3 rounded-xl border transition-all hover:scale-[1.01] active:scale-[0.99]"
                      style={{ borderColor: `${cfg.renk}30`, backgroundColor: cfg.bg }}>
                      <Icon className="w-4 h-4 mt-0.5 shrink-0" style={{ color: cfg.renk }} />
                      <span className="text-xs leading-relaxed" style={{ color: cfg.renk }}>{item.mesaj}</span>
                    </Link>
                  </motion.div>
                );
              })}
            </>
          )}
        </AnimatePresence>
      </div>

      {gorevListesi.length > 0 && (
        <p className="hidden md:block text-[10px] text-[#64748b] mt-3 text-center">Görevler tamamlandıkça otomatik olarak silinir</p>
      )}
    </div>
  );
}
