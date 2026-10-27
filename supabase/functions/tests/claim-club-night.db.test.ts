import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { campusClock } from "../../../lib/supabase/deal-status";
import { claimClubNight, getClubNights, getDeal, setClient } from "../../../lib/supabase/queries";
import { admin, anon, removeUser, testUser } from "./helpers";

const PEPPER = "b0000000-0000-4000-8000-000000000004";
const NIGHT = "c1000000-0000-4000-8000-0000000000f1";
const RACE = "c1000000-0000-4000-8000-0000000000f2";
type Client = Parameters<typeof setClient>[0];
const inTwoDays = campusClock(new Date(Date.now() + 2 * 86_400_000)).date;

describe.skipIf(!process.env.SUPABASE_DB_TESTS)("claim-club-night, served locally", () => {
  let chess: Awaited<ReturnType<typeof testUser>>;
  let film: Awaited<ReturnType<typeof testUser>>;
  let outsider: Awaited<ReturnType<typeof testUser>>;

  beforeAll(async () => {
    await admin().from("club_nights").insert([NIGHT, RACE].map((id) => ({
      id, business_id: PEPPER, night_date: inTwoDays, start_time: "18:00", end_time: "21:00", giveback: "15% back to your club",
    })));
    chess = await testUser("claim-chess@student.example", { verified_student: true });
    film = await testUser("claim-film@student.example", { verified_student: true });
    outsider = await testUser("claim-fn@gmail.example");
  });

  afterAll(async () => {
    const nights = await admin().from("club_nights").select("deal_id").in("id", [NIGHT, RACE]);
    await admin().from("club_nights").delete().in("id", [NIGHT, RACE]);
    await admin().from("deals").delete().in("id", (nights.data ?? []).map((n) => n.deal_id).filter((id): id is string => !!id));
    for (const user of [chess, film, outsider]) await removeUser(user.id, async () => {});
  });

  test("signed out is NOT_SIGNED_IN, a non-.edu account NOT_VERIFIED_STUDENT", async () => {
    setClient(anon() as unknown as Client);
    expect(await claimClubNight({ club_night_id: NIGHT, club_name: "Chess Club" })).toEqual({ ok: false, error: "NOT_SIGNED_IN" });
    setClient(outsider.client as unknown as Client);
    expect(await claimClubNight({ club_night_id: NIGHT, club_name: "Chess Club" })).toEqual({ ok: false, error: "NOT_VERIFIED_STUDENT" });
  });

  test("a blank club name is a bad request, so the wrapper throws", async () => {
    setClient(chess.client as unknown as Client);
    await expect(claimClubNight({ club_night_id: NIGHT, club_name: "   " })).rejects.toThrow();
  });

  test("a claim creates the link-only deal; a second claim is ALREADY_CLAIMED", async () => {
    setClient(chess.client as unknown as Client);
    const claim = await claimClubNight({ club_night_id: NIGHT, club_name: "  Chess Club " });
    expect(claim).toMatchObject({ ok: true, club_night: { status: "claimed", claimed_club_name: "Chess Club", start_time: "18:00" } });
    if (!claim.ok) return;

    setClient(admin() as unknown as Client);
    expect(await getDeal({ id: claim.deal_id })).toMatchObject({ title: "Chess Club night", visibility: "link_only", discount_type: null });
    expect((await getClubNights({ businessId: PEPPER })).find((n) => n.id === NIGHT)?.status).toBe("claimed");

    setClient(film.client as unknown as Client);
    expect(await claimClubNight({ club_night_id: NIGHT, club_name: "Film Club" })).toEqual({ ok: false, error: "ALREADY_CLAIMED" });
  });

  test("two students claiming at the same moment: exactly one wins", async () => {
    const claim = async (user: typeof chess, club: string) => {
      setClient(user.client as unknown as Client);
      return claimClubNight({ club_night_id: RACE, club_name: club });
    };
    const linkOnly = () => admin().from("deals").select("id", { count: "exact", head: true }).eq("business_id", PEPPER).eq("visibility", "link_only");
    const before = (await linkOnly()).count ?? 0;
    const results = await Promise.all([claim(chess, "Chess Club"), claim(film, "Film Club")]);
    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect(results.filter((r) => !r.ok)).toEqual([{ ok: false, error: "ALREADY_CLAIMED" }]);
    expect((await linkOnly()).count).toBe(before + 1);
  });
});
