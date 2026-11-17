"use client";

import { Sun, Moon, Monitor, CheckCircle2 } from "lucide-react";
import { useTema, type Tema } from "@/store/tema";

const TEMALAR: { key: Tema; label: string; icon: typeof Moon; desc: string }[] = [
  { key: "dark",   label: "Koyu",   icon: Moon,    desc: "Lacivert kokpit teması"        },
  { key: "light",  label: "Açık",   icon: Sun,     desc: "Beyaz, aydınlık arayüz"        },
  { key: "system", label: "Sistem", icon: Monitor, desc: "Cihaz ayarına göre otomatik"   },
];

export default function GorunumPanel() {
  const { tema, setTema } = useTema();
  const aktifLabel = TEMALAR.find((t) => t.key === tema)?.label ?? "";

  return (
    <div className="space-y-4">

      {/* Panel başlık */}
      <div>
        <p className="label-caps">TERCİHLER</p>
        <h2 className="text-xl font-medium text-gray-900 mt-1">Görünüm</h2>
        <p className="text-sm text-gray-500 mt-1">
          Arayüz teması ve renk şeması — değişiklikler anında uygulanır
        </p>
      </div>

      {/* ── Tema kartı ── */}
      <div
        className="bg-white rounded-xl p-5 space-y-4"
        style={{ border: "1px solid var(--border-color)" }}
      >
        <div>
          <p className="text-sm font-medium text-gray-800">Tema</p>
          <p className="text-xs text-gray-500 mt-0.5">Cihazına en uygun temayı seç</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {TEMALAR.map(({ key, label, icon: Icon, desc }) => {
            const aktif    = tema === key;
            const disabled = key === "dark";
            return (
              <div key={key} className="flex flex-col gap-1">
                <button
                  onClick={() => !disabled && setTema(key)}
                  disabled={disabled}
                  className="relative flex flex-col items-center gap-2.5 p-4 rounded-xl transition-all disabled:cursor-not-allowed disabled:opacity-40"
                  style={{
                    border:          aktif ? "1.5px solid var(--forest)" : "1px solid var(--border-color)",
                    backgroundColor: aktif ? "rgba(15,61,46,0.06)"       : "transparent",
                  }}
                >
                  {aktif && (
                    <CheckCircle2
                      className="absolute top-2 right-2 w-4 h-4"
                      style={{ color: "var(--forest)" }}
                    />
                  )}

                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{
                      backgroundColor: aktif ? "rgba(15,61,46,0.08)" : "var(--bg-elevated)",
                    }}
                  >
                    <Icon
                      className="w-5 h-5"
                      style={{ color: aktif ? "var(--forest)" : "#94a3b8" }}
                    />
                  </div>

                  <span
                    className="text-xs font-semibold"
                    style={{ color: aktif ? "var(--forest)" : "#94a3b8" }}
                  >
                    {label}
                  </span>
                  <span className="text-[10px] text-center leading-tight text-gray-400">
                    {desc}
                  </span>
                </button>

                {disabled && (
                  <p className="text-[10px] text-center text-gray-400">Yakında</p>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-[11px] text-gray-400 text-center">
          Şu an:{" "}
          <span className="font-semibold" style={{ color: "var(--forest)" }}>
            {aktifLabel} tema
          </span>{" "}
          aktif — Değişiklikler anında uygulanır
        </p>
      </div>

    </div>
  );
}
