"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { redeem } from "@/lib/supabase";
import type { ErrorCode, Redemption } from "@/lib/supabase";
import { errorMessages } from "./error-messages";
import { RedeemedView } from "./redeemed-view";

type Phase = "locating" | "denied" | "scanning" | "redeeming" | "done" | "error" | "failed" | "camera-error";

function parseSlug(text: string): string | null {
  const match = text.match(/\/b\/([^/?#]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function PinLink({ dealId }: { dealId: string }) {
  return (
    <Link
      href={`/pin?deal=${dealId}`}
      className="mt-6 flex min-h-11 items-center justify-center font-bold text-orange-light underline"
    >
      No location? Ask staff for the store PIN.
    </Link>
  );
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
            try {
              const result = await redeem({ deal_id: dealId, qr_slug: slug, lat: position.lat, lng: position.lng });
              if (result.ok) {
                setRedemption(result.redemption);
                setPhase("done");
              } else {
                setError(result.error);
                setPhase("error");
              }
            } catch {
              // Network or server failure: no ErrorCode, so never leave "Checking your visit…" up.
              setPhase("failed");
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
    // Dark full-screen scanner, like canvas screen 6.
    <div className="-mx-4 -mt-4 flex min-h-[calc(100dvh-6rem)] flex-col bg-ink px-5 pt-5 pb-8 text-white">
      <div className="flex items-center justify-between gap-3">
        <Link href={`/deals/${dealId}`} aria-label="Close scanner" className="flex size-11 items-center justify-center rounded-full bg-white/10">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
        </Link>
        <span className="rounded-pill bg-white/10 px-4 py-1.5 text-xs font-extrabold tracking-widest text-white/80">REDEEMING</span>
        <span className="size-11" aria-hidden="true" />
      </div>
      {position && (
        <p className="mx-auto mt-6 flex items-center gap-2 rounded-pill bg-green px-4 py-2 text-sm font-bold">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>
          Location on
        </p>
      )}

      {phase === "locating" && <p role="status" className="mt-10 text-center text-white/80">Checking your location…</p>}

      {phase === "scanning" && (
        <>
          <div className="relative mx-auto mt-6 w-full max-w-xs rounded-card p-2 [box-shadow:inset_0_0_0_3px_var(--color-orange)]">
            <div id="qr-reader" className="overflow-hidden rounded-button" />
          </div>
          {notSticker && <p role="status" className="mt-3 text-center text-sm font-semibold text-orange-light">That isn&apos;t a Grove sticker.</p>}
        </>
      )}
      <h1 className="mt-8 text-center text-3xl text-white">Scan the Grove code at the counter.</h1>
      <p className="mt-2 text-center text-white/80">Hold steady. It scans on its own.</p>

      {phase === "redeeming" && <p role="status" className="mt-6 text-center text-white/80">Checking your visit…</p>}

      {phase === "denied" && (
        <div>
          <p role="alert" className="mt-6 text-center text-white">{errorMessages.LOCATION_REQUIRED}</p>
          <button onClick={retry} className="mx-auto mt-4 flex min-h-11 items-center rounded-button bg-surface px-6 font-semibold text-ink">
            Try again
          </button>
          <PinLink dealId={dealId} />
        </div>
      )}

      {phase === "camera-error" && (
        <div>
          <p role="alert" className="mt-6 text-center text-white">We couldn&apos;t open your camera. Allow camera access in your browser settings and try again.</p>
          <button onClick={retry} className="mx-auto mt-4 flex min-h-11 items-center rounded-button bg-surface px-6 font-semibold text-ink">
            Try again
          </button>
          <PinLink dealId={dealId} />
        </div>
      )}

      {phase === "failed" && (
        <div>
          <p role="alert" className="mt-6 text-center text-white">Something went wrong checking your visit. Check your connection and try again.</p>
          <button onClick={retry} className="mx-auto mt-4 flex min-h-11 items-center rounded-button bg-surface px-6 font-semibold text-ink">
            Try again
          </button>
        </div>
      )}

      {phase === "error" && error && (
        <div>
          <p role="alert" className="mt-6 text-center text-white">{errorMessages[error]}</p>
          <button onClick={retry} className="mx-auto mt-4 flex min-h-11 items-center rounded-button bg-surface px-6 font-semibold text-ink">
            Try again
          </button>
          {(error === "TOO_FAR" || error === "LOCATION_REQUIRED") && <PinLink dealId={dealId} />}
        </div>
      )}
    </div>
  );
}