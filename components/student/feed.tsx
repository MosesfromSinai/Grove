"use client";

import { useEffect, useState } from "react";
import { getDealsNearby } from "@/lib/supabase";
import { useLocation } from "@/lib/geo/use-location";
import { DealCard, type LiveDeal } from "./deal-card";

// UC Riverside campus center. Same value as UCR_CENTER in mocks/data.ts, which
// lib/supabase doesn't re-export. Module-level so the reference stays stable.
const CAMPUS = { lat: 33.9737, lng: -117.3281 };
const RADIUS_M = 5000;

type Result = { key: string; deals: LiveDeal[]; failed: boolean };

export function Feed() {
  const {
    coordinates,
    status,
    locate,
    useCampus: backToCampus, // aliased so the hooks lint rule doesn't mistake it for a hook
  } = useLocation(CAMPUS);
  const [result, setResult] = useState<Result | null>(null);

  const { lat, lng } = coordinates;
  const key = `${lat},${lng}`;

  useEffect(() => {
    let cancelled = false;
    getDealsNearby({ lat, lng, radiusM: RADIUS_M, hasDeals: true })
      .then((rows) => {
        if (cancelled) return;
        setResult({ key, deals: rows.filter((r): r is LiveDeal => r.has_deal), failed: false });
      })
      .catch(() => {
        if (!cancelled) setResult({ key, deals: [], failed: true });
      });
    return () => {
      cancelled = true;
    };
  }, [lat, lng, key]);

  const loading = result?.key !== key;

  const where =
    status === "located"
      ? "Showing deals near you"
      : status === "locating"
        ? "Finding you…"
        : "Showing deals near campus";

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-ink-muted">{where}</p>
        {status === "located" ? (
          <button onClick={backToCampus} className="min-h-11 rounded-pill px-4 text-sm font-semibold text-green-dark">
            Back to campus
          </button>
        ) : (
          <button
            onClick={locate}
            disabled={status === "locating"}
            className="min-h-11 rounded-pill bg-green-tint px-4 text-sm font-semibold text-green-dark disabled:opacity-50"
          >
            Use my location
          </button>
        )}
      </div>

      {(status === "denied" || status === "unavailable" || status === "timeout") && (
        <p className="mb-4 rounded-button bg-peach px-4 py-3 text-sm text-brown">
          We couldn&apos;t get your location, so you&apos;re seeing deals near campus. Allow location in your browser to see
          what&apos;s closest.
        </p>
      )}

      {loading ? (
        <p className="py-10 text-center text-ink-muted">Loading deals…</p>
      ) : result?.failed ? (
        <p className="py-10 text-center text-ink-muted">Couldn&apos;t load deals. Check your connection and try again.</p>
      ) : result && result.deals.length === 0 ? (
        <p className="py-10 text-center text-ink-muted">No deals right now. Check back soon.</p>
      ) : (
        <ul className="space-y-4">
          {result?.deals.map((deal) => (
            <DealCard key={deal.deal_id} deal={deal} />
          ))}
        </ul>
      )}
    </div>
  );
}