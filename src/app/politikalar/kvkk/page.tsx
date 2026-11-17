import type { Metadata } from "next";
import KvkkBelge from "@/components/yasal/belge/KvkkBelge";

export const metadata: Metadata = { title: "KVKK Aydınlatma Metni – PilotSensin" };

export default function KVKKPage() {
  return <KvkkBelge />;
}
