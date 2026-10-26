"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as MapboxMap, Marker } from "mapbox-gl";
import { MapPin } from "lucide-react";
import type { Coordinates, MapBusiness } from "@/lib/geo/nearby";
import "mapbox-gl/dist/mapbox-gl.css";
import "./nearby-map.css";

type Props = {
  center: Coordinates;
  businesses: MapBusiness[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export function NearbyMap({ center, businesses, selectedId, onSelect }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MapboxMap | null>(null);
  const markerButtons = useRef(new Map<string, HTMLButtonElement>());
  const selected = useRef(selectedId);
  const initialCenter = useRef(center);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    selected.current = selectedId;
    for (const [id, button] of markerButtons.current) {
      button.setAttribute("aria-pressed", String(id === selectedId));
    }
  }, [selectedId]);

  useEffect(() => {
    if (!token || !container.current) return;
    let cancelled = false;
    let instance: MapboxMap | null = null;
    const timeout = window.setTimeout(() => {
      if (!cancelled) setFailed(true);
    }, 15_000);
    void import("mapbox-gl")
      .then(({ default: mapboxgl }) => {
        if (cancelled || !container.current) return;
        instance = new mapboxgl.Map({
          container: container.current,
          accessToken: token,
          style: "mapbox://styles/mapbox/streets-v12",
          center: [initialCenter.current.lng, initialCenter.current.lat],
          zoom: 14,
        });
        map.current = instance;
        instance.addControl(
          new mapboxgl.NavigationControl({ showCompass: false }),
          "top-right",
        );
        instance.on("load", () => {
          if (cancelled) return;
          window.clearTimeout(timeout);
          setFailed(false);
          setReady(true);
        });
        instance.on("error", () => {
          if (!cancelled) setFailed(true);
        });
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      instance?.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    if (!ready || !map.current || failed) return;
    map.current.resize();
    map.current.easeTo({
      center: [center.lng, center.lat],
      duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? 0
        : 500,
    });
  }, [center, ready, failed]);

  useEffect(() => {
    if (!ready || !map.current || failed) return;
    let cancelled = false;
    const markers: Marker[] = [];
    const buttons = markerButtons.current;
    void import("mapbox-gl").then(({ default: mapboxgl }) => {
      if (cancelled || !map.current) return;
      const origin = document.createElement("span");
      origin.className = "grove-map-origin";
      origin.setAttribute("aria-label", "Distance origin");
      markers.push(
        new mapboxgl.Marker({ element: origin })
          .setLngLat([center.lng, center.lat])
          .addTo(map.current),
      );
      for (const business of businesses) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `grove-map-pin ${business.deals.length ? "grove-map-deal" : "grove-map-regular"}`;
        button.textContent = business.deals.length ? "%" : "•";
        button.setAttribute(
          "aria-label",
          `${business.name}, ${business.deals.length ? "live deal" : "no live deal"}`,
        );
        button.setAttribute(
          "aria-pressed",
          String(business.id === selected.current),
        );
        buttons.set(business.id, button);
        button.addEventListener("click", () => onSelect(business.id));
        markers.push(
          new mapboxgl.Marker({ element: button })
            .setLngLat([business.lng, business.lat])
            .addTo(map.current),
        );
      }
    });
    return () => {
      cancelled = true;
      markers.forEach((marker) => marker.remove());
      buttons.clear();
    };
  }, [businesses, center, onSelect, ready, failed]);

  const preview = !token || failed;
  return (
    <section aria-label="Map of nearby food spots" className="grove-map-frame">
      <div ref={container} className="grove-map-canvas" hidden={preview} />
      {preview ? (
        <div className="grove-map-preview">
          <p className="grove-map-notice">
            Pin preview · Map tiles unavailable
          </p>
          <span className="grove-map-north">N ↑</span>
          <span className="grove-map-center">
            <MapPin size={20} aria-hidden="true" />
            Search center
          </span>
          {businesses.map((business) => (
            <button
              key={business.id}
              type="button"
              aria-label={`${business.name}, ${business.deals.length ? "live deal" : "no live deal"}`}
              aria-pressed={business.id === selectedId}
              onClick={() => onSelect(business.id)}
              className={`grove-map-previewPin grove-map-pin ${business.deals.length ? "grove-map-deal" : "grove-map-regular"}`}
              style={{
                left: `${50 + (business.lng - center.lng) * 1_500}%`,
                top: `${50 - (business.lat - center.lat) * 1_600}%`,
              }}
            >
              <MapPin size={20} aria-hidden="true" />
            </button>
          ))}
          <p className="grove-map-caption">
            Approximate positions. Browse all spots below.
          </p>
        </div>
      ) : (
        !ready && (
          <p className="grove-map-notice" role="status">
            Loading map…
          </p>
        )
      )}
    </section>
  );
}
