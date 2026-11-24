import type { PushInput, PushSaveResult, PushRemoveResult } from "@/lib/supabase/types";
import { validPushEndpoint, validPushKeys } from "./validation";

export function pushSupport(): "supported" | "install" | "unsupported" {
  if (typeof window === "undefined" || !window.isSecureContext) return "unsupported";
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (ios && !(navigator as Navigator & { standalone?: boolean }).standalone && !window.matchMedia("(display-mode: standalone)").matches) return "install";
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window ? "supported" : "unsupported";
}
export async function preparePush(): Promise<ServiceWorkerRegistration> {
  const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
  if (registration.active) return registration;
  // Bound activation; never leave an Enable button waiting forever on a broken worker.
  return Promise.race([navigator.serviceWorker.ready, new Promise<never>((_, reject) => {
    const timer = setTimeout(() => reject(new Error("WORKER_TIMEOUT")), 10_000);
    void navigator.serviceWorker.ready.finally(() => clearTimeout(timer));
  })]);
}
export function locationForPush(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("LOCATION_UNAVAILABLE"));
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      resolve({ lat: Math.round(coords.latitude * 1000) / 1000, lng: Math.round(coords.longitude * 1000) / 1000 });
    }, () => reject(new Error("LOCATION_UNAVAILABLE")), { timeout: 10_000, maximumAge: 0, enableHighAccuracy: false });
  });
}
export function vapidBytes(value: string): Uint8Array<ArrayBuffer> {
  const raw = atob(value.replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = Uint8Array.from(raw, c => c.charCodeAt(0));
  if (bytes.length !== 65 || bytes[0] !== 4) throw new Error("INVALID_VAPID_KEY");
  return bytes;
}
async function enablePushNow(
  registration: ServiceWorkerRegistration, key: string, area: { lat: number; lng: number },
  save: (input: PushInput) => Promise<PushSaveResult>,
): Promise<PushSaveResult> {
  const applicationServerKey=vapidBytes(key);
  // Must be the FIRST asynchronous API called from the user's Enable tap (iOS).
  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("PERMISSION_DENIED");
  const current = await registration.pushManager.getSubscription();
  const previousKey=current?.options?.applicationServerKey;
  if(previousKey && (new Uint8Array(previousKey).length!==applicationServerKey.length ||
    new Uint8Array(previousKey).some((byte,i)=>byte!==applicationServerKey[i]))) throw new Error("VAPID_KEY_CHANGED");
  const subscription = current ?? await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey });
  try {
    const json = subscription.toJSON();
    if (!validPushEndpoint(subscription.endpoint) || !json.keys || !validPushKeys(json.keys)) throw new Error("UNSUPPORTED_PROVIDER");
    const result = await save({ endpoint: subscription.endpoint, keys: { p256dh: json.keys.p256dh!, auth: json.keys.auth! }, ...area });
    if (!result.ok && !current) await subscription.unsubscribe();
    return result;
  } catch (error) {
    if (!current) await subscription.unsubscribe().catch(() => false);
    throw error;
  }
}
let pendingEnable: Promise<PushSaveResult> | null = null;
let stopping: Promise<void> | null = null;
let leaving = false;
export function enablePush(...args: Parameters<typeof enablePushNow>): Promise<PushSaveResult> {
  if(stopping || leaving) return Promise.reject(new Error("PUSH_BUSY"));
  if(pendingEnable) return pendingEnable;
  pendingEnable=enablePushNow(...args).finally(()=>{ pendingEnable=null; });
  return pendingEnable;
}
export async function ownBrowserSubscription() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return null;
  const registration = await navigator.serviceWorker.getRegistration("/");
  if (!registration || ![registration.active, registration.waiting, registration.installing]
    .some(worker => worker?.scriptURL === new URL("/sw.js", location.origin).href)) return null;
  return registration.pushManager.getSubscription();
}
async function clearPush(remove: (endpoint: string) => Promise<PushRemoveResult>): Promise<void> {
  // Wait for an in-flight consent/save before revoking; signing out must not race
  // a late save that could re-enable the previous account’s subscription.
  if(pendingEnable) await pendingEnable.catch(()=>undefined);
  const subscription = await ownBrowserSubscription();
  if (!subscription) return;
  // Either path stops delivery. A network failure need not trap someone at sign-out.
  const [server, browser] = await Promise.allSettled([remove(subscription.endpoint), subscription.unsubscribe()]);
  const removed = server.status === "fulfilled" && server.value.ok && server.value.removed;
  const unsubscribed = browser.status === "fulfilled" && browser.value;
  if (!removed && !unsubscribed) throw new Error("UNSUBSCRIBE_FAILED");
}

export function disablePush(remove: (endpoint: string) => Promise<PushRemoveResult>): Promise<void> {
  if(stopping) return stopping;
  stopping=clearPush(remove).finally(()=>{stopping=null;});
  return stopping;
}
export async function signOutWithPush(remove: (endpoint: string) => Promise<PushRemoveResult>, logout: () => Promise<void>) {
  if(leaving) throw new Error("PUSH_BUSY");
  leaving=true;
  try { await disablePush(remove); await logout(); }
  finally { leaving=false; }
}
