"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useStok } from "@/store/stok";
import { useGorevler } from "@/store/gorevler";
import { useNakit } from "@/store/nakit";
import { useAcilFon } from "@/store/acilFon";
import { stokDurumu } from "@/lib/stok-data";
import { trGunBaslangici } from "@/lib/tarih";

interface Uyari {
  id: string;
  baslik: string;
  detay: string;
  href: string;
  seviye: "kritik" | "uyari";
}

export default function IlgiGerekliSection() {
  const { urunler }           = useStok();
  const { gorevler }          = useGorevler();
  const { islemler }          = useNakit();
  const { hedefler, mevcut }  = useAcilFon();

  const uyarilar = useMemo<Uyari[]>(() => {
    const list: Uyari[] = [];

    const kritikUrunler = urunler.filter((u) => !u.silindi && stokDurumu(u) === "kritik");
    if (kritikUrunler.length > 0) {
      list.push({
        id: "stok-kritik",
        baslik: `${kritikUrunler.length} ürün kritik seviyede`,
        detay: kritikUrunler.slice(0, 3).map((u) => u.ad).join(", ") + (kritikUrunler.length > 3 ? "…" : ""),
        href: "/stok",
        seviye: "kritik",
      });
    }

    const gunBasi = trGunBaslangici();
    const gecikGorevler = gorevler.filter(
      (g) => !g.silindi && g.durum !== "tamamlandi" && new Date(g.sonTarih) < gunBasi
    );
    if (gecikGorevler.length > 0) {
      list.push({
        id: "gorev-gecikti",
        baslik: `${gecikGorevler.length} görev gecikti`,
        detay: gecikGorevler.slice(0, 2).map((g) => g.baslik).join(", ") + (gecikGorevler.length > 2 ? "…" : ""),
        href: "/gorevler",
        seviye: "uyari",
      });
    }

    const aktif = islemler.filter((x) => !x.silindi);
    const net   = aktif.reduce((s, x) => s + (x.tip === "gelir" ? x.tutarKurus : -x.tutarKurus), 0);
    if (net < 0) {
      list.push({
        id: "nakit-negatif",
        baslik: "Kasa bakiyesi negatife döndü",
        detay: "Gelir-gider dengesini kontrol et",
        href: "/nakit-akisi",
        seviye: "kritik",
      });
    }

    const aktifHedefler = hedefler.filter((h) => !h.silindi);
    for (const h of aktifHedefler) {
      const birikim = mevcut(h.id);
      const yuzde   = h.toplamHedefKurus > 0 ? (birikim / h.toplamHedefKurus) * 100 : 100;
      if (yuzde < 50) {
        list.push({
          id: `acil-fon-${h.id}`,
          baslik: `Acil fon yetersiz: ${h.ad}`,
          detay: `Hedefin %${Math.round(yuzde)}'i tamamlandı`,
          href: "/acil-fon",
          seviye: "uyari",
        });
        break;
      }
    }

    return list;
  }, [urunler, gorevler, islemler, hedefler, mevcut]);

  return (
    <section className="py-4 space-y-3">
      <div className="flex justify-between items-center">
        <h2 className="text-sm font-semibold">İlgi gerekli</h2>
        <Link
          href="/bildirimler"
          className="text-xs font-medium transition-colors hover:opacity-75"
          style={{ color: "var(--leaf)" }}
        >
          Tüm uyarılar →
        </Link>
      </div>

      {uyarilar.length === 0 ? (
        <p className="text-sm py-4" style={{ color: "var(--text-secondary)" }}>
          ✓ Sistemler temiz. Hiçbir uyarı yok.
        </p>
      ) : (
        <div className="space-y-1">
          {uyarilar.map((u) => (
            <div key={u.id} className="flex items-center gap-3 py-2">
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: u.seviye === "kritik" ? "var(--color-danger)" : "var(--color-warning)" }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{u.baslik}</p>
                <p className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>{u.detay}</p>
              </div>
              <Link
                href={u.href}
                className="text-xs font-medium whitespace-nowrap transition-colors hover:opacity-75"
                style={{ color: "var(--leaf)" }}
              >
                Şimdi düzelt →
              </Link>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
