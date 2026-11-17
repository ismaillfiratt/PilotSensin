"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CopKutusuRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/ayarlar?tab=cop-kutusu");
  }, [router]);
  return null;
}
