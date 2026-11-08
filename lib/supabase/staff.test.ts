import { afterEach, expect, test } from "vitest";
import { addStaff, getStaff, removeStaff, setClient } from "./queries";
import { staffEmail } from "./staff-input";

type Result = { data: unknown; error: { code?: string; message: string } | null };
const ok = (data: unknown): Result => ({ data, error: null });
function use(results: Result[], signedIn = true) {
  const calls: { table: string; ops: [string, unknown[]][] }[] = [];
  setClient({ auth: { getUser: async () => ({ data: { user: signedIn ? { id: "owner" } : null }, error: null }) },
    from(table: string) {
      const call = { table, ops: [] as [string, unknown[]][] }; calls.push(call);
      const result = results.shift(); if (!result) throw new Error("Unexpected query");
      const chain: unknown = new Proxy({}, { get: (_, prop) => prop === "then" ? (resolve: (r: Result) => void) => Promise.resolve(result).then(resolve)
        : (...args: unknown[]) => { call.ops.push([String(prop), args]); return chain; } }); return chain;
    }, functions: { invoke: async (name: string, body: unknown) => { calls.push({ table: name, ops: [["invoke", [body]]] }); return results.shift(); } },
  } as unknown as Parameters<typeof setClient>[0]); return calls;
}
afterEach(() => setClient(null as unknown as Parameters<typeof setClient>[0]));
const input = { business_id: "b1", email: "staff@example.invalid" };
test("Google email canonicalization preserves Workspace addresses and tags, rejects malformed input before writes", async () => {
  expect(staffEmail(" Person.Name+shift@Kitchen.example ")).toBe("person.name+shift@kitchen.example");
  for (const email of ["", "a b@example.invalid", "a@@b.example", "a@example", "a".repeat(65) + "@example.invalid"]) {
    expect(staffEmail(email)).toBeNull();
    const calls = use([]); await expect(addStaff({ ...input, email })).rejects.toThrow("Invalid staff email"); await expect(removeStaff({ ...input, email })).rejects.toThrow("Invalid staff email"); expect(calls).toHaveLength(0);
  }
  const calls = use([ok({ ok: true })]); await addStaff({ ...input, email: " STAFF@example.invalid " });
  expect(calls).toEqual([{ table: "add-staff", ops: [["invoke", [{ body: input }]]] }]);
});
test("staff removal refuses signed-out/non-owner/missing targets and protects owner rows", async () => {
  const out = use([], false); expect(await removeStaff(input)).toEqual({ ok: false, error: "NOT_SIGNED_IN" }); expect(out).toHaveLength(0);
  for (const role of ["staff", null]) { const calls = use([ok(role ? { role } : null)]); expect(await removeStaff(input)).toEqual({ ok: false, error: "NOT_OWNER" }); expect(calls).toHaveLength(1); }
  for (const [target, error] of [[null, "STAFF_NOT_FOUND"], [{ role: "owner" }, "OWNER_PROTECTED"]] as const) {
    const calls = use([ok({ role: "owner" }), ok(target)]); expect(await removeStaff(input)).toEqual({ ok: false, error }); expect(calls).toHaveLength(2);
  }
});
test("only the selected staff email at the selected business is deleted, with a confirmed receipt", async () => {
  const calls = use([ok({ role: "owner" }), ok({ role: "staff" }), ok({ email: input.email })]);
  expect(await removeStaff(input)).toEqual({ ok: true, email: input.email });
  expect(calls[0].ops).toContainEqual(["eq", ["user_id", "owner"]]);
  expect(calls[2]).toEqual({ table: "business_members", ops: [["delete", []], ["eq", ["business_id", "b1"]], ["eq", ["email", input.email]], ["eq", ["role", "staff"]], ["select", ["email"]], ["maybeSingle", []]] });
});
test("removal handles concurrent disappearance/denial and rejects unconfirmed or mismatched receipts", async () => {
  for (const [receipt, expected] of [[ok(null), "STAFF_NOT_FOUND"], [{ data: null, error: { code: "42501", message: "denied" } }, "NOT_OWNER"]] as const) {
    use([ok({ role: "owner" }), ok({ role: "staff" }), receipt]); expect(await removeStaff(input)).toEqual({ ok: false, error: expected });
  }
  for (const receipt of [{ data: null, error: { message: "offline" } }, ok({ email: "other@example.invalid" })]) {
    use([ok({ role: "owner" }), ok({ role: "staff" }), receipt]); await expect(removeStaff(input)).rejects.toThrow();
  }
});
test("staff reads require membership and return only canonical fields including pending invites", async () => {
  use([], false); await expect(getStaff({ businessId: "b1" })).rejects.toMatchObject({ code: "NOT_SIGNED_IN" });
  use([ok(null)]); await expect(getStaff({ businessId: "b1" })).rejects.toMatchObject({ code: "NOT_MEMBER" });
  const row = { ...input, role: "staff", user_id: null };
  const calls = use([ok({ role: "owner" }), ok([row, { ...row, email: "active@example.invalid", user_id: "staff" }])]);
  expect((await getStaff({ businessId: "b1" })).map(m => m.status)).toEqual(["invited", "active"]);
  expect(calls[1].ops).toContainEqual(["select", ["business_id, email, user_id, role"]]); expect(calls[1].ops).toContainEqual(["eq", ["business_id", "b1"]]);
});
test("roster reads page stably and fail rather than silently truncate after a later read error", async () => {
  const page = Array.from({ length: 500 }, (_, i) => ({ ...input, email: `staff${i}@example.invalid`, role: "staff", user_id: null }));
  const calls = use([ok({ role: "owner" }), ok(page), ok([{ ...page[0], email: "last@example.invalid" }])]);
  expect(await getStaff({ businessId: "b1" })).toHaveLength(501); expect(calls[2].ops).toContainEqual(["range", [500, 999]]); expect(calls[2].ops).toContainEqual(["order", ["email", { ascending: true }]]);
  use([ok({ role: "owner" }), ok(page), { data: null, error: { message: "offline" } }]); await expect(getStaff({ businessId: "b1" })).rejects.toThrow("offline");
});
