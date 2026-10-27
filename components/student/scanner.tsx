"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { redeem } from "@/lib/supabase";
import type { ErrorCode, Redemption } from "@/lib/supabase";
import { errorMessages } from "./error-messages";
import { RedeemedView } from "./redeemed-view";

type Phase = "locating" | "denied" | "scanning" | "redeeming" | "done" | "error" | "camera-error";

function parseSlug(text: string): string | null {
  const match = text.match(/\/b\/([^/?#]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function Scanner() {
  const dealId = useSearchParams().get("deal");
  const [phase, setPhase] = useState<Phase>("locating");
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<ErrorCode | null>(null);
  const [redemption, setRedemption] = useState<Redemption | null>(null);
  const [notSticker, setNotSticker] = useState(false);

  const locate = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setTimeout(() => setPhase("denied"), 0);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setPhase("scanning");
      },
      () => setPhase("denied"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  useEffect(() => {
    locate();
  }, [locate]);

  useEffect(() => {
    if (phase !== "scanning" || !dealId || !position) return;
    let cancelled = false;
    let handled = false;
    let scanner: import("html5-qrcode").Html5Qrcode | null = null;

    (async () => {
      const { Html5Qrcode } = await import("html5-qrcode");
      if (cancelled) return;
      scanner = new Html5Qrcode("qr-reader");
      try {
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: 250 },
          async (text) => {
            if (handled) return;
            const slug = parseSlug(text);
            if (!slug) {
              setNotSticker(true);
              return;
            }
            handled = true;
            setNotSticker(false);
            setPhase("redeeming");
            const result = await redeem({ deal_id: dealId, qr_slug: slug, lat: position.lat, lng: position.lng });
            if (result.ok) {
              setRedemption(result.redemption);
              setPhase("done");
            } else {
              setError(result.error);
              setPhase("error");
            }
          },
          () => {}
        );
      } catch {
        if (!cancelled) setPhase("camera-error");
      }
    })();

    return () => {
      cancelled = true;
      scanner?.stop().then(() => scanner?.clear()).catch(() => {});
    };
  }, [phase, dealId, position]);

  if (!dealId) {
    return (
      <div className="pt-10 text-center">
        <h1 className="text-2xl">Scan the sticker</h1>
        <p className="mt-2 text-ink-muted">Open a deal and tap Redeem in store to start.</p>
        <Link href="/feed" className="mt-6 inline-flex min-h-11 items-center rounded-button bg-ink px-6 font-semibold text-white">
          Browse deals
        </Link>
      </div>
    );
  }

  if (phase === "done" && redemption) return <RedeemedView redemption={redemption} />;

  function retry() {
    setError(null);
    setNotSticker(false);
    setPhase("locating");
    locate();
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl">Scan the counter sticker</h1>

      {phase === "locating" && <p className="text-ink-muted">Checking your location…</p>}

      {phase === "scanning" && (
        <>
          <div id="qr-reader" className="overflow-hidden rounded-card" />
          <p className="mt-3 text-sm text-ink-muted">Point your camera at the Grove sticker at the counter.</p>
          {notSticker && <p className="mt-2 text-sm font-semibold text-brown">That isn&apos;t a Grove sticker.</p>}
        </>
      )}

      {phase === "redeeming" && <p className="text-ink-muted">Checking your visit…</p>}

      {phase === "denied" && (
        <div>
          <p className="text-ink">{errorMessages.LOCATION_REQUIRED}</p>
          <button onClick={retry} className="mt-4 min-h-11 rounded-button bg-ink px-6 font-semibold text-white">
            Try again
          </button>
        </div>
      )}

      {phase === "camera-error" && (
        <div>
          <p className="text-ink">We couldn&apos;t open your camera. Allow camera access in your browser settings and try again.</p>
          <button onClick={retry} className="mt-4 min-h-11 rounded-button bg-ink px-6 font-semibold text-white">
            Try again
          </button>
        </div>
      )}

      {phase === "error" && error && (
        <div>
          <p className="text-ink">{errorMessages[error]}</p>
          <button onClick={retry} className="mt-4 min-h-11 rounded-button bg-ink px-6 font-semibold text-white">
            Try again
          </button>
        </div>
      )}
    </div>
  );
}