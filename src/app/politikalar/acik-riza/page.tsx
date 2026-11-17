import type { Metadata } from "next";
import AcikRizaBelge from "@/components/yasal/belge/AcikRizaBelge";

export const metadata: Metadata = { title: "Açık Rıza Metni – PilotSensin" };

export default function AcikRizaPage() {
  return <AcikRizaBelge />;
}
