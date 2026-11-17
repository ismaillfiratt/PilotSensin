import type { Metadata } from "next";
import KullanimKosullariBelge from "@/components/yasal/belge/KullanimKosullariBelge";

export const metadata: Metadata = { title: "Kullanım Koşulları – PilotSensin" };

export default function KullanimKosullariPage() {
  return <KullanimKosullariBelge />;
}
