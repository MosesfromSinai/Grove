import { Suspense } from "react";
import { BottomNav } from "@/components/student/bottom-nav";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-student text-ink">
      <main className="flex-1 px-4 pt-4 pb-24">{children}</main>
      <Suspense fallback={null}>
        <BottomNav />
      </Suspense>
    </div>
  );
}