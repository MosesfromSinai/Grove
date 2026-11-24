"use client";

import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";

const ERROR_MESSAGES: Record<string, string> = {
  missing_code: "Sign-in failed. Please try again.",
  oauth_error: "Sign-in failed. Please try again.",
  no_user: "Sign-in failed. Please try again.",
};

export default function SignInForm() {
  const searchParams = useSearchParams();
  const errorKey = searchParams.get("error");
  const errorMessage = errorKey
    ? (ERROR_MESSAGES[errorKey] ?? "Something went wrong.")
    : null;

  async function handleSignIn() {
    const supabase = createClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${siteUrl}/auth/callback`,
        queryParams: {
          // Show school accounts first; doesn't hard-restrict to .edu
          // (business owners may sign in with non-.edu accounts).
          hd: "*",
        },
      },
    });
  }

  // Layout follows canvas screen 1: green hero with food tiles, then a cream sheet.
  return (
    <>
      <div className="relative flex-1 px-6 pt-10 pb-10">
        <span className="absolute -top-24 -left-24 size-80 rounded-full bg-green" aria-hidden="true" />
        <span className="absolute -right-24 bottom-0 size-56 rounded-full bg-green" aria-hidden="true" />
        <div className="relative h-40" aria-hidden="true">
          <span className="absolute top-2 left-2 flex size-20 -rotate-6 items-center justify-center rounded-card bg-peach shadow-card"><TacoArt /></span>
          <span className="absolute top-0 right-4 flex size-16 rotate-6 items-center justify-center rounded-card bg-green-tint shadow-card"><DrinkArt /></span>
          <span className="absolute bottom-0 left-6 -rotate-3 rounded-pill bg-orange px-4 py-2 text-sm font-extrabold text-ink shadow-card">Free drink with any meal</span>
        </div>
        <div className="relative mt-8 flex items-center gap-3">
          <span className="flex size-14 items-center justify-center rounded-full bg-surface text-green" aria-hidden="true">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14" /><path d="M5 19 13 11" /></svg>
          </span>
          <span className="font-heading text-6xl font-extrabold tracking-tight text-surface">grove</span>
        </div>
        <p className="relative mt-3 font-heading text-3xl font-extrabold text-orange-light">Where food finds its campus.</p>
      </div>

      <div className="rounded-t-card bg-bg-student px-6 pt-8 pb-10">
        {errorMessage && <p role="alert" className="text-sm text-destructive">{errorMessage}</p>}
        <button onClick={handleSignIn} className="mt-6 flex min-h-14 w-full items-center justify-center rounded-button bg-ink px-4 font-extrabold text-white">
          Sign in with your school Google account
        </button>
      </div>
    </>
  );
}

function TacoArt() {
  return (
    <svg width="44" height="44" viewBox="0 0 64 64" aria-hidden="true"><path d="M6 44a26 26 0 0 1 52 0z" fill="#F6C453" stroke="#1A2019" strokeWidth="2.5" strokeLinejoin="round" /><path d="M10 40c3-6 7-4 10-8 3 3 7 1 10-3 3 3 7 3 10 0 3 2 7 3 10 9" fill="none" stroke="#2E9B57" strokeWidth="4" strokeLinecap="round" /><circle cx="22" cy="36" r="3" fill="#E8553B" /><circle cx="40" cy="34" r="3" fill="#E8553B" /></svg>
  );
}

function DrinkArt() {
  return (
    <svg width="32" height="32" viewBox="0 0 64 64" aria-hidden="true"><path d="M18 20h28l-4 36a4 4 0 0 1-4 4H26a4 4 0 0 1-4-4z" fill="#E9CFA8" stroke="#1A2019" strokeWidth="2.5" strokeLinejoin="round" /><path d="M16 20h32" stroke="#1A2019" strokeWidth="2.5" strokeLinecap="round" /><path d="M36 20 42 4" stroke="#1E7A46" strokeWidth="4" strokeLinecap="round" /></svg>
  );
}
