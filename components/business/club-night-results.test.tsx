// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { ClubNightResults } from "./club-night-results";
import type { ClubNight } from "@/lib/supabase/types";
import { clubNightSchedule } from "./club-night-format";

const claimed: ClubNight = { id: "n1", business_id: "b1", business_name: "Kitchen", night_date: "2026-11-05", start_time: "18:00", end_time: "21:00", giveback: "15% back", status: "claimed", claimed_club_name: "Student club", claimed_at: "2026-11-05T20:00Z", deal_id: "d1", visit_count: 18 };
let root: Root; let container: HTMLDivElement;
const refresh = vi.fn(); const reload = vi.fn();
beforeEach(() => { vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true); refresh.mockClear(); reload.mockClear(); container = document.createElement("div"); document.body.append(container); root = createRoot(container); });
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.unstubAllGlobals(); });
async function show(props: Partial<Parameters<typeof ClubNightResults>[0]> = {}) {
  await act(async () => root.render(<ClubNightResults nights={[claimed]} busy={false} disabled={false} error="" updatedAt="2026-11-06T20:00:00Z" onRefresh={refresh} {...props} />));
}
function button(text: string) { return [...container.querySelectorAll<HTMLButtonElement>("button")].find(b => b.textContent === text)!; }

test("results show claimed clubs, verified counts including zero, and truthful unclaimed states", async () => {
  await show({ nights: [claimed, { ...claimed, id: "n2", claimed_club_name: "No visits club", visit_count: 0 }, { ...claimed, id: "n3", status: "open", claimed_club_name: null, deal_id: null, visit_count: 0 }, { ...claimed, id: "n4", status: "expired", claimed_club_name: null, deal_id: null, visit_count: 0 }] });
  const rows = [...container.querySelectorAll("li")]; expect(rows).toHaveLength(4);
  expect(rows[0].textContent).toContain("Student club"); expect(rows[0].textContent).toContain("18verified visits");
  expect(rows[1].textContent).toContain("No visits club"); expect(rows[1].textContent).toContain("0verified visits");
  expect(rows[2].textContent).toContain("Not claimed"); expect(rows[2].textContent).toContain("Open at last refresh");
  expect(rows[3].textContent).toContain("Expired at last refresh"); expect(container.textContent).toContain("Last refreshed");
  await act(async () => button("Refresh posted nights").click()); expect(refresh).toHaveBeenCalledTimes(1);
});

test("loading, empty and unavailable states never invent a visit count; errors label stale results", async () => {
  await show({ nights: null, busy: true, updatedAt: null }); expect(container.textContent).toContain("Loading posted nights"); expect(container.querySelector("li")).toBeNull();
  await show({ nights: [] }); expect(container.textContent).toContain("No posted club nights");
  await show({ error: "Refresh failed. Previous results may be out of date." }); expect(container.textContent).toContain("Student club"); expect(container.querySelector('[role="alert"]')?.textContent).toContain("out of date");
  await show({ nights: null, updatedAt: null, error: "Membership ended", onReloadBusiness: reload }); expect(container.textContent).not.toContain("Student club"); expect(container.textContent).not.toContain("verified visits");
  await act(async () => button("Reload business").click()); expect(reload).toHaveBeenCalledTimes(1);
});

test("older nights remain accessible and user-entered club names are rendered as text", async () => {
  const label = '<img src=x onerror="alert(1)"> ' + "LongClub".repeat(12);
  const nights = Array.from({ length: 25 }, (_, i) => ({ ...claimed, id: `n${i}`, claimed_club_name: i === 24 ? label : `Club ${i}`, visit_count: i === 24 ? 2305 : i }));
  await show({ nights }); expect(container.querySelectorAll("li")).toHaveLength(20);
  await act(async () => button("Show more nights").click()); expect(container.querySelectorAll("li")).toHaveLength(25); expect(button("Show more nights")).toBeUndefined();
  expect(container.textContent).toContain(label); expect(container.querySelector("img")).toBeNull(); expect(container.textContent).toContain("2,305verified visits"); expect(container.textContent).toContain("Showing 25 of 25");
});

test("stored campus wall times stay readable on DST transition dates", () => {
  expect(clubNightSchedule({ night_date: "2026-11-01", start_time: "01:30", end_time: "02:30" })).toBe("Nov 1, 2026 · 1:30 AM–2:30 AM");
  expect(clubNightSchedule({ night_date: "2026-03-08", start_time: "01:30", end_time: "03:30" })).toBe("Mar 8, 2026 · 1:30 AM–3:30 AM");
  expect(clubNightSchedule({ night_date: "2026-02-30", start_time: "18:00", end_time: "21:00" })).toBe("Date or time unavailable");
});
