export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Existing real logos may already be Storage URLs. New uploads are checked by
// the real write adapter, which must not store a browser data URL as an upload.
export function validImage(value: unknown): boolean {
  if (validMockImage(value)) return true;
  if (typeof value !== "string") return false;
  try { return new URL(value).protocol === "https:"; } catch { return false; }
}

export function validMockImage(value: unknown): boolean {
  if (value === null) return true;
  if (typeof value !== "string") return false;
  const payload = /^data:image\/(?:jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value)?.[1];
  if (!payload || payload.length % 4 !== 0) return false;
  const padding = payload.endsWith("==") ? 2 : payload.endsWith("=") ? 1 : 0;
  return (payload.length / 4) * 3 - padding <= MAX_IMAGE_BYTES;
}
