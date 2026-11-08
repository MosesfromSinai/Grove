// @vitest-environment jsdom
import { Activity, act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { StaffManagement } from "./staff-management";
import { BusinessAccessError } from "@/lib/supabase/business-errors";
import type { BusinessProfile, StaffMember } from "@/lib/supabase/types";

const api = vi.hoisted(() => ({ read: vi.fn(), add: vi.fn(), remove: vi.fn(), refresh: vi.fn(), mock: true, profile: null as BusinessProfile | null }));
vi.mock("@/lib/supabase", () => ({ getStaff: api.read, addStaff: api.add, removeStaff: api.remove, get isMockData() { return api.mock; } }));
vi.mock("./business-context", () => ({ useBusiness: () => ({ profile: api.profile, refresh: api.refresh }) }));
const owner: StaffMember = { business_id: "b1", email: "owner@example.invalid", role: "owner", user_id: "owner", status: "active" };
const active: StaffMember = { ...owner, email: "active@example.invalid", user_id: "staff", role: "staff" };
const invited: StaffMember = { ...active, email: "invited@example.invalid", user_id: null, status: "invited" };
const added: StaffMember = { ...invited, email: "new@example.invalid" };
let root: Root; let container: HTMLDivElement;
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true); vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
  api.mock = true; api.read.mockReset().mockResolvedValue([owner, active, invited]); api.add.mockReset().mockResolvedValue({ ok: true, member: added }); api.remove.mockReset().mockResolvedValue({ ok: true, email: active.email }); api.refresh.mockReset();
  api.profile = { membership_role: "owner", business: { id: "b1" } } as BusinessProfile;
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
async function show(mode: "visible" | "hidden" = "visible") { await act(async () => root.render(<Activity mode={mode}><StaffManagement /></Activity>)); }
function button(name: string) { const found = [...container.querySelectorAll<HTMLButtonElement>("button")].find(b => b.textContent === name); if (!found) throw new Error(`Missing button ${name}`); return found; }
async function click(name: string) { await act(async () => button(name).click()); }
async function email(value: string) { await act(async () => { const field = container.querySelector<HTMLInputElement>("#staff-email")!; Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(field, value); field.dispatchEvent(new Event("input", { bubbles: true })); }); }
async function prepare(value = " NEW@example.invalid ") { await email(value); await act(async () => container.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }))); }
function deferred<T>() { let resolve!: (value: T) => void; const promise = new Promise<T>(r => { resolve = r; }); return { promise, resolve }; }

test("owner sees active/invited states and owner protection without automatic writes", async () => {
  await show(); expect(container.textContent).toContain("Active · signed in"); expect(container.textContent).toContain("Invited · awaiting"); expect(container.textContent).toContain("Owner · access protected"); expect(container.querySelectorAll("li button")).toHaveLength(2); expect(api.add).not.toHaveBeenCalled(); expect(api.remove).not.toHaveBeenCalled();
});
test("real, staff and unlinked screens request no roster or writes", async () => {
  api.mock = false; await show(); expect(container.textContent).toContain("not available yet"); expect(api.read).not.toHaveBeenCalled(); expect(container.querySelector("input")).toBeNull();
  api.mock = true; api.profile!.membership_role = "staff"; await show(); expect(container.textContent).toContain("Only the owner"); expect(api.read).not.toHaveBeenCalled();
  api.profile = null; await show(); expect(container.textContent).toBe("");
});
test("grant confirmation uses the canonical Google email and only one explicit write", async () => {
  await show(); await prepare(); expect(api.add).not.toHaveBeenCalled(); expect(container.textContent).toContain("Give this person staff access?"); expect(document.activeElement?.textContent).toContain("Give this person");
  await click("Keep current access"); expect(api.add).not.toHaveBeenCalled(); expect(document.activeElement).toBe(container.querySelector("#staff-email"));
  await prepare(); api.read.mockResolvedValue([owner, active, invited, added]); await click("Confirm staff access");
  expect(api.add).toHaveBeenCalledExactlyOnceWith({ business_id: "b1", email: added.email }); expect(container.textContent).toContain("Grove sends no email"); expect(container.querySelectorAll("li")).toHaveLength(4);
});
test("invalid and duplicate emails never grant access or change an existing active user", async () => {
  await show(); await prepare("bad input"); expect(container.textContent).toContain("Enter the email");
  for (const member of [owner, active, invited]) { await prepare(` ${member.email.toUpperCase()} `); expect(container.textContent).toContain("already"); }
  expect(api.add).not.toHaveBeenCalled(); expect(container.querySelector("h3")).toBeNull();
});
test("active removal and invitation cancellation both require confirmation and refresh canonical roster", async () => {
  await show(); await click("Remove staff"); expect(api.remove).not.toHaveBeenCalled(); await click("Keep current access"); expect(api.remove).not.toHaveBeenCalled();
  await click("Remove staff"); api.read.mockResolvedValue([owner, invited]); await click("Confirm removal"); expect(api.remove).toHaveBeenCalledWith({ business_id: "b1", email: active.email }); expect(container.textContent).toContain("staff access removed");
  await click("Cancel invitation"); expect(container.textContent).toContain("Cancel this invitation?"); api.remove.mockResolvedValue({ ok: true, email: invited.email }); api.read.mockResolvedValue([owner]); await click("Confirm removal"); expect(container.textContent).toContain("invitation cancelled"); expect(container.textContent).toContain("No staff added yet");
});
test("an in-flight grant is single flight even before React paints disabled controls", async () => {
  const wait = deferred<{ ok: true; member: StaffMember }>(); api.add.mockReturnValue(wait.promise); await show(); await prepare();
  await act(async () => { const confirm = button("Confirm staff access"); confirm.click(); confirm.click(); }); expect(api.add).toHaveBeenCalledTimes(1);
  await act(async () => wait.resolve({ ok: true, member: added }));
});
test("transport and mismatched success stay uncertain, with refresh and explicit acknowledgement before another write", async () => {
  await show(); await prepare(); api.add.mockRejectedValueOnce(new Error("offline")); await click("Confirm staff access"); expect(container.textContent).toContain("may have changed"); expect(button("Add staff").disabled).toBe(true); expect(button("I’ve checked — continue").disabled).toBe(true);
  await click("Refresh staff"); expect(button("Add staff").disabled).toBe(true); await click("I’ve checked — continue"); expect(button("Add staff").disabled).toBe(false); expect(api.add).toHaveBeenCalledTimes(1);
  await prepare(); api.add.mockResolvedValue({ ok: true, member: { ...added, business_id: "other" } }); await click("Confirm staff access"); expect(container.textContent).toContain("unconfirmed"); expect(container.textContent).not.toContain("new@example.invalid is invited");
});
test("lost write access clears the roster and locks actions until business reload", async () => {
  await show(); await prepare(); api.add.mockResolvedValue({ ok: false, error: "NOT_OWNER" }); await click("Confirm staff access");
  expect(container.querySelector("ul")).toBeNull(); expect(button("Add staff").disabled).toBe(true); await click("Reload business"); expect(api.refresh).toHaveBeenCalledTimes(1);
});
test("loading, failed, malformed and denied reads never become a fake empty staff list", async () => {
  api.read.mockRejectedValue(new Error("offline")); await show(); expect(container.textContent).toContain("Could not load staff"); expect(container.textContent).not.toContain("No staff added"); expect(button("Add staff").disabled).toBe(true);
  api.read.mockResolvedValue([{ ...active, business_id: "other" }]); await click("Refresh staff"); expect(container.querySelector("ul")).toBeNull();
  api.read.mockRejectedValue(new BusinessAccessError("NOT_MEMBER")); await click("Refresh staff"); expect(button("Refresh staff").disabled).toBe(true); expect(container.textContent).toContain("access has changed");
});
test("a late roster read cannot overwrite a newer refresh", async () => {
  const stale = deferred<StaffMember[]>(); api.read.mockReturnValueOnce(stale.promise); await show();
  // Simulate leaving and resuming while the initial list request is pending.
  await show("hidden"); api.read.mockResolvedValue([owner]); await show();
  expect(container.textContent).toContain("No staff added yet"); await act(async () => stale.resolve([owner, active])); expect(container.textContent).not.toContain(active.email);
});
test("hiding during a write locks retry and discards late receipts after returning", async () => {
  const wait = deferred<{ ok: true; member: StaffMember }>(); api.add.mockReturnValue(wait.promise); await show(); await prepare(); await click("Confirm staff access");
  await show("hidden"); await show(); expect(container.textContent).toContain("previous change is unconfirmed"); expect(button("Add staff").disabled).toBe(true);
  expect(button("Refresh staff").disabled).toBe(true); expect(button("I’ve checked — continue").disabled).toBe(true);
  await act(async () => wait.resolve({ ok: true, member: added })); expect(container.textContent).not.toContain("new@example.invalid is invited"); expect(api.add).toHaveBeenCalledTimes(1);
  expect(button("Refresh staff").disabled).toBe(false); await click("Refresh staff"); await click("I’ve checked — continue"); expect(button("Add staff").disabled).toBe(false);
});
test("tab hiding cancels confirmation, clears draft, and resumes with a fresh read", async () => {
  await show(); await prepare();
  vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden"); await act(async () => document.dispatchEvent(new Event("visibilitychange"))); expect(container.querySelector("h3")).toBeNull();
  vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible"); await act(async () => document.dispatchEvent(new Event("visibilitychange"))); expect(container.querySelector<HTMLInputElement>("input")!.value).toBe(""); expect(api.add).not.toHaveBeenCalled(); expect(api.read).toHaveBeenCalledTimes(2);
});
