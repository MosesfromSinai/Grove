import type { Deal } from "@/lib/deals";

export const mockDeals: Deal[] = [
  { id: "1", title: "Free drink with any entree", restaurant: "Campus Noodle Bar", discount: "Free drink", expiresAt: "2026-11-30" },
  { id: "2", title: "20% off your order", restaurant: "Green Bowl", discount: "20% off", expiresAt: "2026-11-15" },
  { id: "3", title: "Buy one taco, get one free", restaurant: "Taco Hut", discount: "BOGO", expiresAt: "2026-12-01" },
  { id: "4", title: "Free cookie with coffee", restaurant: "Bean There", discount: "Free cookie", expiresAt: "2026-01-01" }, //for testing for expiration
];