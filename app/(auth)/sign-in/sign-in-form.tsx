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

  return (
    <div className="w-full max-w-sm flex flex-col items-center gap-8">
      {/* Wordmark */}
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="text-5xl font-heading font-extrabold text-white tracking-tight">
          Grove
        </span>
        <span className="text-orange-light font-sans text-base font-medium">
          Where food finds its campus.
        </span>
      </div>

      {/* Card */}
      <div className="w-full bg-surface rounded-card shadow-card px-6 py-8 flex flex-col gap-5">
        <p className="text-ink font-sans text-sm font-medium text-center leading-snug">
          Sign in with your school Google account
          <br />
          <span className="text-ink-fine">
            UCR students use their @ucr.edu address.
            <br />
            Business owners can sign in with any Google account.
          </span>
        </p>

        {errorMessage && (
          <p className="text-destructive text-sm text-center font-sans">
            {errorMessage}
          </p>
        )}

        <button
          onClick={handleSignIn}
          className="flex items-center justify-center gap-3 w-full min-h-[44px] rounded-button bg-ink text-white font-sans font-semibold text-sm px-4 py-3 hover:bg-ink/90 transition-colors"
        >
          <GoogleIcon />
          Continue with Google
        </button>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path
        d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  );
}
