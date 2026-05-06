import { Suspense } from "react";
import GorevlerContent from "./GorevlerContent";

export default function GorevlerPage() {
  return (
    <Suspense>
      <GorevlerContent />
    </Suspense>
  );
}
