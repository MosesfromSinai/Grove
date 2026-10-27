// Runs every query against the local database and seed: `npm run test:db` (needs `supabase start`).
// Skipped in `npm test` and CI. Uses the local service role, so it checks shapes, not RLS.

import { execSync } from "node:child_process";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import type { Database } from "./database.types";
import type { Redemption } from "./types";
import {
  getBusinessBySlug,
  getBusinessStats,
  getClubNights,
  getDeal,
  getDealsNearby,
  getMyDeals,
  getOpenClubNights,
  getStaff,
  setClient,
  subscribeToRedemptions,
} from "./queries";

const OPT = "b0000000-0000-4000-8000-000000000001";
const PEPPER = "b0000000-0000-4000-8000-000000000004";
const BURRITO = "d0000000-0000-4000-8000-000000000001";
const BOWL = "d0000000-0000-4000-8000-000000000015";

describe.skipIf(!process.env.SUPABASE_DB_TESTS)("queries on the local seed", () => {
  let local: { API_URL: string; ANON_KEY: string; SERVICE_ROLE_KEY: string };
  let service: SupabaseClient<Database>;
  let studentId: string;

  beforeAll(async () => {
    local = JSON.parse(execSync("npx supabase status -o json", { stdio: ["ignore", "pipe", "ignore"] }).toString());
    service = createClient<Database>(local.API_URL, local.SERVICE_ROLE_KEY, { auth: { persistSession: false } });
    setClient(service);
    // A test student with one visit, so stats have something to count.
    const { data } = await service.auth.admin.createUser({ email: "db-test@student.example" });
    studentId = data.user!.id;
    await service.from("profiles").upsert({ id: studentId, email: "db-test@student.example" });
    await service.from("redemptions").insert({ deal_id: BURRITO, business_id: OPT, student_id: studentId, redeemed_on: "2026-10-26", method: "pin" });
  });

  afterAll(async () => {
    await service.from("redemptions").delete().eq("student_id", studentId);
    await service.from("profiles").delete().eq("id", studentId);
    await service.auth.admin.deleteUser(studentId);
  });

  test("getDeal returns the deal, its business, and HH:MM windows", async () => {
    const deal = await getDeal({ id: BOWL });
    expect(deal).toMatchObject({ title: "$3 off any bowl", daily_start: "14:00", daily_end: "17:00", redeemed_today: false });
    expect(deal?.business).toMatchObject({ name: "Verde Bowl", lat: 33.968, lng: -117.322 });
    expect(await getDeal({ id: "00000000-0000-4000-8000-000000000000" })).toBeNull();
  });

  test("getBusinessBySlug lists only live public deals", async () => {
    const result = await getBusinessBySlug({ slug: "orange-peel-tacos" });
    expect(result?.liveDeals.map((d) => d.title).sort()).toEqual(["$2 off any burrito", "Free horchata with any combo"]);
    expect(await getBusinessBySlug({ slug: "no-such-sticker" })).toBeNull();
  });

  test("getMyDeals returns every deal newest first with counts", async () => {
    const deals = await getMyDeals({ businessId: OPT });
    expect(deals).toHaveLength(6);
    expect(deals.find((d) => d.id === BURRITO)?.redemption_count).toBe(1);
  });

  test("getBusinessStats counts the test visit", async () => {
    const stats = await getBusinessStats({ businessId: OPT, from: new Date(Date.now() - 86_400_000).toISOString(), to: new Date(Date.now() + 60_000).toISOString() });
    expect(stats).toMatchObject({ total: 1, perDeal: [{ deal_id: BURRITO, title: "$2 off any burrito", count: 1 }] });
  });

  test("club nights: one open night at Pepper Tree Pizza Co.", async () => {
    expect(await getOpenClubNights()).toMatchObject([{ business_name: "Pepper Tree Pizza Co.", start_time: "18:00", end_time: "21:00" }]);
    expect(await getClubNights({ businessId: PEPPER })).toMatchObject([{ status: "open", visit_count: 0 }]);
  });

  test("getStaff shows the owner, active staff, and invited staff", async () => {
    const staff = await getStaff({ businessId: OPT });
    expect(staff.map((m) => `${m.role}:${m.status}`).sort()).toEqual(["owner:active", "staff:active", "staff:invited"]);
  });

  test("subscribeToRedemptions hears a new visit within 5 seconds", async () => {
    const heard: Redemption[] = [];
    const stop = subscribeToRedemptions({ businessId: OPT }, (r) => heard.push(r));
    const joined = () => service.getChannels().some((c) => c.topic.includes(`redemptions:${OPT}`) && c.state === "joined");
    const wait = async (done: () => boolean, ms: number) => {
      for (let t = 0; !done() && t < ms; t += 100) await new Promise((r) => setTimeout(r, 100));
    };
    await wait(joined, 20_000);
    expect(joined()).toBe(true);

    // Local Realtime can miss the first change right after a db reset while it starts streaming,
    // so insert again (a new day) if nothing arrives in 5 s, and time the visit that does arrive.
    let latency = Infinity;
    for (let day = 27; day <= 30 && heard.length === 0; day++) {
      const started = Date.now();
      const insert = await service.from("redemptions").insert({ deal_id: BURRITO, business_id: OPT, student_id: studentId, redeemed_on: `2026-10-${day}`, method: "pin" });
      expect(insert.error).toBeNull();
      await wait(() => heard.length > 0, 5_000);
      if (heard.length) latency = Date.now() - started;
    }
    stop();
    expect(latency).toBeLessThan(5000);
    expect(heard[0]).toMatchObject({ deal_title: "$2 off any burrito", business_name: "Orange Peel Tacos", method: "pin" });
    expect(heard[0]).not.toHaveProperty("student_location");
  }, 60_000);

  test("blocked until #88: deals_nearby doesn't exist yet", async () => {
    await expect(getDealsNearby({ lat: 33.9737, lng: -117.3281, radiusM: 3000 })).rejects.toThrow();
  });

  test("with RLS (#128), the browser's anon key reads a sticker page", async () => {
    setClient(createClient<Database>(local.API_URL, local.ANON_KEY, { auth: { persistSession: false } }));
    const result = await getBusinessBySlug({ slug: "orange-peel-tacos" });
    expect(result?.business).toMatchObject({ name: "Orange Peel Tacos", lat: 33.9762 });
    expect(result?.liveDeals.map((d) => d.title).sort()).toEqual(["$2 off any burrito", "Free horchata with any combo"]);
    setClient(service);
  });
});
