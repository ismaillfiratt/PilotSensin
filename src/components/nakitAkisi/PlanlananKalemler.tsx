"use client";

import { useState, useMemo } from "react";
import { Trash2, Check, Calendar, RepeatIcon, Zap, X, Receipt } from "lucide-react";
import { useNakitAkis } from "@/store/nakitAkis";
import { useKdvHavuzu, netKdvBakiye } from "@/store/kdvHavuzu";
import { formatTL } from "@/lib/para";
import PlanlananKalemModal from "@/components/nakit/PlanlananKalemModal";

function vadeBadge(tarih: string) {
  const gun = Math.ceil((new Date(tarih).getTime() - Date.now()) / 86400000);
  if (gun < 0)   return { label: `${Math.abs(gun)} gün geçti`, color: "#C97676" };
  if (gun === 0) return { label: "Bugün",            color: "var(--leaf)"   };
  if (gun <= 3)  return { label: `${gun} gün kaldı`, color: "#F59E0B"       };
  if (gun <= 7)  return { label: `${gun} gün kaldı`, color: "var(--leaf)"   };
  return               { label: `${gun} gün kaldı`, color: "var(--text-secondary)" };
}

export default function PlanlananKalemler() {
  const { kalemler, tekrarlayanlar, sil, tamamla, tekrarlayanSil, ekle } = useNakitAkis();
  const { kayitlar: havuzKayitlari } = useKdvHavuzu();

  const [modalAcik,          setModalAcik]          = useState(false);
  const [gosterTamamlandi,   setGosterTamamlandi]   = useState(false);

  const netKdv = useMemo(() => netKdvBakiye(havuzKayitlari), [havuzKayitlari]);

  const gorunenKalemler = useMemo(() =>
    [...kalemler]
      .filter((k) => gosterTamamlandi || !k.tamamlandi)
      .sort((a, b) => a.vadeTarihi.localeCompare(b.vadeTarihi)),
    [kalemler, gosterTamamlandi]
  );

  const kdvOtomatikEkle = () => {
    if (netKdv <= 0) return;
    const simdi    = new Date();
    const ayBasi   = new Date(simdi.getFullYear(), simdi.getMonth(), 28);
    const vadeTarihi = ayBasi < simdi
      ? new Date(simdi.getFullYear(), simdi.getMonth() + 1, 28).toISOString().split("T")[0]
      : ayBasi.toISOString().split("T")[0];

    ekle({
      tip:        "gider",
      kategori:   "Vergi & SGK",
      tutarKurus: netKdv,
      vadeTarihi,
      tamamlandi: false,
      aciklama:   `Net KDV Borcu — ${new Date(vadeTarihi).toLocaleDateString("tr-TR")}`,
      kaynak:     "kdv_otomatik",
    });
  };

  return (
    <div className="space-y-4">

      {/* Başlık + aksiyon */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-sm font-semibold">Planlanan kalemler</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setGosterTamamlandi((v) => !v)}
            className="text-xs px-2.5 py-1.5 rounded-lg border transition-colors"
            style={{
              borderColor: gosterTamamlandi ? "var(--forest)" : "rgba(0,0,0,0.10)",
              color:       gosterTamamlandi ? "var(--forest)" : "var(--text-secondary)",
            }}
          >
            Tamamlananlar
          </button>
          <button
            onClick={() => setModalAcik(true)}
            className="text-xs font-medium px-3 py-1.5 rounded-lg text-white transition-colors hover:opacity-90"
            style={{ background: "var(--forest)" }}
          >
            + Kalem Ekle
          </button>
        </div>
      </div>

      {/* KDV Otomasyonu */}
      {netKdv > 0 && (
        <div className="p-4 rounded-xl border border-black/8 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 shrink-0" style={{ color: "var(--leaf)" }} />
            <div>
              <p className="text-sm font-medium">KDV borcu otomasyonu</p>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                Bu ay ödenecek net KDV: <span className="font-number font-medium">{formatTL(netKdv)}</span>
              </p>
            </div>
          </div>
          <button
            onClick={kdvOtomatikEkle}
            className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors hover:bg-[#F3F4F6]"
            style={{ border: "1px solid rgba(0,0,0,0.10)", color: "var(--forest)" }}
          >
            <Zap className="w-3 h-3" />
            Ayın 28'ine Ekle
          </button>
        </div>
      )}

      {/* Tekrarlayan kalemler */}
      {tekrarlayanlar.length > 0 && (
        <div className="rounded-xl border border-black/8 overflow-hidden">
          <div className="px-4 py-2.5 flex items-center gap-2 border-b border-black/5">
            <RepeatIcon className="w-3.5 h-3.5" style={{ color: "var(--leaf)" }} />
            <span className="label-caps">Tekrarlayan</span>
          </div>
          <div className="divide-y divide-black/5">
            {tekrarlayanlar.map((t) => (
              <div key={t.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[#F3F4F6] transition-colors">
                <div className={`w-2 h-2 rounded-full shrink-0 ${t.aktif ? "bg-emerald-500" : "bg-gray-400"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{t.ad}</p>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    Her ayın {t.odemeGunu}. günü · {t.kategori}
                  </p>
                </div>
                <span className={`font-number text-sm font-medium ${t.tip === "gelir" ? "text-emerald-600" : "text-[#C97676]"}`}>
                  {t.tip === "gelir" ? "+" : "−"}{formatTL(t.tutarKurus)}
                </span>
                <button
                  onClick={() => tekrarlayanSil(t.id)}
                  className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-[#C97676] hover:bg-[#C97676]/10 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Planlanan kalemler listesi */}
      {gorunenKalemler.length === 0 ? (
        <div className="rounded-xl border border-black/8 py-10 text-center space-y-2">
          <Calendar className="w-8 h-8 mx-auto text-gray-400" />
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Henüz planlanan kalem yok</p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Gelecekteki ödemeleri ekleyerek nakit akışını öngör
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-black/8 overflow-hidden">
          <div className="hidden md:grid md:grid-cols-[1fr_100px_100px_80px_100px_40px] gap-3 px-4 py-2.5 border-b border-black/5">
            {["Kalem", "Kategori", "Vade", "Durum", "Tutar", ""].map((h) => (
              <span key={h} className="label-caps">{h}</span>
            ))}
          </div>
          <div className="divide-y divide-black/5">
            {gorunenKalemler.map((k) => {
              const vb = vadeBadge(k.vadeTarihi);
              return (
                <div
                  key={k.id}
                  className={`grid grid-cols-[1fr_auto] md:grid-cols-[1fr_100px_100px_80px_100px_40px] gap-3 px-4 py-3 items-center hover:bg-[#F3F4F6] transition-colors ${k.tamamlandi ? "opacity-50" : ""}`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${k.tip === "gelir" ? "bg-emerald-500" : "bg-[#C97676]"}`} />
                      <p className="text-sm font-medium truncate">{k.aciklama || k.kategori}</p>
                      {k.kaynak !== "manuel" && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: "var(--mint)", color: "var(--forest)" }}>
                          Otomatik
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{k.kategori}</span>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {new Date(k.vadeTarihi).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}
                  </span>
                  <span className="text-[10px] font-medium" style={{ color: vb.color }}>{vb.label}</span>
                  <p className={`font-number text-sm font-medium text-right ${k.tip === "gelir" ? "text-emerald-600" : "text-[#C97676]"}`}>
                    {k.tip === "gelir" ? "+" : "−"}{formatTL(k.tutarKurus)}
                  </p>
                  <div className="flex items-center gap-1 justify-end">
                    {!k.tamamlandi && (
                      <button
                        onClick={() => tamamla(k.id)}
                        title="Tamamlandı"
                        className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => sil(k.id)}
                      className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-[#C97676] hover:bg-[#C97676]/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <PlanlananKalemModal acik={modalAcik} kapat={() => setModalAcik(false)} />
    </div>
  );
}
