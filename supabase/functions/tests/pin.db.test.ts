import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { redeem, redeemPin, setClient, setPin } from "../../../lib/supabase/queries";
import { admin, anon, removeUser, testUser } from "./helpers";

const OPT = "b0000000-0000-4000-8000-000000000001";
const PEPPER = "b0000000-0000-4000-8000-000000000004";
const DEAL = "de000000-0000-4000-8000-0000000000e1";
type Client = Parameters<typeof setClient>[0];
type User = Awaited<ReturnType<typeof testUser>>;
const as = (user: User) => setClient(user.client as unknown as Client);

describe.skipIf(!process.env.SUPABASE_DB_TESTS)("redeem-pin, set-pin, and the redeem rate limit, served locally", () => {
  let owner: User, staff: User, student: User, guesser: User, neighbour: User, spammer: User;
  let pin = "";

  beforeAll(async () => {
    await admin().from("deals").insert({
      id: DEAL, business_id: OPT, title: "PIN test deal",
      starts_at: new Date(Date.now() - 3_600_000).toISOString(), ends_at: new Date(Date.now() + 3_600_000).toISOString(),
    });
    owner = await testUser("pin-owner@opt.example", { role: "business" });
    staff = await testUser("pin-staff@opt.example", { role: "business" });
    await admin().from("business_members").insert([
      { business_id: OPT, user_id: owner.id, email: "pin-owner@opt.example", role: "owner" },
      { business_id: OPT, user_id: staff.id, email: "pin-staff@opt.example", role: "staff" },
    ]);
    student = await testUser("pin-student@student.example", { verified_student: true });
    guesser = await testUser("pin-guesser@student.example", { verified_student: true });
    neighbour = await testUser("pin-neighbour@student.example", { verified_student: true });
    spammer = await testUser("pin-spammer@student.example", { verified_student: true });
  });

  afterAll(async () => {
    await admin().from("redemptions").delete().eq("deal_id", DEAL);
    await admin().from("deals").delete().eq("id", DEAL);
    await admin().from("business_members").delete().in("email", ["pin-owner@opt.example", "pin-staff@opt.example"]);
    await admin().from("businesses").update({ staff_pin: null }).eq("id", OPT);
    for (const user of [owner, staff, student, guesser, neighbour, spammer]) await removeUser(user.id, async () => {});
  });

  test("set-pin: only the owner gets a PIN, and it's stored only as a hash", async () => {
    setClient(anon() as unknown as Client);
    expect(await setPin({ business_id: OPT })).toEqual({ ok: false, error: "NOT_SIGNED_IN" });
    as(staff);
    expect(await setPin({ business_id: OPT })).toEqual({ ok: false, error: "NOT_OWNER" });
    as(student);
    expect(await setPin({ business_id: OPT })).toEqual({ ok: false, error: "NOT_OWNER" });
    as(owner);
    expect(await setPin({ business_id: PEPPER })).toEqual({ ok: false, error: "NOT_OWNER" });
    const result = await setPin({ business_id: OPT });
    expect(result).toMatchObject({ ok: true, pin: expect.stringMatching(/^\d{4}$/) });
    if (result.ok) pin = result.pin;

    const { data: stored } = await admin().from("businesses").select("staff_pin").eq("id", OPT).single();
    expect(stored?.staff_pin).not.toBe(pin);
    expect((await admin().rpc("verify_pin", { bid: OPT, input_pin: pin })).data).toBe(true);
  });

  test("redeem-pin: wrong business, wrong PIN, right PIN, then once a day", async () => {
    as(student);
    expect(await redeemPin({ deal_id: DEAL, business_id: PEPPER, pin })).toEqual({ ok: false, error: "DEAL_NOT_LIVE" });
    const wrong = pin === "0000" ? "1111" : "0000";
    expect(await redeemPin({ deal_id: DEAL, business_id: OPT, pin: wrong })).toEqual({ ok: false, error: "BAD_PIN" });
    expect(await redeemPin({ deal_id: DEAL, business_id: OPT, pin: "12a4" })).toEqual({ ok: false, error: "BAD_PIN" });
    expect(await redeemPin({ deal_id: DEAL, business_id: OPT, pin })).toMatchObject({ ok: true, redemption: { method: "pin", deal_title: "PIN test deal" } });
    expect(await redeemPin({ deal_id: DEAL, business_id: OPT, pin })).toEqual({ ok: false, error: "ALREADY_REDEEMED_TODAY" });
  });

  test("lockout is per student: 5 bad PINs lock that student, not the next one", async () => {
    const wrong = pin === "0000" ? "1111" : "0000";
    as(guesser);
    for (let i = 0; i < 5; i++) expect(await redeemPin({ deal_id: DEAL, business_id: OPT, pin: wrong })).toEqual({ ok: false, error: "BAD_PIN" });
    expect(await redeemPin({ deal_id: DEAL, business_id: OPT, pin })).toEqual({ ok: false, error: "RATE_LIMITED" });
    as(neighbour);
    expect(await redeemPin({ deal_id: DEAL, business_id: OPT, pin })).toMatchObject({ ok: true });
  });

  test("redeem: more than 10 attempts in a minute is RATE_LIMITED", async () => {
    as(spammer);
    const input = { deal_id: DEAL, qr_slug: "orange-peel-tacos", lat: 33.9737, lng: -117.3281 }; // too far, so nothing redeems
    const results = [];
    for (let i = 0; i < 11; i++) results.push(await redeem(input));
    expect(results.slice(0, 9).every((r) => !r.ok && r.error === "TOO_FAR")).toBe(true);
    expect(results.at(-1)).toEqual({ ok: false, error: "RATE_LIMITED" });
  }, 30_000);
});
