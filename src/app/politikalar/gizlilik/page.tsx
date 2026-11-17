import type { Metadata } from "next";
import GizlilikBelge from "@/components/yasal/belge/GizlilikBelge";

export const metadata: Metadata = { title: "Gizlilik Politikası – PilotSensin" };

export default function GizlilikPage() {
  return <GizlilikBelge />;
}
