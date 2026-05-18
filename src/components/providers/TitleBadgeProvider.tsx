"use client";

import { useEffect } from "react";
import { useBildirimler } from "@/store/bildirimler";

const TABAN = "PilotSensin";

export default function TitleBadgeProvider() {
  const okunmamis = useBildirimler(
    (s) => s.bildirimler.filter((b) => !b.okundu).length
  );

  useEffect(() => {
    document.title = okunmamis > 0 ? `(${okunmamis}) ${TABAN}` : TABAN;
  }, [okunmamis]);

  return null;
}
