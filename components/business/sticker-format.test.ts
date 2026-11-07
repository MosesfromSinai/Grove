import { crc32 } from "node:zlib";
import { expect, test } from "vitest";
import { STICKER_DPI, stickerUrl, withPrintResolution } from "./sticker-format";

test("counter URLs use the configured origin and permanent business slug", () => {
  expect(stickerUrl("grove-test-kitchen", "https://grove-jade.vercel.app")).toBe("https://grove-jade.vercel.app/b/grove-test-kitchen");
  expect(stickerUrl("7Kx2pQ", "https://preview.example/")).toBe("https://preview.example/b/7Kx2pQ");
  expect(stickerUrl("test", "http://127.0.0.1:3001")).toBe("http://127.0.0.1:3001/b/test");
});

test("missing/unsafe app origins and malformed slugs never produce a QR destination", () => {
  for (const origin of [undefined, "", "not a URL", "http://grove.example", "javascript:alert(1)", "https://u:p@example.com", "https://example.com/path", "https://example.com/?token=x", "https://example.com/#fragment"]) expect(() => stickerUrl("test", origin)).toThrow();
  for (const slug of ["", "..", "a/b", "a?b", "a#b", "a b", "a%2Fb", "a\\b"]) expect(() => stickerUrl(slug, "https://example.com")).toThrow();
});

function chunks(bytes: Uint8Array) {
  const result: { type: string; data: Uint8Array; checksum: number }[] = [];
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  for (let offset = 8; offset < bytes.length;) {
    const length = view.getUint32(offset);
    result.push({ type: String.fromCharCode(...bytes.subarray(offset + 4, offset + 8)), data: bytes.subarray(offset + 8, offset + 8 + length), checksum: view.getUint32(offset + 8 + length) });
    offset += length + 12;
  }
  return result;
}

test("PNG print metadata is 300 DPI with a valid CRC, without altering QR image data", () => {
  const original = new Uint8Array(Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a0ioAAAAASUVORK5CYII=", "base64"));
  const once = withPrintResolution(original);
  const twice = withPrintResolution(once);
  expect(twice).toEqual(once);
  const physical = chunks(once).filter(chunk => chunk.type === "pHYs");
  expect(physical).toHaveLength(1);
  const view = new DataView(physical[0].data.buffer, physical[0].data.byteOffset, 9);
  expect(view.getUint32(0)).toBe(Math.round(STICKER_DPI / 0.0254));
  expect(view.getUint32(4)).toBe(view.getUint32(0));
  expect(view.getUint8(8)).toBe(1);
  expect(physical[0].checksum).toBe(crc32(Buffer.concat([Buffer.from("pHYs"), physical[0].data])));
  expect(chunks(once).filter(chunk => chunk.type !== "pHYs")).toEqual(chunks(original));
  expect(() => withPrintResolution(original.subarray(0, 15))).toThrow();
  expect(() => withPrintResolution(new Uint8Array(10))).toThrow();
});
