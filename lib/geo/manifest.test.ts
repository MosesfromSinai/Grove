import { readFileSync } from "node:fs";
import { expect, test } from "vitest";

test("the Grove manifest supplies standalone identity and correctly sized PNG icons", () => {
  const manifest = JSON.parse(readFileSync("public/manifest.json", "utf8"));
  expect(manifest).toMatchObject({
    name: "Grove",
    short_name: "Grove",
    start_url: "/",
    scope: "/",
    display: "standalone",
    theme_color: "#1E7A46",
  });
  expect(manifest.icons.map((icon: { sizes: string }) => icon.sizes)).toContain(
    "192x192",
  );
  expect(manifest.icons.map((icon: { sizes: string }) => icon.sizes)).toContain(
    "512x512",
  );
  expect(
    manifest.icons.some(
      (icon: { purpose: string }) => icon.purpose === "maskable",
    ),
  ).toBe(true);
  for (const icon of [
    ...manifest.icons,
    { src: "/icons/apple-touch-icon.png", sizes: "180x180" },
  ]) {
    const png = readFileSync(`public${icon.src}`);
    expect(png.subarray(0, 8)).toEqual(
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    );
    expect(`${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`).toBe(icon.sizes);
  }
});
