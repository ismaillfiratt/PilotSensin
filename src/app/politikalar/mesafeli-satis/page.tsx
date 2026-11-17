import type { Metadata } from "next";
import MesafeliSatisBelge from "@/components/yasal/belge/MesafeliSatisBelge";

export const metadata: Metadata = { title: "Mesafeli Satış Sözleşmesi – PilotSensin" };

export default function MesafeliSatisPage() {
  return <MesafeliSatisBelge />;
}
