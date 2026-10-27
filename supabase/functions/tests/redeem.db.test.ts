import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { redeem, setClient } from "../../../lib/supabase/queries";
import { admin, anon, removeUser, testUser } from "./helpers";

const OPT = "b0000000-0000-4000-8000-000000000001";
const DEAL = "de000000-0000-4000-8000-0000000000f1";
const AT_COUNTER = { lat: 33.977, lng: -117.3254 }; // about 90 m from Orange Peel Tacos
type Client = Parameters<typeof setClient>[0];

describe.skipIf(!process.env.SUPABASE_DB_TESTS)("redeem, served locally", () => {
  let student: Awaited<ReturnType<typeof testUser>>;
  let outsider: Awaited<ReturnType<typeof testUser>>;
  const input = { deal_id: DEAL, qr_slug: "orange-peel-tacos", ...AT_COUNTER };

  beforeAll(async () => {
    await admin().from("deals").insert({
      id: DEAL, business_id: OPT, title: "Function test deal", discount_type: "amount_off", discount_value: 1,
      starts_at: new Date(Date.now() - 3_600_000).toISOString(), ends_at: new Date(Date.now() + 3_600_000).toISOString(),
    });
    student = await testUser("redeem-fn@student.example", { verified_student: true });
    outsider = await testUser("redeem-fn@gmail.example");
  });

  afterAll(async () => {
    await removeUser(student.id, (db) => db.from("redemptions").delete().eq("deal_id", DEAL));
    await removeUser(outsider.id, async () => {});
    await admin().from("deals").delete().eq("id", DEAL);
  });

  test("signed out is NOT_SIGNED_IN", async () => {
    setClient(anon() as unknown as Client);
    expect(await redeem(input)).toEqual({ ok: false, error: "NOT_SIGNED_IN" });
  });

  test("a non-.edu account is NOT_VERIFIED_STUDENT", async () => {
    setClient(outsider.client as unknown as Client);
    expect(await redeem(input)).toEqual({ ok: false, error: "NOT_VERIFIED_STUDENT" });
  });

  test("a verified student far away is TOO_FAR", async () => {
    setClient(student.client as unknown as Client);
    expect(await redeem({ ...input, lat: 33.9737, lng: -117.3281 })).toEqual({ ok: false, error: "TOO_FAR" });
  });

  test("at the counter it redeems once, then ALREADY_REDEEMED_TODAY", async () => {
    setClient(student.client as unknown as Client);
    const first = await redeem(input);
    expect(first).toMatchObject({ ok: true, redemption: { deal_id: DEAL, method: "sticker", deal_title: "Function test deal", business_name: "Orange Peel Tacos" } });
    expect(await redeem(input)).toEqual({ ok: false, error: "ALREADY_REDEEMED_TODAY" });
  });
});
