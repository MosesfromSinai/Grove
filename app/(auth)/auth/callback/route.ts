import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";
import { NEXT_COOKIE, safeNextPath } from "@/lib/auth/next-path";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;

  if (!code) {
    return NextResponse.redirect(
      new URL("/sign-in?error=missing_code", siteUrl)
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL("/sign-in?error=oauth_error", siteUrl)
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(
      new URL("/sign-in?error=no_user", siteUrl)
    );
  }

  // The .edu check (verified_student, campus_id) runs in the handle_new_user() trigger,
  // never from the browser session; the callback only reads the profile.
  // Route by role; profile row may not exist yet if the DB trigger (#32) isn't deployed.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  // Students return to the page they asked for before sign-in (a shared deal link, #109);
  // business users always land on the dashboard. The cookie is single use.
  const next = safeNextPath(request.cookies.get(NEXT_COOKIE)?.value);
  const destination = profile?.role === "business" ? "/dashboard" : (next ?? "/feed");
  const response = NextResponse.redirect(new URL(destination, siteUrl));
  response.cookies.delete(NEXT_COOKIE);
  return response;
}
