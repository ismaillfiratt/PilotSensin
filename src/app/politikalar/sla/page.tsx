import type { Metadata } from "next";
import SLABelge from "@/components/yasal/belge/SLABelge";

export const metadata: Metadata = { title: "Hizmet Seviyesi Sözleşmesi (SLA) – PilotSensin" };

export default function SLAPage() {
  return <SLABelge />;
}
