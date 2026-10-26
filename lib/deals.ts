import { mockDeals } from "@/lib/mocks/deals";

export type Deal = {
  id: string;
  title: string;
  restaurant: string;
  discount: string;
  expiresAt: string; // ISO date
};

// Swap the body of these two for Supabase queries later on 
export async function getDeals(): Promise<Deal[]> {
  return mockDeals;
}

export async function getDeal(id: string): Promise<Deal | null> {
  return mockDeals.find((d) => d.id === id) ?? null;
}