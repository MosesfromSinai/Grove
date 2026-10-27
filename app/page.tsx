import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const instant = false;

// Routes signed-in users to their app based on profile role.
// Unauthenticated users are redirected to /sign-in by middleware.
export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role === "business") {
    redirect("/dashboard");
  }

  redirect("/feed");
}
