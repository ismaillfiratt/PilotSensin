"use client";

import { Suspense }          from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ChevronRight }      from "lucide-react";
import { useCerez }          from "@/store/cerez";
import { YASAL_BELGELER, YASAL_BELGE_BILESENLERI, type YasalSlug } from "@/lib/yasal-registry";

const KART_STIL = { border: "0.5px solid rgba(0,0,0,0.08)" };

function BelgeYukleniyor() {
  return (
    <div className="p-8 space-y-4 animate-pulse">
      <div className="h-6 bg-gray-100 rounded w-1/2" />
      <div className="h-4 bg-gray-100 rounded w-1/3" />
      <div className="h-32 bg-gray-100 rounded" />
      <div className="space-y-2">
        {[1,2,3].map(i => <div key={i} className="h-4 bg-gray-100 rounded" />)}
      </div>
    </div>
  );
}

export default function YasalPanel() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const { bannerAc } = useCerez();

  const rawSlug   = searchParams.get("belge") ?? "kvkk";
  const aktifSlug = (YASAL_BELGE_BILESENLERI[rawSlug as YasalSlug]
    ? rawSlug
    : "kvkk") as YasalSlug;

  const aktifBelge = YASAL_BELGELER.find(b => b.slug === aktifSlug) ?? YASAL_BELGELER[0];
  const Bilesen    = YASAL_BELGE_BILESENLERI[aktifSlug];

  const belgeGit = (slug: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("belge", slug);
    router.replace(`/ayarlar?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="space-y-4">

      {/* Panel başlık */}
      <div>
        <p className="label-caps">YASAL</p>
        <h2 className="text-xl font-medium text-gray-900 mt-1">KVKK & Sözleşmeler</h2>
        <p className="text-sm text-gray-500 mt-1">
          Gizlilik politikası, KVKK metni ve tüm yasal belgeler
        </p>
      </div>

      {/* ── Master-detail grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 items-start">

        {/* Sol — belge listesi */}
        <div className="lg:sticky lg:top-24 bg-white rounded-xl overflow-hidden" style={KART_STIL}>
          {YASAL_BELGELER.map((belge, i) => {
            const aktif = aktifSlug === belge.slug;
            const Icon  = belge.icon;
            return (
              <button
                key={belge.slug}
                onClick={() => belgeGit(belge.slug)}
                className="w-full flex items-center gap-3 px-3 py-3 text-left transition-colors"
                style={{
                  borderTop:       i > 0 ? "0.5px solid rgba(0,0,0,0.06)" : undefined,
                  backgroundColor: aktif ? "rgba(15,61,46,0.06)"            : "transparent",
                  borderLeft:      aktif ? "2px solid var(--forest)"        : "2px solid transparent",
                }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: "var(--bg-elevated, rgba(0,0,0,0.04))" }}
                >
                  <Icon className="w-3.5 h-3.5" style={{ color: "var(--text-tertiary, rgba(0,0,0,0.45))" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm truncate"
                    style={{
                      fontWeight: aktif ? 500 : 400,
                      color:      aktif ? "var(--forest)" : "#374151",
                    }}
                  >
                    {belge.baslik}
                  </p>
                  <p className="text-[10px] text-gray-400 truncate">{belge.aciklama}</p>
                </div>
                {aktif && <ChevronRight className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--forest)" }} />}
              </button>
            );
          })}
        </div>

        {/* Sağ — belge içeriği */}
        <div
          className="bg-white rounded-xl overflow-y-auto"
          style={{ ...KART_STIL, maxHeight: "70vh" }}
        >
          {/* Breadcrumb */}
          <div
            className="sticky top-0 bg-white z-10 px-4 py-2.5 flex items-center gap-1.5 text-xs text-gray-400"
            style={{ borderBottom: "0.5px solid rgba(0,0,0,0.06)" }}
          >
            <span>KVKK & Sözleşmeler</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-600 font-medium">{aktifBelge.baslik}</span>
          </div>
          <div className="p-4">
            <Suspense fallback={<BelgeYukleniyor />}>
              <Bilesen />
            </Suspense>
          </div>
        </div>
      </div>

      {/* ── Çerez tercihleri ── */}
      <div
        className="bg-white rounded-xl p-4 flex items-center justify-between gap-4"
        style={KART_STIL}
      >
        <div>
          <p className="text-sm font-medium text-gray-800">Çerez Tercihleri</p>
          <p className="text-xs text-gray-400 mt-0.5">Hangi çerezlerin kullanılacağını seç</p>
        </div>
        <button
          onClick={bannerAc}
          className="shrink-0 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
          style={{ background: "#fff", border: "0.5px solid rgba(0,0,0,0.15)" }}
        >
          Tercihleri yönet
        </button>
      </div>

    </div>
  );
}
