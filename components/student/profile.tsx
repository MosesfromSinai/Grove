"use client";

// Profile (#62): who's signed in, past redemptions, and sign-out. Matches canvas screen 9,
// without its Deal alerts toggle (push is a stretch goal).
import { useEffect, useState } from "react";
import { getMyProfile, getMyRedemptions, type MyProfile, type Redemption } from "@/lib/supabase";

type Loaded = { profile: MyProfile | null; redemptions: Redemption[] };

function initials(text: string): string {
  const words = text.split(/[\s@._-]+/).filter(Boolean);
  return ((words[0]?.[0] ?? "") + (words[1]?.[0] ?? "")).toUpperCase() || "?";
}

export function Profile() {
  const [data, setData] = useState<Loaded | undefined>(undefined); // undefined = loading
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getMyProfile(), getMyRedemptions()])
      .then(([profile, redemptions]) => !cancelled && setData({ profile, redemptions }))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, []);

  if (failed) return <p className="py-10 text-center text-ink-muted">Couldn&apos;t load your profile. Check your connection and try again.</p>;
  if (!data) return <p className="py-10 text-center text-ink-muted">Loading your profile…</p>;

  const { profile } = data;
  const name = profile?.full_name?.trim() || profile?.email || "Student";

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center gap-3.5">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-peach-deep font-heading text-xl font-extrabold">
          {initials(name)}
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-2xl leading-none">{name}</h1>
          {profile && (
            <p className="truncate text-sm text-ink-muted">
              {[profile.campus_name, profile.email].filter(Boolean).join(" · ")}
            </p>
          )}
          {profile?.verified_student && (
            <span className="flex items-center gap-1 self-start rounded-pill bg-green-tint px-2.5 py-0.5 text-xs font-extrabold text-green-dark">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m5 12.5 4.5 4.5L19 7.5" />
              </svg>
              Verified student
            </span>
          )}
        </div>
      </header>
    </div>
  );
}
