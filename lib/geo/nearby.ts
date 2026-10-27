import type { DealCard } from "@/lib/supabase/types";

export type Coordinates = { lat: number; lng: number };
export type MapBusiness = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  distanceM: number;
  openNow: boolean;
  isTruck: boolean;
  deals: Extract<DealCard, { has_deal: true }>[];
};

export const NEARBY_RADIUS_M = 3_000;
// Straight-line proximity, not a walking route or an estimated travel time.
export const WALKING_RADIUS_M = 800;

export function groupNearbyBusinesses(rows: DealCard[]): MapBusiness[] {
  const businesses = new Map<string, MapBusiness>();
  for (const row of rows) {
    let business = businesses.get(row.business_id);
    if (!business) {
      business = {
        id: row.business_id,
        name: row.business_name,
        lat: row.lat,
        lng: row.lng,
        distanceM: row.distance_m,
        openNow: row.open_now,
        isTruck: row.is_truck,
        deals: [],
      };
      businesses.set(row.business_id, business);
    }
    if (row.has_deal) business.deals.push(row);
  }
  return [...businesses.values()].sort((a, b) => a.distanceM - b.distanceM);
}

export function formatDistance(metres: number): string {
  return metres < 1_000
    ? `${Math.round(metres)} m`
    : `${(metres / 1_000).toFixed(1)} km`;
}
