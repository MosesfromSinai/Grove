export const PUSH_RADIUS_M = 3_000;
const providers = new Set(["fcm.googleapis.com", "updates.push.services.mozilla.com", "web.push.apple.com"]);
export function validPushEndpoint(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 4096 || /\s/.test(value)) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && providers.has(url.hostname) && !url.port &&
      !url.username && !url.password && !url.hash && url.pathname.length > 1;
  } catch { return false; }
}
export function validPushKeys(keys: { p256dh?: string; auth?: string }) {
  return /^B[A-Za-z0-9_-]{86}$/.test(keys.p256dh ?? "") && /^[A-Za-z0-9_-]{22}$/.test(keys.auth ?? "");
}
