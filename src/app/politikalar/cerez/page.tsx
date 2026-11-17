import type { Metadata } from "next";
import CerezBelge from "@/components/yasal/belge/CerezBelge";

export const metadata: Metadata = { title: "Çerez Politikası – PilotSensin" };

export default function CerezPage() {
  return <CerezBelge />;
}
