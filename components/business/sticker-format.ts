export const STICKER_DPI = 300;
export const STICKER_SIZES = [3, 4, 6] as const;
export type StickerSize = (typeof STICKER_SIZES)[number];

export function stickerUrl(slug: string, configuredOrigin: string | undefined): string {
  if (!configuredOrigin?.trim()) throw new Error("The app URL is not configured. Ask the Grove coordinator to configure the public app address before downloading a sticker.");
  let origin: URL;
  try { origin = new URL(configuredOrigin.trim()); } catch { throw new Error("The configured app URL is invalid. Ask the Grove coordinator to check it."); }
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(origin.hostname);
  if ((origin.protocol !== "https:" && !(local && origin.protocol === "http:")) || origin.username || origin.password ||
    origin.pathname !== "/" || origin.search || origin.hash) throw new Error("The configured app address is invalid. Ask the Grove coordinator to check it.");
  if (!/^[A-Za-z0-9_-]+$/.test(slug)) throw new Error("This business has no usable sticker slug. Ask the Grove coordinator to check its permanent link.");
  return new URL(`/b/${encodeURIComponent(slug)}`, origin.origin).href;
}

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// Canvas exports default to 96 DPI. Replace pHYs so actual-size printing uses
// the selected inches at 300 DPI, preserving the image data and QR pixels.
export function withPrintResolution(bytes: Uint8Array): Uint8Array<ArrayBuffer> {
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  if (!signature.every((byte, index) => bytes[index] === byte)) throw new Error("Could not prepare the PNG for printing.");
  const chunks: Uint8Array[] = [];
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 8;
  while (offset < bytes.length) {
    if (offset + 12 > bytes.length) throw new Error("Incomplete PNG image.");
    const length = view.getUint32(offset);
    const end = offset + length + 12;
    if (end > bytes.length) throw new Error("Incomplete PNG image.");
    const type = String.fromCharCode(...bytes.subarray(offset + 4, offset + 8));
    if (type !== "pHYs") chunks.push(bytes.subarray(offset, end));
    offset = end;
  }
  if (chunks.length < 2 || String.fromCharCode(...chunks[0].subarray(4, 8)) !== "IHDR") throw new Error("Invalid PNG image.");
  const physical = new Uint8Array(21);
  const physicalView = new DataView(physical.buffer);
  physicalView.setUint32(0, 9);
  physical.set([112, 72, 89, 115], 4); // pHYs
  physicalView.setUint32(8, Math.round(STICKER_DPI / 0.0254));
  physicalView.setUint32(12, Math.round(STICKER_DPI / 0.0254));
  physical[16] = 1; // pixels per metre
  physicalView.setUint32(17, crc32(physical.subarray(4, 17)));
  chunks.splice(1, 0, physical);
  const result = new Uint8Array(8 + chunks.reduce((sum, chunk) => sum + chunk.length, 0));
  result.set(signature);
  let position = 8;
  for (const chunk of chunks) { result.set(chunk, position); position += chunk.length; }
  return result;
}
