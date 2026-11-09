"use client";

// Profile (#62): who's signed in, past redemptions, and sign-out. Matches canvas screen 9,
// without its Deal alerts toggle (push is a stretch goal).
import { useEffect, useState } from "react";
import { campusClock, getMyProfile, getMyRedemptions, signOut, type MyProfile, type Redemption } from "@/lib/supabase";
import { redemptionWhenLabel } from "./format";

type Loaded = { profile: MyProfile | null; redemptions: Redemption[]; now: number };

function initials(text: string): string {
  const words = text.split(/[\s@._-]+/).filter(Boolean);
  return ((words[0]?.[0] ?? "") + (words[1]?.[0] ?? "")).toUpperCase() || "?";
}

export function Profile() {
  const [data, setData] = useState<Loaded | undefined>(undefined); // undefined = loading
  const [failed, setFailed] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutFailed, setSignOutFailed] = useState(false);

  async function leave() {
    setSigningOut(true);
    setSignOutFailed(false);
    try {
      await signOut();
      // A full reload on purpose: no cached screen state survives, and the proxy sees no session.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/sign-in");
    } catch {
      setSignOutFailed(true);
      setSigningOut(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    Promise.all([getMyProfile(), getMyRedemptions()])
      .then(([profile, redemptions]) => !cancelled && setData({ profile, redemptions, now: Date.now() }))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, []);

  if (failed) return <p className="py-10 text-center text-ink-muted">Couldn&apos;t load your profile. Check your connection and try again.</p>;
  if (!data) return <p className="py-10 text-center text-ink-muted">Loading your profile…</p>;

  const { profile, redemptions, now } = data;
  const month = campusClock(new Date(now)).date.slice(0, 7);
  const thisMonth = redemptions.filter((r) => r.redeemed_on.startsWith(month)).length;
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

      <section aria-labelledby="past-h" className="flex flex-col gap-2.5">
        <div className="flex items-baseline justify-between">
          <h2 id="past-h" className="font-sans text-xs font-extrabold tracking-widest text-ink-muted">PAST REDEMPTIONS</h2>
          {thisMonth > 0 && <span className="text-sm font-bold text-green-dark">{thisMonth} this month</span>}
        </div>
        {redemptions.length === 0 ? (
          <p className="rounded-card bg-surface px-4 py-6 text-center text-sm text-ink-muted">
            No redemptions yet. Find a deal on the Deals tab.
          </p>
        ) : (
          <ul className="divide-y divide-border-soft rounded-card bg-surface px-4 py-1">
            {redemptions.map((r) => (
              <li key={r.id} className="flex items-center gap-3 py-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-peach font-heading text-sm font-extrabold text-brown">
                  {initials(r.business_name)}
                </span>
                <span className="flex min-w-0 grow flex-col gap-0.5">
                  <span className="truncate font-extrabold">{r.deal_title}</span>
                  <span className="truncate text-sm text-ink-muted">{r.business_name}</span>
                </span>
                <span className="whitespace-nowrap text-right text-xs font-bold text-ink-muted">
                  {redemptionWhenLabel(r.redeemed_at, now)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <button onClick={leave} disabled={signingOut}
        className="flex h-13 items-center justify-center gap-2 rounded-button border-2 border-border-strong bg-surface font-extrabold text-destructive disabled:opacity-50">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" />
        </svg>
        {signingOut ? "Signing out…" : "Sign out"}
      </button>
      {signOutFailed && <p role="alert" className="-mt-2 text-center text-sm font-semibold text-brown">Couldn&apos;t sign out. Try again.</p>}
    </div>
  );
}
