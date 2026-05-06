import { Suspense } from "react";
import NakitAkisiContent from "./NakitAkisiContent";

export default function NakitAkisiPage() {
  return (
    <Suspense>
      <NakitAkisiContent />
    </Suspense>
  );
}
