import { Suspense } from "react";
import StokContent from "./StokContent";

export default function StokPage() {
  return (
    <Suspense>
      <StokContent />
    </Suspense>
  );
}
