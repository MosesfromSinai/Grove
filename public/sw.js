/* Push only. No fetch handler, cached sessions, offline pages or background location. */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", event => event.waitUntil(self.clients.claim()));
function dealPath(value) {
  return typeof value === "string" && /^\/deals\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value) ? value : "/map";
}
self.addEventListener("push", event => {
  let data = {};
  try { data = event.data?.json() ?? {}; } catch { /* Show a safe visible fallback. */ }
  if (!data || typeof data !== "object") data = {};
  event.waitUntil(self.registration.showNotification(
    typeof data.title === "string" ? data.title.slice(0, 80) : "Grove deal nearby",
    { body: typeof data.body === "string" ? data.body.slice(0, 160) : "Open Grove to see nearby deals.",
      icon: "/icons/icon-192.png", badge: "/icons/icon-192.png", tag: dealPath(data.path),
      data: { path: dealPath(data.path) } },
  ));
});
self.addEventListener("notificationclick", event => {
  event.notification.close();
  const url = new URL(dealPath(event.notification.data?.path), self.location.origin).href;
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of windows) {
      if (new URL(client.url).origin === self.location.origin && "navigate" in client) {
        await client.navigate(url); return client.focus();
      }
    }
    return self.clients.openWindow(url);
  })());
});
