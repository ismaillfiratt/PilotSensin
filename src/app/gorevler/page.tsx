"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { MOCK_GOREVLER, type Gorev } from "@/lib/gorev-data";
import GorevOzet from "@/components/gorevler/GorevOzet";
import KanbanBoard from "@/components/gorevler/KanbanBoard";

export default function GorevlerPage() {
  const [gorevler, setGorevler] = useState<Gorev[]>(MOCK_GOREVLER);
  const params     = useSearchParams();
  const modalParam = params.get("modal");

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Görevler</h1>
          <p className="text-sm text-[#94a3b8] mt-1">
            Ekip görevlerini takip et, önceliklendirme yap
          </p>
        </div>
      </div>

      <GorevOzet gorevler={gorevler} />

      <div>
        <h2 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-widest mb-4">
          Kanban Tablosu
        </h2>
        <KanbanBoard
          gorevler={gorevler}
          setGorevler={setGorevler}
          otomatikAcilModal={modalParam === "ekle"}
        />
      </div>
    </div>
  );
}
