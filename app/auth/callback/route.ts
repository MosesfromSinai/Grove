import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? request.nextUrl.origin;

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

  // .edu check: match the email domain against campuses.email_domain.
  // Requires RLS: allow authenticated read on campuses (Celso, #35).
  const email = user.email ?? "";
  const domain = email.split("@")[1] ?? "";
  const { data: campus } = await supabase
    .from("campuses")
    .select("id")
    .eq("email_domain", domain)
    .maybeSingle();

  if (campus) {
    // Profile row is created by the DB trigger on first sign-in (Moses, #32).
    // Requires RLS: authenticated user can update their own profiles row.
    await supabase
      .from("profiles")
      .update({ verified_student: true, campus_id: campus.id })
      .eq("id", user.id);
  }

  // Route by role; profile row may not exist yet if the DB trigger (#32) isn't deployed.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role === "business") {
    return NextResponse.redirect(new URL("/dashboard", siteUrl));
  }

  return NextResponse.redirect(new URL("/feed", siteUrl));
}
