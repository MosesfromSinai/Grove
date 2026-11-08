import type { StaffMember } from "./types";

// Google Workspace addresses are valid too. Do not rewrite dots or plus tags.
export function staffEmail(value: string): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.split("@")[0].length > 64) return null;
  return email;
}

export function validStaff(member: StaffMember, businessId: string): boolean {
  return !!member && member.business_id === businessId && staffEmail(member.email) === member.email
    && (member.role === "owner" || member.role === "staff")
    && (member.user_id === null || (typeof member.user_id === "string" && member.user_id.length > 0))
    && member.status === (member.user_id ? "active" : "invited");
}
