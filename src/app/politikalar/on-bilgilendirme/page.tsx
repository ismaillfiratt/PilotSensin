import type { Metadata } from "next";
import OnBilgilendirmeBelge from "@/components/yasal/belge/OnBilgilendirmeBelge";

export const metadata: Metadata = { title: "Ön Bilgilendirme Formu – PilotSensin" };

export default function OnBilgilendirmePage() {
  return <OnBilgilendirmeBelge />;
}
