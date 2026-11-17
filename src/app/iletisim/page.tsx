"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function IletisimRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/ayarlar?tab=iletisim");
  }, [router]);
  return null;
}
