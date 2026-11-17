import { Suspense } from "react";
import ProfilContent from "./ProfilContent";

export default function ProfilPage() {
  return (
    <Suspense>
      <ProfilContent />
    </Suspense>
  );
}
