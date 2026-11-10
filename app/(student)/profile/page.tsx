"use client";

// Client page: lib/supabase wrappers are browser-only, like the deal page.
import { Suspense } from "react";
import { Profile } from "@/components/student/profile";

export default function ProfilePage() {
  return (
    <Suspense fallback={<p className="py-10 text-center text-ink-muted">Loading your profile…</p>}>
      <Profile />
    </Suspense>
  );
}
