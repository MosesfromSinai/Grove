import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = mkdtempSync(join(tmpdir(), "grove-post-deal-"));
after(() => {
  if (dirname(resolve(output)) !== resolve(tmpdir())) throw new Error("Unexpected test output path");
  rmSync(output, { recursive: true, force: true });
});
// Compile the real wrappers and fixtures into an isolated temp directory. No
// extra test framework, runtime dependency, or generated repository files.
execFileSync(process.execPath, [
  join(root, "node_modules/typescript/lib/tsc.js"),
  "mocks/index.ts", "lib/supabase/business.ts", "lib/supabase/deal-input.ts",
  "--outDir", output, "--rootDir", root,
  "--module", "commonjs", "--moduleResolution", "node", "--target", "ES2020",
  "--skipLibCheck", "--strict", "--types", "node", "--esModuleInterop",
], { cwd: root, stdio: "pipe" });
const loadCompiled = createRequire(import.meta.url);
const { createDeal, endDeal, cancelDeal } = loadCompiled(join(output, "lib/supabase/business.js"));
const { getMyDeals, getDeal, getDealsNearby, redeemPin } = loadCompiled(join(output, "mocks/index.js"));
const fixtures = loadCompiled(join(output, "mocks/data.js"));
const { campusClock } = loadCompiled(join(output, "lib/supabase/deal-status.js"));
const { validateCreateDealInput, campusDateTimeToISO, campusDateTimeInput } = loadCompiled(join(output, "lib/supabase/deal-input.js"));

const now = Date.now();
const input = (overrides = {}) => ({
  business_id: "biz-opt", title: "  $2 off any burrito  ", description: "  Any burrito on the menu.  ",
  discount_type: "amount_off", discount_value: 2, photo_url: null,
  starts_at: new Date(now - 60_000).toISOString(), ends_at: new Date(now + 3_600_000).toISOString(),
  students_only: true, ...overrides,
});

test("campus scheduling ignores device timezone and handles daylight-saving boundaries", () => {
  assert.equal(campusDateTimeToISO("2026-10-25T14:00"), "2026-10-25T21:00:00.000Z");
  assert.equal(campusDateTimeToISO("2026-11-02T14:00"), "2026-11-02T22:00:00.000Z");
  assert.equal(campusDateTimeInput(new Date("2026-10-25T21:00:00Z")), "2026-10-25T14:00");
  assert.equal(campusDateTimeToISO("2026-03-08T02:30"), null);
  assert.equal(campusDateTimeToISO("2026-11-01T01:30"), null);
  for (const value of ["", "invalid", "2026-02-30T12:00", "2026-10-25T25:00"]) assert.equal(campusDateTimeToISO(value), null);
});

test("invalid titles, discounts, schedules, photos, and eligibility are rejected", () => {
  const cases = [
    [{ title: "   " }, "title"], [{ description: "\n " }, "description"],
    [{ discount_type: "unknown" }, "discount_type"],
    ...[0, -1, NaN, Infinity, 2.001].map(discount_value => [{ discount_value }, "discount_value"]),
    [{ discount_type: "percent_off", discount_value: 101 }, "discount_value"],
    [{ discount_type: "free_item", discount_value: 2 }, "discount_value"],
    [{ starts_at: "invalid" }, "starts_at"], [{ ends_at: "invalid" }, "ends_at"],
    [{ ends_at: new Date(now - 60_000).toISOString() }, "ends_at"],
    [{ starts_at: new Date(now + 3_600_000).toISOString() }, "ends_at"],
    [{ photo_url: "data:image/svg+xml;base64,PHN2Zz4=" }, "photo_url"],
    [{ photo_url: `data:image/png;base64,${"A".repeat(7_000_000)}` }, "photo_url"],
    [{ students_only: "yes" }, "students_only"],
  ];
  for (const [changes, field] of cases) {
    const result = validateCreateDealInput(input(changes), now);
    assert.equal(result.ok, false, JSON.stringify(changes));
    assert.ok(result.fields[field], field);
  }
});

test("all four discounts save through the adapter and existing queries see the same records", async () => {
  for (const [discount_type, discount_value] of [["amount_off", 2.25], ["percent_off", 100], ["free_item", null], ["bogo", null]]) {
    const result = await createDeal(input({ discount_type, discount_value }));
    assert.equal(result.ok, true);
    const deal = result.deal;
    assert.match(deal.id, /^[0-9a-f-]{36}$/);
    assert.equal(deal.title, "$2 off any burrito");
    assert.equal(deal.description, "Any burrito on the menu.");
    assert.equal(deal.discount_type, discount_type);
    assert.equal(deal.discount_value, discount_value);
    assert.equal(deal.status, "live");
    assert.equal(deal.redemption_count, 0);
    assert.equal(deal.visibility, "public");
    assert.equal(deal.active_days, null);
    assert.equal((await getDeal({ id: deal.id })).id, deal.id);
    assert.ok((await getMyDeals({ businessId: "biz-opt" })).some(row => row.id === deal.id));
    const feed = await getDealsNearby({ lat: 33.9762, lng: -117.3254, radiusM: 500, hasDeals: true });
    assert.ok(feed.some(row => row.deal_id === deal.id));
  }
});

test("scheduled posts preserve photos and eligibility but cannot inject generated fields", async () => {
  const photo_url = "data:image/png;base64,iVBORw0KGgo=";
  const result = await createDeal(input({
    starts_at: new Date(now + 86_400_000).toISOString(), ends_at: new Date(now + 90_000_000).toISOString(),
    photo_url, students_only: false, id: "injected", visibility: "link_only", status: "ended", redemption_count: 999,
  }));
  assert.equal(result.ok, true);
  assert.notEqual(result.deal.id, "injected");
  assert.equal(result.deal.status, "scheduled");
  assert.equal(result.deal.visibility, "public");
  assert.equal(result.deal.redemption_count, 0);
  assert.equal(result.deal.photo_url, photo_url);
  assert.equal(result.deal.students_only, false);
});

test("ownership and validation failures do not mutate either business's deals", async () => {
  const before = await getMyDeals({ businessId: "biz-opt" });
  const otherBefore = await getMyDeals({ businessId: "biz-saf" });
  assert.deepEqual(await createDeal(input({ business_id: "biz-saf" })), { ok: false, error: "NOT_OWNER" });
  const invalid = await createDeal(input({ title: "" }));
  assert.equal(invalid.error, "INVALID_DEAL");
  assert.equal((await getMyDeals({ businessId: "biz-opt" })).length, before.length);
  assert.equal((await getMyDeals({ businessId: "biz-saf" })).length, otherBefore.length);
});

test("End now keeps the deal and redemption history, removes it from the feed, and prevents redemption", async () => {
  const before = (await getMyDeals({ businessId: "biz-opt" })).find(deal => deal.id === "deal-opt-burrito");
  const redemptionRows = fixtures.redemptions.length;
  const result = await endDeal({ business_id: "biz-opt", deal_id: before.id });
  assert.equal(result.ok, true);
  assert.equal(result.deal.id, before.id);
  assert.equal(result.deal.status, "ended");
  assert.equal(result.deal.redemption_count, before.redemption_count);
  assert.ok(Date.parse(result.deal.ends_at) > Date.parse(result.deal.starts_at));
  assert.equal(fixtures.redemptions.length, redemptionRows);
  assert.equal((await getDeal({ id: before.id })).status, "ended");
  assert.ok(!(await getDealsNearby({ lat: 33.9762, lng: -117.3254, radiusM: 500, hasDeals: true })).some(row => row.deal_id === before.id));
  assert.equal((await redeemPin({ deal_id: before.id, business_id: "biz-opt", pin: "1234" })).error, "DEAL_NOT_LIVE");
  assert.equal((await endDeal({ business_id: "biz-opt", deal_id: before.id })).error, "DEAL_NOT_LIVE");
});

test("Cancel removes a scheduled deal with no redemptions and rejects duplicate requests", async () => {
  const created = await createDeal(input({ starts_at: new Date(now + 86_400_000).toISOString(), ends_at: new Date(now + 90_000_000).toISOString() }));
  const request = { business_id: "biz-opt", deal_id: created.deal.id };
  const results = await Promise.all([cancelDeal(request), cancelDeal(request)]);
  assert.equal(results.filter(result => result.ok).length, 1);
  assert.equal(results.find(result => !result.ok).error, "DEAL_NOT_FOUND");
  assert.equal(await getDeal({ id: request.deal_id }), null);
  assert.ok(!(await getMyDeals({ businessId: "biz-opt" })).some(deal => deal.id === request.deal_id));
});

test("mutation ownership checks reject foreign and missing deals without changing them", async () => {
  const foreign = fixtures.deals.find(deal => deal.business_id === "biz-saf");
  const snapshot = { ...foreign };
  for (const mutate of [endDeal, cancelDeal]) {
    assert.equal((await mutate({ business_id: "biz-saf", deal_id: foreign.id })).error, "NOT_OWNER");
    assert.equal((await mutate({ business_id: "biz-opt", deal_id: foreign.id })).error, "DEAL_NOT_FOUND");
    assert.equal((await mutate({ business_id: "biz-opt", deal_id: "missing" })).error, "DEAL_NOT_FOUND");
  }
  assert.deepEqual(foreign, snapshot);
});

test("Cancel rechecks live status and newly recorded redemptions instead of trusting a stale list", async () => {
  const created = await createDeal(input({ starts_at: new Date(now + 86_400_000).toISOString(), ends_at: new Date(now + 90_000_000).toISOString() }));
  const request = { business_id: "biz-opt", deal_id: created.deal.id };
  const stored = fixtures.deals.find(deal => deal.id === request.deal_id);
  const snapshot = (await getMyDeals({ businessId: "biz-opt" })).find(deal => deal.id === stored.id);
  assert.equal(snapshot.status, "scheduled");
  fixtures.redemptions.push({ id: "test-new-visit", deal_id: stored.id, business_id: "biz-opt", student_id: "test-student", redeemed_at: new Date().toISOString(), method: "sticker" });
  assert.equal((await cancelDeal(request)).error, "DEAL_HAS_REDEMPTIONS");
  stored.starts_at = new Date(Date.now() - 60_000).toISOString();
  assert.equal((await cancelDeal(request)).error, "DEAL_NOT_SCHEDULED");
  assert.ok(fixtures.deals.includes(stored));
});

test("End now rechecks expiration and never creates an invalid future-deal window", async () => {
  const created = await createDeal(input());
  const request = { business_id: "biz-opt", deal_id: created.deal.id };
  const stored = fixtures.deals.find(deal => deal.id === request.deal_id);
  stored.ends_at = new Date(Date.now() - 1).toISOString();
  const endedAt = stored.ends_at;
  assert.equal((await endDeal(request)).error, "DEAL_NOT_LIVE");
  assert.equal(stored.ends_at, endedAt);
  stored.starts_at = new Date(now + 86_400_000).toISOString();
  stored.ends_at = new Date(now + 90_000_000).toISOString();
  assert.equal((await endDeal(request)).error, "DEAL_NOT_LIVE");
  assert.ok(Date.parse(stored.ends_at) > Date.parse(stored.starts_at));
});

test("repeating deals can be turned off outside a daily window without losing visits", async () => {
  const created = await createDeal(input());
  const stored = fixtures.deals.find(deal => deal.id === created.deal.id);
  stored.active_days = [campusClock(new Date()).weekday === "mon" ? "tue" : "mon"];
  stored.daily_start = "14:00";
  stored.daily_end = "17:00";
  stored.ends_at = null;
  assert.equal((await getDeal({ id: stored.id })).status, "scheduled");
  const result = await endDeal({ business_id: "biz-opt", deal_id: stored.id });
  assert.equal(result.ok, true);
  assert.equal(result.deal.status, "ended");
  assert.ok(result.deal.ends_at);
});

test("Cancel protects historical counts and club-night references", async () => {
  const historical = fixtures.deals.find(deal => deal.id === "deal-opt-horchata");
  const originalStart = historical.starts_at;
  historical.starts_at = new Date(now + 86_400_000).toISOString();
  try {
    assert.equal((await cancelDeal({ business_id: "biz-opt", deal_id: historical.id })).error, "DEAL_HAS_REDEMPTIONS");
  } finally { historical.starts_at = originalStart; }
  const created = await createDeal(input({ starts_at: new Date(now + 86_400_000).toISOString(), ends_at: new Date(now + 90_000_000).toISOString() }));
  fixtures.clubNights.push({ ...fixtures.clubNights[0], id: "test-referenced-night", business_id: "biz-opt", deal_id: created.deal.id });
  assert.equal((await cancelDeal({ business_id: "biz-opt", deal_id: created.deal.id })).error, "DEAL_IN_USE");
  assert.ok(await getDeal({ id: created.deal.id }));
});

test("write timestamps must be explicit ISO instants with valid calendar dates", () => {
  for (const value of ["1", "2026-10-25", "2026-10-25T14:00:00", "2026-02-30T14:00:00Z", "2026-10-25T24:00:00Z"]) {
    const result = validateCreateDealInput(input({ starts_at: value }), now);
    assert.equal(result.ok, false, value);
    assert.ok(result.fields.starts_at, value);
  }
  const futureEnd = new Date(Math.max(now + 3_600_000, Date.parse("2026-10-25T22:00:00Z"))).toISOString();
  const result = validateCreateDealInput(input({ starts_at: "2026-10-25T14:00:00-07:00", ends_at: futureEnd }), now);
  assert.equal(result.ok, true);
  assert.equal(result.value.starts_at, "2026-10-25T21:00:00.000Z");
});

test("photo byte limit is exact even when base64 padding changes without changing length", () => {
  const maxBytes = 5 * 1024 * 1024;
  const exact = Buffer.alloc(maxBytes).toString("base64");
  const oversized = Buffer.alloc(maxBytes + 1).toString("base64");
  assert.equal(exact.length, oversized.length);
  assert.equal(validateCreateDealInput(input({ photo_url: `data:image/png;base64,${exact}` }), now).ok, true);
  const result = validateCreateDealInput(input({ photo_url: `data:image/png;base64,${oversized}` }), now);
  assert.equal(result.ok, false);
  assert.ok(result.fields.photo_url);
  assert.equal(validateCreateDealInput(input({ photo_url: "data:image/png;base64,AAAA=" }), now).ok, false);
});
