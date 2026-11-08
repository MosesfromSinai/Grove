import { beforeEach, expect, test, vi } from "vitest";
let api: typeof import("./index"); let data: typeof import("./data");
beforeEach(async () => { vi.resetModules(); api = await import("./index"); data = await import("./data"); });
test("adding a canonical invitation is idempotent and existing active staff stay active", async () => {
  const before = data.businessMembers.length;
  const input = { business_id: "biz-opt", email: " NEW+shift@Example.invalid " };
  expect(await api.addStaff(input)).toMatchObject({ ok: true, member: { email: "new+shift@example.invalid", status: "invited", user_id: null, role: "staff" } });
  await api.addStaff(input); expect(data.businessMembers).toHaveLength(before + 1);
  const active = data.businessMembers.find(m => m.role === "staff" && m.user_id)!;
  expect(await api.addStaff({ ...input, email: active.email })).toMatchObject({ ok: true, member: { status: "active", user_id: active.user_id } });
});
test("removal works for active and invited staff without altering owner, deals, PIN or visits", async () => {
  const before = JSON.stringify([data.businesses, data.deals, data.redemptions]);
  for (const member of [...data.businessMembers].filter(m => m.role === "staff")) {
    expect(await api.removeStaff(member)).toEqual({ ok: true, email: member.email });
    expect(await api.removeStaff(member)).toEqual({ ok: false, error: "STAFF_NOT_FOUND" });
  }
  expect(data.businessMembers).toHaveLength(1); expect(data.businessMembers[0].role).toBe("owner"); expect(JSON.stringify([data.businesses, data.deals, data.redemptions])).toBe(before);
  expect(await api.removeStaff(data.businessMembers[0])).toEqual({ ok: false, error: "OWNER_PROTECTED" });
});
test("other-business and malformed requests never mutate membership", async () => {
  const before = JSON.stringify(data.businessMembers);
  expect(await api.addStaff({ business_id: "other", email: "staff@example.invalid" })).toEqual({ ok: false, error: "NOT_OWNER" });
  expect(await api.removeStaff({ business_id: "other", email: data.businessMembers[1].email })).toEqual({ ok: false, error: "NOT_OWNER" });
  await expect(api.getStaff({ businessId: "other" })).rejects.toMatchObject({ code: "NOT_MEMBER" });
  await expect(api.addStaff({ business_id: "biz-opt", email: "malformed" })).rejects.toThrow(); expect(JSON.stringify(data.businessMembers)).toBe(before);
});
