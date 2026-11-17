"use client";

import { useState, useMemo } from "react";
import { Trash2, Check, Calendar, RepeatIcon, Zap, X, Receipt, RotateCcw } from "lucide-react";
import { useNakitAkis } from "@/store/nakitAkis";
import { useKdvHavuzu } from "@/store/kdvHavuzu";
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

function tarihStr(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

const TEKRAR_ETIKET: Record<string, string> = {
  gunluk: "Her gün", haftalik: "Her hafta", aylik: "Her ay", "2ayda1": "2 ayda bir", "3ayda1": "3 ayda bir",
};

export default function PlanlananKalemler() {
  const { kalemler, tekrarlayanlar, sil, tamamla, tamamlaGeriAl, tekrarlayanSil, ekle } = useNakitAkis();
  const kdvKayitlar = useKdvHavuzu(s => s.kayitlar);
  const isaretle    = useKdvHavuzu(s => s.isaretle);

  const [modalAcik,        setModalAcik]        = useState(false);
  const [gosterTamamlandi, setGosterTamamlandi] = useState(false);
  const [aralikAcik,       setAralikAcik]       = useState(false);
  const [aralikBas,        setAralikBas]        = useState("");
  const [aralikBit,        setAralikBit]        = useState("");

  // Reaktif: kayitlar değişince yeniden hesaplanır
  const bekleyenKdvKayitlari = useMemo(
    () => kdvKayitlar.filter(k => !k.silindi && k.tip === "cikis" && !k.eklendigiKalemId),
    [kdvKayitlar]
  );
  const bekleyenKdv = useMemo(
    () => bekleyenKdvKayitlari.reduce((t, k) => t + k.toplamKdvKurus, 0),
    [bekleyenKdvKayitlari]
  );
  const herseyCikisKaydedildi = useMemo(
    () => kdvKayitlar.some((k) => k.tip === "cikis" && !k.silindi),
    [kdvKayitlar]
  );

  const aralikAktif = !!(aralikBas || aralikBit);

  const gorunenKalemler = useMemo(() => {
    let liste = [...kalemler]
      .filter((k) => gosterTamamlandi || !k.tamamlandi)
      .sort((a, b) => a.vadeTarihi.localeCompare(b.vadeTarihi));

    if (aralikBas) liste = liste.filter((k) => k.vadeTarihi >= aralikBas);
    if (aralikBit) liste = liste.filter((k) => k.vadeTarihi <= aralikBit);
    return liste;
  }, [kalemler, gosterTamamlandi, aralikBas, aralikBit]);

  const aralikTemizle = () => { setAralikBas(""); setAralikBit(""); setAralikAcik(false); };

  const tamamlananlar = useMemo(
    () => kalemler.filter((k) => k.tamamlandi),
    [kalemler]
  );

  const kdvOtomatikEkle = async () => {
    if (bekleyenKdv <= 0 || bekleyenKdvKayitlari.length === 0) return;

    const simdi      = new Date();
    const hedef28    = new Date(simdi.getFullYear(), simdi.getMonth(), 28);
    const vadeTarihi = hedef28 <= simdi
      ? new Date(simdi.getFullYear(), simdi.getMonth() + 1, 28).toISOString().split("T")[0]
      : hedef28.toISOString().split("T")[0];

    const kalemId     = crypto.randomUUID();
    const bekleyenIds = bekleyenKdvKayitlari.map((k) => k.id);

    try {
      await ekle({
        id:          kalemId,
        tip:         "gider",
        kategori:    "Vergi & SGK",
        tutarKurus:  bekleyenKdv,
        vadeTarihi,
        tamamlandi:  false,
        aciklama:    `KDV ödemesi (${bekleyenKdvKayitlari.length} satış) — ${new Date(vadeTarihi).toLocaleDateString("tr-TR")}`,
        kaynak:      "kdv_otomatik",
      });
      await isaretle(bekleyenIds, kalemId);
    } catch (e) {
      console.error("KDV otomasyon hatası:", e);
    }
  };

  return (
    <div className="space-y-4">

      {/* Başlık + aksiyon */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-sm font-semibold">Planlanan kalemler</h2>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Tarih aralığı toggle */}
          <button
            onClick={() => { setAralikAcik((v) => !v); if (aralikAcik) aralikTemizle(); }}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-colors"
            style={{
              borderColor: aralikAktif || aralikAcik ? "var(--forest)" : "rgba(0,0,0,0.10)",
              color:       aralikAktif || aralikAcik ? "var(--forest)" : "var(--text-secondary)",
              background:  aralikAktif ? "rgba(15,61,46,0.06)" : "transparent",
            }}
          >
            <Calendar className="w-3.5 h-3.5" />
            {aralikAktif
              ? `${aralikBas ? tarihStr(aralikBas) : "…"} — ${aralikBit ? tarihStr(aralikBit) : "…"}`
              : "Tarih aralığı"}
            {aralikAktif && (
              <X className="w-3 h-3 ml-0.5" onClick={(e) => { e.stopPropagation(); aralikTemizle(); }} />
            )}
          </button>
          <button
            onClick={() => setGosterTamamlandi((v) => !v)}
            className="text-xs px-2.5 py-1.5 rounded-lg border transition-colors"
            style={{
              borderColor: gosterTamamlandi ? "var(--forest)" : "rgba(0,0,0,0.10)",
              color:       gosterTamamlandi ? "var(--forest)" : "var(--text-secondary)",
            }}
          >
            Tamamlananlar {tamamlananlar.length > 0 && `(${tamamlananlar.length})`}
          </button>
          <button
            onClick={() => setModalAcik(true)}
            className="text-xs font-medium px-3 py-1.5 rounded-lg text-white hover:opacity-90 transition-colors"
            style={{ background: "var(--forest)" }}
          >
            + Kalem Ekle
          </button>
        </div>
      </div>

      {/* Tarih aralığı picker */}
      {aralikAcik && (
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-xl border border-black/8 bg-gray-50">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Başlangıç</label>
            <input
              type="date"
              value={aralikBas}
              max={aralikBit || undefined}
              onChange={(e) => setAralikBas(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-black/10 text-xs bg-white focus:outline-none"
            />
          </div>
          <span className="text-gray-400">—</span>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Bitiş</label>
            <input
              type="date"
              value={aralikBit}
              min={aralikBas || undefined}
              onChange={(e) => setAralikBit(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-black/10 text-xs bg-white focus:outline-none"
            />
          </div>
          {/* Hızlı seçenekler */}
          <div className="flex gap-1.5 ml-auto flex-wrap">
            {[
              { label: "Bu hafta", fn: () => { const d = new Date(); const gun = d.getDay() === 0 ? 6 : d.getDay() - 1; const bas = new Date(d); bas.setDate(d.getDate() - gun); const bit = new Date(bas); bit.setDate(bas.getDate() + 6); setAralikBas(bas.toISOString().split("T")[0]); setAralikBit(bit.toISOString().split("T")[0]); } },
              { label: "Bu ay",   fn: () => { const d = new Date(); const bas = new Date(d.getFullYear(), d.getMonth(), 1); const bit = new Date(d.getFullYear(), d.getMonth() + 1, 0); setAralikBas(bas.toISOString().split("T")[0]); setAralikBit(bit.toISOString().split("T")[0]); } },
              { label: "30 gün",  fn: () => { const d = new Date(); const bit = new Date(d); bit.setDate(d.getDate() + 30); setAralikBas(d.toISOString().split("T")[0]); setAralikBit(bit.toISOString().split("T")[0]); } },
            ].map(({ label, fn }) => (
              <button key={label} onClick={fn}
                className="text-[11px] font-medium px-2 py-1 rounded-lg border border-black/10 hover:bg-white transition-colors"
                style={{ color: "var(--forest)" }}>
                {label}
              </button>
            ))}
            {aralikAktif && (
              <button onClick={aralikTemizle}
                className="text-[11px] font-medium px-2 py-1 rounded-lg border border-black/10 hover:bg-white transition-colors text-gray-500">
                Temizle
              </button>
            )}
          </div>
        </div>
      )}

      {/* KDV Otomasyonu */}
      {bekleyenKdv > 0 ? (
        <div className="p-4 rounded-xl border border-black/8 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 shrink-0" style={{ color: "var(--leaf)" }} />
            <div>
              <p className="text-sm font-medium">KDV otomasyonu</p>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                <span className="font-number font-medium text-[#0F172A]">{formatTL(bekleyenKdv)}</span>
                {" bekliyor · "}
                {bekleyenKdvKayitlari.length} satış
              </p>
            </div>
          </div>
          <button onClick={kdvOtomatikEkle}
            className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 hover:bg-[#F3F4F6] transition-colors border border-black/10"
            style={{ color: "var(--forest)" }}>
            <Zap className="w-3 h-3" />Ayın 28'ine Ekle
          </button>
        </div>
      ) : bekleyenKdvKayitlari.length === 0 && herseyCikisKaydedildi ? (
        <div className="p-3.5 rounded-xl border border-black/8 flex items-center gap-2.5">
          <Receipt className="w-4 h-4 shrink-0 text-emerald-500" />
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            Tüm KDV kayıtları zaten planlandı
          </p>
        </div>
      ) : null}

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
                    {TEKRAR_ETIKET[t.tekrarPeriyot ?? "aylik"]}
                    {(t.tekrarPeriyot ?? "aylik") === "haftalik"
                      ? ` · ${["Paz","Pzt","Sal","Çar","Per","Cum","Cmt"][t.odemeGunu] ?? t.odemeGunu}. gün`
                      : (t.tekrarPeriyot ?? "aylik") !== "gunluk"
                      ? ` · her periyodun ${t.odemeGunu}. günü`
                      : ""} · {t.kategori}
                  </p>
                </div>
                <span className={`font-number text-sm font-medium ${t.tip === "gelir" ? "text-emerald-600" : "text-[#C97676]"}`}>
                  {t.tip === "gelir" ? "+" : "−"}{formatTL(t.tutarKurus)}
                </span>
                <button onClick={() => tekrarlayanSil(t.id)}
                  className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-[#C97676] hover:bg-[#C97676]/10 transition-colors">
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
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {aralikAktif ? "Seçilen tarih aralığında planlanan kalem yok" : "Henüz planlanan kalem yok"}
          </p>
          {aralikAktif && (
            <button onClick={aralikTemizle} className="text-xs" style={{ color: "var(--leaf)" }}>
              Filtreyi kaldır
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-black/8 overflow-hidden">
          <div className="hidden md:grid md:grid-cols-[1fr_100px_100px_80px_100px_56px] gap-3 px-4 py-2.5 border-b border-black/5">
            {["Kalem", "Kategori", "Planlanan Tarih", "Durum", "Tutar", ""].map((h) => (
              <span key={h} className="label-caps">{h}</span>
            ))}
          </div>
          <div className="divide-y divide-black/5">
            {gorunenKalemler.map((k) => {
              const vb = vadeBadge(k.vadeTarihi);
              return (
                <div key={k.id}
                  className={`grid grid-cols-[1fr_auto] md:grid-cols-[1fr_100px_100px_80px_100px_56px] gap-3 px-4 py-3 items-center hover:bg-[#F3F4F6] transition-colors ${k.tamamlandi ? "opacity-50" : ""}`}>
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
                    {tarihStr(k.vadeTarihi)}
                  </span>
                  <span className="text-[10px] font-medium" style={{ color: vb.color }}>{vb.label}</span>
                  <p className={`font-number text-sm font-medium text-right ${k.tip === "gelir" ? "text-emerald-600" : "text-[#C97676]"}`}>
                    {k.tip === "gelir" ? "+" : "−"}{formatTL(k.tutarKurus)}
                  </p>
                  <div className="flex items-center gap-1 justify-end">
                    {/* Tamamlandıysa: geri al butonu */}
                    {k.tamamlandi ? (
                      <button onClick={() => tamamlaGeriAl(k.id)} title="Tamamlanmadı olarak işaretle"
                        className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors">
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button onClick={() => tamamla(k.id)} title="Tamamlandı"
                        className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button onClick={() => sil(k.id)}
                      className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-[#C97676] hover:bg-[#C97676]/10 transition-colors">
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
