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

const tipConfig: Record<Tip, { renk: string; bg: string; border: string; icon: typeof AlertTriangle }> = {
  kritik: { renk: "#EF4444", bg: "#FEF2F2", border: "#FECACA", icon: AlertTriangle },
  uyari:  { renk: "#F59E0B", bg: "#FFFBEB", border: "#FDE68A", icon: AlertTriangle },
  bilgi:  { renk: "#3B82F6", bg: "#EFF6FF", border: "#BFDBFE", icon: Info          },
};

export default function BugunYapilacaklar() {
  const { islemler }                          = useNakit();
  const { gorevler }                          = useGorevler();
  const { urunler }                           = useStok();
  const { hedefler, islemler: fonIslemler }   = useAcilFon();
  const { checklist }                         = useProsedurler();

  const [gunSayaci, setGunSayaci] = useState(0);
  useGunDegisimi(() => setGunSayaci((n) => n + 1));

  const gorevListesi = useMemo((): Gorev[] => {
    const liste: Gorev[] = [];
    const bugun    = new Date();
    const gunBasi  = trGunBaslangici();
    const gunSonu_ = trGunSonu();

    gorevler
      .filter((g) => g.durum !== "tamamlandi" && new Date(g.sonTarih) < gunBasi)
      .slice(0, 3)
      .forEach((g) => liste.push({ id: `gorev-${g.id}`, mesaj: `"${g.baslik}" görevi gecikti`, tip: "kritik", href: "/gorevler" }));

    gorevler
      .filter((g) => g.durum !== "tamamlandi" && g.oncelik === "acil" && new Date(g.sonTarih) >= gunBasi && new Date(g.sonTarih) <= gunSonu_)
      .slice(0, 2)
      .forEach((g) => liste.push({ id: `acil-${g.id}`, mesaj: `"${g.baslik}" bugün bitiyor — acil`, tip: "kritik", href: "/gorevler" }));

    urunler
      .filter((u) => stokDurumu(u) === "kritik")
      .slice(0, 3)
      .forEach((u) => liste.push({ id: `stok-${u.id}`, mesaj: `${u.ad} kritik stokta (${u.mevcutAdet} ${u.birim}) — sipariş ver`, tip: "kritik", href: "/stok" }));

    if (islemler.length > 0) {
      const gelir = islemler.filter((i) => i.tip === "gelir").reduce((s, i) => s + i.tutarKurus, 0);
      const gider = islemler.filter((i) => i.tip === "gider").reduce((s, i) => s + i.tutarKurus, 0);
      if (gelir - gider < 0)
        liste.push({ id: "nakit-negatif", mesaj: "Nakit akışı negatif — giderleri incele", tip: "uyari", href: "/nakit-akisi" });
    }

    if (hedefler.length === 0 && fonIslemler.length === 0) {
      liste.push({ id: "acil-fon-bos", mesaj: "Acil durum fonu henüz oluşturulmadı — hedef ekle", tip: "bilgi", href: "/acil-fon" });
    } else {
      const trBugünGun = gunBasi.getDate();
      hedefler.forEach((hedef) => {
        if (trBugünGun !== hedef.odemeGunu) return;
        const buAyOdendi = fonIslemler
          .filter((i) => i.hedefId === hedef.id && i.tip === "yatirma")
          .filter((i) => { const t = new Date(i.tarih); return t.getMonth() === bugun.getMonth() && t.getFullYear() === bugun.getFullYear(); })
          .reduce((s, i) => s + i.tutarKurus, 0);
        const kalan = hedef.aylikOdemeKurus - buAyOdendi;
        if (kalan > 0)
          liste.push({ id: `acil-fon-odeme-${hedef.id}`, mesaj: `"${hedef.ad}" için bugün aylık ₺${(kalan / 100).toLocaleString("tr-TR")} ödeme günü`, tip: "uyari", href: "/acil-fon" });
      });
      hedefler.forEach((hedef) => {
        if (trBugünGun === hedef.odemeGunu) return;
        const hMevcut = mevcutBirikim(fonIslemler, hedef.id);
        const oran = hedef.toplamHedefKurus > 0 ? hMevcut / hedef.toplamHedefKurus : 0;
        if (oran < 0.25 && hedef.toplamHedefKurus > 0)
          liste.push({ id: `acil-fon-dusuk-${hedef.id}`, mesaj: `"${hedef.ad}" hedefi çok düşük (%${Math.round(oran * 100)}) — fon yatırmayı düşün`, tip: "bilgi", href: "/acil-fon" });
      });
    }

    const bekleyen = checklist.filter((c) => !c.otomatikKontrol && isDue(c));
    const kritikBekleyen = bekleyen.filter((c) => c.kritiklik === "kritik" || c.kritiklik === "yuksek");
    if (kritikBekleyen.length > 0)
      liste.push({ id: "checklist-kritik", mesaj: `${kritikBekleyen.length} kritik kontrol maddesi bekliyor — prosedürleri incele`, tip: "uyari", href: "/prosedurler" });
    else if (bekleyen.length > 0)
      liste.push({ id: "checklist-bekleyen", mesaj: `${bekleyen.length} kontrol maddesi yapılmayı bekliyor`, tip: "bilgi", href: "/prosedurler" });

    return liste;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gorevler, urunler, islemler, fonIslemler, hedefler, checklist, gunSayaci]);

  const mobilGoster = gorevListesi.slice(0, 3);
  const kalan       = gorevListesi.length - 3;

  return (
    <div className="card p-4 md:p-5 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-3 md:mb-4">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: "rgba(250,250,250,0.06)" }}>
          <Zap className="w-4 h-4" style={{ color: "var(--text-primary)" }} />
        </div>
        <h2 className="text-xs md:text-sm font-semibold text-gray-700">Bugün Ne Yapmalısın?</h2>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        <AnimatePresence>
          {gorevListesi.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-6 gap-2">
              <CheckCircle2 className="w-8 h-8 md:w-10 md:h-10 text-gray-300" />
              <p className="text-sm text-gray-700 font-medium">Her şey yolunda!</p>
              <p className="text-xs text-gray-400 text-center">Bugün için bekleyen önemli bir görev yok.</p>
            </motion.div>
          ) : (
            <>
              {mobilGoster.map((item, i) => {
                const cfg  = tipConfig[item.tip];
                const Icon = cfg.icon;
                return (
                  <motion.div key={item.id}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }} transition={{ delay: i * 0.05 }}>
                    <Link href={item.href}
                      className="flex items-start gap-2.5 p-3 rounded-xl border transition-all active:scale-[0.99]"
                      style={{ borderColor: cfg.border, backgroundColor: cfg.bg }}>
                      <Icon className="w-4 h-4 mt-0.5 shrink-0" style={{ color: cfg.renk }} />
                      <span className="text-xs leading-relaxed" style={{ color: cfg.renk }}>{item.mesaj}</span>
                    </Link>
                  </motion.div>
                );
              })}

              {kalan > 0 && (
                <div className="md:hidden">
                  <Link href="/gorevler" className="block text-center text-xs py-2 font-medium"
                    style={{ color: "var(--text-secondary)" }}>
                    +{kalan} daha →
                  </Link>
                </div>
              )}

              {gorevListesi.slice(3).map((item, i) => {
                const cfg  = tipConfig[item.tip];
                const Icon = cfg.icon;
                return (
                  <motion.div key={item.id} className="hidden md:block"
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }} transition={{ delay: (i + 3) * 0.05 }}>
                    <Link href={item.href}
                      className="flex items-start gap-2.5 p-3 rounded-xl border transition-all hover:shadow-sm active:scale-[0.99]"
                      style={{ borderColor: cfg.border, backgroundColor: cfg.bg }}>
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
        <p className="hidden md:block text-[10px] text-gray-300 mt-3 text-center">
          Görevler tamamlandıkça otomatik olarak silinir
        </p>
      )}
    </div>
  );
}
