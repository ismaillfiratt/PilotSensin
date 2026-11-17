import { Suspense } from "react";
import AyarlarContent from "./AyarlarContent";

export default function AyarlarPage() {
  return (
    <Suspense>
      <AyarlarContent />
    </Suspense>
  );
}
