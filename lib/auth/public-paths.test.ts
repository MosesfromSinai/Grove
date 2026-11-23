import { expect, test } from "vitest";
import { isPublicPath } from "./public-paths";

test.each([
  "/feed",
  "/map",
  "/deals/8f2c1e4a-0000-4000-8000-000000000000",
  "/b/orange-peel-tacos",
  "/sign-in",
  "/auth/callback",
  "/theme",
  "/manifest.json",
  "/sw.js",
  "/icons/icon-192.png",
])("opens %s to signed-out visitors", (path) => {
  expect(isPublicPath(path)).toBe(true);
});

test.each([
  "/",
  "/scan",
  "/pin",
  "/club-nights",
  "/profile",
  "/dashboard",
  "/dashboard/settings",
  "/deals",
  "/deals/",
  "/deals/abc/edit",
  "/feeds",
  "/mapx",
])("keeps %s behind sign-in", (path) => {
  expect(isPublicPath(path)).toBe(false);
});
