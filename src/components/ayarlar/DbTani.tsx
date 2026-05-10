"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function DbTani() {
  const [sonuc, setSonuc] = useState("");
  const [yukleniyor, setYuk] = useState(false);
  const [acik, setAcik] = useState(false);

  const test = async () => {
    setYuk(true);
    const satirlar: string[] = [];

    try {
      const sb = createClient();

      const { data: sessionData, error: sErr } = await sb.auth.getSession();
      if (sErr) {
        satirlar.push(`OTURUM HATASI: ${sErr.message}`);
      } else if (!sessionData.session) {
        satirlar.push("OTURUM YOK — çıkış yapıp tekrar giriş deneyin");
      } else {
        const uid = sessionData.session.user.id;
        satirlar.push(`OTURUM: OK — ${sessionData.session.user.email}`);
        satirlar.push(`USER ID: ${uid}`);

        const { data: r, error: rErr } = await sb
          .from("user_store")
          .select("user_id")
          .maybeSingle();
        if (rErr) satirlar.push(`OKUMA HATASI: ${rErr.message} [${rErr.code}]`);
        else satirlar.push(`OKUMA: OK — kayıt ${r ? "VAR" : "YOK (henüz hiç kaydetmedin)"}`);

        const { error: wErr } = await sb
          .from("user_store")
          .upsert({ user_id: uid, nakit_islemler: [] }, { onConflict: "user_id" });
        if (wErr) satirlar.push(`YAZMA HATASI: ${wErr.message} [${wErr.code}]`);
        else satirlar.push("YAZMA: OK — user_store güncellendi");
      }
    } catch (e: unknown) {
      satirlar.push(`BEKLENMEDIK HATA: ${e}`);
    }

    setSonuc(satirlar.join("\n"));
    setYuk(false);
  };

  return (
    <div className="glass-card rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-white">Veritabanı Bağlantı Testi</h3>
          <p className="text-xs text-[#94a3b8] mt-0.5">Supabase bağlantısını ve yazma iznini kontrol eder</p>
        </div>
        <button
          onClick={() => setAcik(!acik)}
          className="text-xs text-[#fbc024] hover:underline"
        >
          {acik ? "Gizle" : "Göster"}
        </button>
      </div>

      {acik && (
        <>
          <button
            onClick={test}
            disabled={yukleniyor}
            className="w-full py-2 rounded-xl bg-[#fbc024] text-[#0e172a] text-sm font-bold disabled:opacity-60"
          >
            {yukleniyor ? "Test yapılıyor..." : "Bağlantıyı Test Et"}
          </button>

          {sonuc && (
            <pre className="text-xs bg-[rgba(0,0,0,0.3)] rounded-xl p-4 text-[#e2e8f0] whitespace-pre-wrap leading-6">
              {sonuc}
            </pre>
          )}
        </>
      )}
    </div>
  );
}
