import { Suspense } from "react";
import { PinForm } from "@/components/student/pin-form";

export default function PinPage() {
  return (
    <Suspense fallback={null}>
      <PinForm />
    </Suspense>
  );
}
