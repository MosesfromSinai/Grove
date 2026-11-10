import { expect, test } from "vitest";
import { safeNextPath } from "./next-path";

test.each(["/deals/abc", "/deals/abc?x=1", "/b/orange-peel-tacos", "/profile"])("keeps %s", (path) => {
  expect(safeNextPath(path)).toBe(path);
});

test.each([
  null,
  "",
  "deals/abc",
  "//evil.com",
  "/\\evil.com",
  "https://evil.com",
  "/x?u=https://evil.com",
  "/deals/a\nb",
  "/",
  "/sign-in",
  "/sign-in?error=oauth_error",
  "/auth/callback",
  "/" + "a".repeat(600),
])("rejects %j", (raw) => {
  expect(safeNextPath(raw)).toBeNull();
});
