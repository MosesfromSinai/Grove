"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Coordinates } from "./nearby";

type LocationState = {
  coordinates: Coordinates;
  status:
    "campus" | "locating" | "located" | "denied" | "unavailable" | "timeout";
};

export function useLocation(campus: Coordinates) {
  const [location, setLocation] = useState<LocationState>({
    coordinates: campus,
    status: "campus",
  });
  const requestId = useRef(0);
  useEffect(
    () => () => {
      requestId.current += 1;
    },
    [],
  );

  const useCampus = useCallback(() => {
    requestId.current += 1;
    setLocation({ coordinates: campus, status: "campus" });
  }, [campus]);

  const locate = useCallback(() => {
    const currentRequest = ++requestId.current;
    if (!window.isSecureContext || !navigator.geolocation) {
      setLocation({ coordinates: campus, status: "unavailable" });
      return;
    }
    setLocation((previous) => ({ ...previous, status: "locating" }));
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (currentRequest !== requestId.current) return;
        setLocation({
          coordinates: { lat: coords.latitude, lng: coords.longitude },
          status: "located",
        });
      },
      (error) => {
        if (currentRequest !== requestId.current) return;
        setLocation({
          coordinates: campus,
          status:
            error.code === 1
              ? "denied"
              : error.code === 3
                ? "timeout"
                : "unavailable",
        });
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  }, [campus]);

  return { ...location, locate, useCampus };
}
