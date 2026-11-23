// Which pages proxy.ts lets signed-out visitors open (#156). Browsing (feed, map, a deal page)
// is public; anything that redeems, claims, or shows student data (/scan, /pin, /club-nights,
// /profile, /dashboard) still needs a session, and the proxy remembers the page in grove_next.
// The anon role only reads public data: RLS hides link-only deals from discovery, and
// redemptions and profiles have no anon grant.
const PUBLIC_EXACT = new Set(["/sign-in", "/theme", "/feed", "/map", "/manifest.json", "/sw.js"]);

export function isPublicPath(pathname: string): boolean {
  return (
    PUBLIC_EXACT.has(pathname) ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/b/") ||
    pathname.startsWith("/icons/") ||
    // One segment only, so a future nested route under a deal isn't opened by accident.
    /^\/deals\/[^/]+$/.test(pathname)
  );
}
