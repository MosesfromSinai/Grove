import { expect, test, vi } from "vitest";
import { dealQrPng, dealUrl, qrFileName } from "./deal-link";

vi.mock("qrcode", () => ({ toDataURL: vi.fn(async (url: string) => `data:image/png;base64,${url.length}`) }));

test("the link is always /deals/<id> on the current origin, never a redeem URL", () => {
  expect(dealUrl("https://grove-jade.vercel.app", "d-1")).toBe("https://grove-jade.vercel.app/deals/d-1");
  expect(dealUrl("http://localhost:3000/dashboard", "a/b")).toBe("http://localhost:3000/deals/a%2Fb");
});

test("the QR encodes the deal link as a PNG", async () => {
  expect(await dealQrPng("https://x.test/deals/d")).toMatch(/^data:image\/png/);
});

test("download names are safe slugs", () => {
  expect(qrFileName("$2 off any burrito!")).toBe("2-off-any-burrito-qr.png");
  expect(qrFileName("***")).toBe("deal-qr.png");
});
