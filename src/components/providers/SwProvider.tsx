"use client";

import { useEffect } from "react";

export default function SwProvider() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch(() => null);
    }
  }, []);

  return null;
}
