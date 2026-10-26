import { getDeal } from "@/lib/deals";

export type RedeemResult =
  | { ok: true; dealId: string }
  | { ok: false; reason: "invalid" | "expired" | "already_redeemed" };

const redeemed = new Set<string>(); // in-memory only, resets on server restart

export async function redeemDeal(code: string): Promise<RedeemResult> {
  await new Promise((r) => setTimeout(r, 500)); // fake network delay
  const deal = await getDeal(code.trim());
  if (!deal) return { ok: false, reason: "invalid" };
  if (new Date(deal.expiresAt) < new Date()) return { ok: false, reason: "expired" };
  if (redeemed.has(deal.id)) return { ok: false, reason: "already_redeemed" };
  redeemed.add(deal.id);
  return { ok: true, dealId: deal.id };
}