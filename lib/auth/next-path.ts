// Where to send a student after sign-in (#109). proxy.ts remembers the page a signed-out
// visitor asked for in the grove_next cookie; the auth callback reads it back. Only plain
// same-site paths pass, so the cookie can't be used as an open redirect.
export const NEXT_COOKIE = "grove_next";

export function safeNextPath(raw: string | null | undefined): string | null {
  if (!raw || raw.length > 512) return null;
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return null;
  if (/[\u0000-\u001f\u007f]/.test(raw) || raw.includes("://")) return null;
  const path = raw.split(/[?#]/)[0];
  if (path === "/" || path === "/sign-in" || path.startsWith("/auth/")) return null;
  return raw;
}
