import type { DealStatus } from "./types";

// Same rule as the deal_status SQL function: live while starts_at <= now < ends_at.
export function dealStatus(startsAt: string, endsAt: string, now: Date = new Date()): DealStatus {
  const t = now.getTime();
  if (t < new Date(startsAt).getTime()) return "scheduled";
  if (t < new Date(endsAt).getTime()) return "live";
  return "ended";
}
