import type { Metadata } from "next";
import IadeIptalBelge from "@/components/yasal/belge/IadeIptalBelge";

export const metadata: Metadata = { title: "İade & İptal Politikası – PilotSensin" };

export default function IadeIptalPage() {
  return <IadeIptalBelge />;
}
