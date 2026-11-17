"use client";

import { Sun, Moon, Monitor, CheckCircle2 } from "lucide-react";
import { useTema, type Tema } from "@/store/tema";

const TEMALAR: { key: Tema; label: string; icon: typeof Moon; desc: string }[] = [
  { key: "dark",   label: "Koyu",   icon: Moon,    desc: "Lacivert kokpit teması" },
  { key: "light",  label: "Açık",   icon: Sun,     desc: "Beyaz, aydınlık arayüz" },
  { key: "system", label: "Sistem", icon: Monitor, desc: "Cihaz ayarına göre otomatik" },
];

export default function TemaAyarlari() {
  const { tema, setTema } = useTema();

  return (
    <div className="card rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-lg bg-[rgba(148,163,184,0.1)] border border-[rgba(148,163,184,0.2)] flex items-center justify-center">
          {tema === "light"
            ? <Sun className="w-4 h-4 text-[var(--leaf)]" />
            : tema === "system"
            ? <Monitor className="w-4 h-4 text-gray-400" />
            : <Moon className="w-4 h-4 text-gray-400" />
          }
        </div>
        <div>
          <h2 className="text-sm font-semibold text-gray-800">Tema</h2>
          <p className="text-xs text-gray-400">Arayüz görünümünü seç</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {TEMALAR.map(({ key, label, icon: Icon, desc }) => {
          const aktif = tema === key;
          const disabled = key === "dark";
          return (
            <div key={key} className="flex flex-col gap-1">
              <button
                onClick={() => !disabled && setTema(key)}
                disabled={disabled}
                className="relative flex flex-col items-center gap-2.5 p-4 rounded-xl border transition-all disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  borderColor:     aktif ? "var(--leaf)" : "rgba(255,255,255,0.08)",
                  backgroundColor: aktif ? "var(--mint)" : "rgba(255,255,255,0.03)",
                }}
              >
                {/* Aktif işareti */}
                {aktif && (
                  <CheckCircle2
                    className="absolute top-2 right-2 w-4 h-4 text-[var(--leaf)]"
                  />
                )}

                {/* İkon */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    backgroundColor: aktif ? "var(--mint)" : "rgba(255,255,255,0.06)",
                  }}
                >
                  <Icon
                    className="w-5 h-5"
                    style={{ color: aktif ? "var(--leaf)" : "#94a3b8" }}
                  />
                </div>

                <span
                  className="text-xs font-semibold"
                  style={{ color: aktif ? "var(--leaf)" : "#94a3b8" }}
                >
                  {label}
                </span>
                <span className="text-[10px] text-center leading-tight text-gray-400">
                  {desc}
                </span>
              </button>

              {disabled && (
                <p className="text-[10px] text-center text-gray-400">
                  Yakında
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Aktif tema gösterimi */}
      <p className="text-[11px] text-gray-400 mt-4 text-center">
        Şu an:{" "}
        <span className="text-[var(--leaf)] font-semibold">
          {TEMALAR.find((t) => t.key === tema)?.label} tema
        </span>{" "}
        aktif — Değişiklikler anında uygulanır
      </p>
    </div>
  );
}
