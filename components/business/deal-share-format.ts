export function dealShareUrl(id: string, configuredOrigin: string | undefined): string {
  if (!configuredOrigin?.trim()) throw new Error("The app URL is not configured. Ask the Grove coordinator to configure the public app address before sharing deals.");
  let origin: URL;
  try { origin = new URL(configuredOrigin.trim()); }
  catch { throw new Error("The configured app URL is invalid. Ask the Grove coordinator to check it."); }
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(origin.hostname);
  if ((origin.protocol !== "https:" && !(local && origin.protocol === "http:")) || origin.username || origin.password ||
    origin.pathname !== "/" || origin.search || origin.hash) throw new Error("The configured app address is invalid. Ask the Grove coordinator to check it.");
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(id)) throw new Error("This deal has no usable sharing link. Reload your deals and try again.");
  return new URL(`/deals/${encodeURIComponent(id)}`, origin.origin).href;
}
