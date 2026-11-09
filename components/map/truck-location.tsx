"use client";

import { useEffect, useRef, useState } from "react";
import { LocateFixed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateTruckLocation } from "@/lib/supabase/business";

const messages = {
  NOT_SIGNED_IN: "Sign in again to update your truck’s location.",
  NOT_OWNER: "Only this truck’s owner can move its pin.",
  NOT_A_TRUCK: "Location updates are only available for food trucks.",
  INVALID_LOCATION: "Your browser returned an invalid location. Try again.",
};

// The dashboard renders this only for food trucks and passes the business id;
// onMoved lets it refresh its own copy of the pin.
type Props = {
  businessId: string;
  onMoved?: (location: { lat: number; lng: number }) => void;
};

export function TruckLocation({ businessId, onMoved }: Props) {
  const [status, setStatus] = useState<
    "idle" | "locating" | "saving" | "saved" | "error"
  >("idle");
  const [error, setError] = useState("");
  const request = useRef(0);
  useEffect(
    () => () => {
      request.current += 1;
    },
    [businessId],
  );
  const busy = status === "locating" || status === "saving";
  const sample = process.env.NEXT_PUBLIC_DATA_SOURCE !== "supabase";

  function locate() {
    const current = ++request.current;
    if (!window.isSecureContext || !navigator.geolocation) {
      setStatus("error");
      setError(
        "Location needs HTTPS and a supported browser. Your pin hasn’t moved.",
      );
      return;
    }
    setError("");
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        if (current !== request.current) return;
        setStatus("saving");
        try {
          const result = await updateTruckLocation({
            business_id: businessId,
            lat: coords.latitude,
            lng: coords.longitude,
          });
          if (current !== request.current) return;
          if (!result.ok) {
            setStatus("error");
            setError(messages[result.error]);
            return;
          }
          onMoved?.({ lat: result.location.lat, lng: result.location.lng });
          setStatus("saved");
        } catch {
          if (current !== request.current) return;
          setStatus("error");
          setError(
            "We couldn’t save your location. Your pin hasn’t moved. Try again.",
          );
        }
      },
      (failure) => {
        if (current !== request.current) return;
        setStatus("error");
        setError(
          failure.code === 1
            ? "Location is off. Allow location for Grove in your browser settings, then try again. Your pin hasn’t moved."
            : "We couldn’t find your location. Your pin hasn’t moved. Try again outdoors.",
        );
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 },
    );
  }

  return (
    <section
      aria-labelledby="truck-location-title"
      className="mb-6 rounded-card border bg-surface-dashboard p-5 shadow-card"
    >
      <h2 id="truck-location-title" className="text-xl">
        Where’s your truck today?
      </h2>
      <p className="mt-2 text-sm text-ink-muted">
        Move your truck’s map pin to your current location. Your address and
        hours stay the same.
      </p>
      <Button type="button" onClick={locate} disabled={busy} className="mt-4">
        <LocateFixed aria-hidden="true" size={18} />
        {status === "locating"
          ? "Finding you…"
          : status === "saving"
            ? "Moving pin…"
            : "I’m here now"}
      </Button>
      {status === "saved" && (
        <p role="status" className="mt-3 text-sm font-semibold text-green-dark">
          {sample
            ? "Sample pin moved for this preview session."
            : "Your truck’s pin has moved. Students will see the new location when their map refreshes."}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      )}
    </section>
  );
}
