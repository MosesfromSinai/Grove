import { Suspense } from "react";
import { Scanner } from "@/components/student/scanner";

export default function ScanPage() {
  return (
    <Suspense fallback={null}>
      <Scanner />
    </Suspense>
  );
}