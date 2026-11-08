import { expect, test } from "vitest";
import { dealShareUrl } from "./deal-share-format";

test("deal links use the configured origin and deal ID for public, link-only and demo records", () => {
  const id = "7e570000-0000-4000-8000-0000000000d1";
  expect(dealShareUrl(id, "https://grove-jade.vercel.app/")).toBe(`https://grove-jade.vercel.app/deals/${id}`);
  expect(dealShareUrl("deal-opt-chess-night", "http://127.0.0.1:3001")).toBe("http://127.0.0.1:3001/deals/deal-opt-chess-night");
  expect(dealShareUrl(id, "http://[::1]:3001")).toBe(`http://[::1]:3001/deals/${id}`);
});

test("sharing refuses absent/unsafe origins and IDs that could change the URL destination", () => {
  for (const origin of [undefined, "", "not a URL", "http://grove.example", "javascript:alert(1)", "https://u:p@example.com", "https://example.com/path", "https://example.com/?token=x", "https://example.com/#fragment"]) expect(() => dealShareUrl("deal1", origin)).toThrow();
  for (const id of ["", "..", "../b/sticker", "a/b", "a?b", "a#b", "a b", "a%2Fb", "a\\b", "x".repeat(129)]) expect(() => dealShareUrl(id, "https://example.com")).toThrow();
});
