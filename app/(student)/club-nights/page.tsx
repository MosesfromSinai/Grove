"use client";

// Client page: lib/supabase wrappers are browser-only, like the deal page.
import { Suspense } from "react";
import { ClubNights } from "@/components/student/club-nights";

export default function ClubNightsPage() {
  return (
    <Suspense fallback={<p className="py-10 text-center text-ink-muted">Loading club nights…</p>}>
      <ClubNights />
    </Suspense>
  );
}
