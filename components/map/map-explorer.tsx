"use client";

import { useEffect, useState } from "react";
import {
  Footprints,
  LocateFixed,
  MapPin,
  SlidersHorizontal,
  Store,
  Tag,
  Truck,
} from "lucide-react";
import { getDealsNearby, UCR_CENTER } from "@/mocks";
import {
  formatDistance,
  groupNearbyBusinesses,
  NEARBY_RADIUS_M,
  WALKING_RADIUS_M,
  type MapBusiness,
} from "@/lib/geo/nearby";
import { useLocation } from "@/lib/geo/use-location";
import { NearbyMap } from "./nearby-map";

const locationMessages = {
  campus:
    "Explore around UC Riverside, or use your location to find food near you.",
  locating: "Finding your location…",
  located: "Distances are measured from your location.",
  denied:
    "Location is off. Showing UC Riverside instead. You can allow location in your browser settings.",
  unavailable: "Your location is unavailable. Showing UC Riverside instead.",
  timeout:
    "Location took too long. Showing UC Riverside instead. You can try again.",
};

export function MapExplorer() {
  const location = useLocation(UCR_CENTER);
  const [filters, setFilters] = useState({
    openNow: false,
    hasDeals: false,
    walking: false,
  });
  const [result, setResult] = useState<{
    businesses: MapBusiness[];
    loading: boolean;
    error: boolean;
  }>({ businesses: [], loading: true, error: false });
  const [retry, setRetry] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const radiusM = filters.walking ? WALKING_RADIUS_M : NEARBY_RADIUS_M;
  const { lat, lng } = location.coordinates;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setResult({ businesses: [], loading: true, error: false });
      try {
        const rows = await getDealsNearby({
          lat,
          lng,
          radiusM,
          openNow: filters.openNow,
          hasDeals: filters.hasDeals,
        });
        if (!cancelled)
          setResult({
            businesses: groupNearbyBusinesses(rows),
            loading: false,
            error: false,
          });
      } catch {
        if (!cancelled)
          setResult({ businesses: [], loading: false, error: true });
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [lat, lng, radiusM, filters.openNow, filters.hasDeals, retry]);

  const chips = [
    { key: "openNow", label: "Open now", Icon: Store },
    { key: "hasDeals", label: "Has deals", Icon: Tag },
    { key: "walking", label: "Walking distance", Icon: Footprints },
  ] as const;
  const selected = result.businesses.find(
    (business) => business.id === selectedId,
  );

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-8 sm:py-10">
      <header className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="mb-1 flex items-center gap-1.5 text-sm font-bold text-green-dark">
            <MapPin size={16} aria-hidden="true" /> UC Riverside
          </p>
          <h1 className="text-3xl sm:text-4xl">Find your next bite</h1>
        </div>
        <span className="rounded-pill bg-peach px-3 py-2 text-xs font-bold text-brown">
          Sample spots
        </span>
      </header>

      <section
        aria-label="Location"
        className="mb-5 rounded-card border bg-surface p-4 shadow-card"
      >
        <p role="status" className="text-sm text-ink-muted">
          {locationMessages[location.status]}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={location.status === "locating"}
            onClick={location.locate}
            className="flex min-h-11 items-center gap-2 rounded-button bg-green px-4 text-sm font-bold text-white hover:bg-green-dark focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60"
          >
            <LocateFixed size={18} aria-hidden="true" />
            {location.status === "locating" ? "Locating…" : "Use my location"}
          </button>
          {location.status === "located" && (
            <button
              type="button"
              onClick={location.useCampus}
              className="min-h-11 rounded-button border px-4 text-sm font-bold text-green-dark"
            >
              Back to campus
            </button>
          )}
        </div>
      </section>

      <div
        className="mb-3 flex flex-wrap gap-2"
        role="group"
        aria-label="Filter places"
      >
        {chips.map(({ key, label, Icon }) => (
          <button
            key={key}
            type="button"
            aria-pressed={filters[key]}
            onClick={() =>
              setFilters((previous) => ({ ...previous, [key]: !previous[key] }))
            }
            className={`flex min-h-11 items-center gap-2 rounded-pill border px-4 text-sm font-bold focus-visible:outline-2 focus-visible:outline-offset-2 ${filters[key] ? "border-green bg-green-tint text-green-dark" : "bg-surface text-ink-muted hover:border-green"}`}
          >
            <Icon size={16} aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>
      <p className="mb-4 text-xs text-ink-fine">
        {filters.walking
          ? "Within 800 m in a straight line; walking routes may be longer."
          : "Within 3 km."}{" "}
        Distances from {location.status === "located" ? "you" : "campus center"}
        .
      </p>

      <NearbyMap
        center={location.coordinates}
        businesses={result.businesses}
        selectedId={selected?.id ?? null}
        onSelect={setSelectedId}
      />
      <div
        className="mt-3 flex flex-wrap gap-4 text-xs text-ink-muted"
        aria-label="Pin colors"
      >
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-orange" />
          Live deal
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-green" />
          No live deal
        </span>
      </div>

      <section
        className="mt-7"
        aria-label="Nearby places"
        aria-busy={result.loading}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl">
            Around {location.status === "located" ? "you" : "campus"}
          </h2>
          <p role="status" className="text-sm text-ink-muted">
            {result.loading
              ? "Finding spots…"
              : `${result.businesses.length} spots`}
          </p>
        </div>
        {result.error ? (
          <div role="alert" className="rounded-card border bg-surface p-5">
            <p>We couldn’t load nearby places.</p>
            <button
              type="button"
              onClick={() => setRetry((value) => value + 1)}
              className="mt-2 min-h-11 font-bold text-green-dark underline"
            >
              Try again
            </button>
          </div>
        ) : !result.loading && result.businesses.length === 0 ? (
          <div className="rounded-card border bg-surface p-6 text-center">
            <SlidersHorizontal
              className="mx-auto mb-2 text-green"
              aria-hidden="true"
            />
            <h3 className="text-lg">No spots match right now</h3>
            <p className="mt-1 text-sm text-ink-muted">
              Try fewer filters
              {location.status === "located" ? " or explore around campus" : ""}
              .
            </p>
            <button
              type="button"
              onClick={() =>
                setFilters({ openNow: false, hasDeals: false, walking: false })
              }
              className="mt-3 min-h-11 px-4 font-bold text-green-dark underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {result.businesses.map((business) => (
              <li key={business.id}>
                <button
                  type="button"
                  aria-pressed={business.id === selected?.id}
                  onClick={() => setSelectedId(business.id)}
                  className={`flex h-full min-h-24 w-full items-start gap-3 rounded-card border bg-surface p-4 text-left shadow-card focus-visible:outline-2 focus-visible:outline-offset-2 ${business.id === selected?.id ? "border-green ring-1 ring-green" : "hover:border-border-strong"}`}
                >
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-button ${business.deals.length ? "bg-peach text-brown" : "bg-green-tint text-green-dark"}`}
                  >
                    {business.isTruck ? (
                      <Truck size={22} aria-hidden="true" />
                    ) : (
                      <Store size={22} aria-hidden="true" />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-bold">{business.name}</span>
                    <span className="mt-1 block text-xs text-ink-muted">
                      {business.openNow ? "Open now" : "Closed"} ·{" "}
                      {formatDistance(business.distanceM)}
                    </span>
                    <span
                      className={`mt-2 block text-sm ${business.deals.length ? "font-semibold text-brown" : "text-ink-fine"}`}
                    >
                      {business.deals[0]?.title ?? "No deals right now"}
                      {business.deals.length > 1
                        ? ` (+${business.deals.length - 1} more)`
                        : ""}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
      <p className="mt-6 text-center text-xs text-ink-fine">
        Sample places and deals for the Week 1 preview.
      </p>
    </main>
  );
}
