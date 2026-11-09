"use client";

// After a claim: the link-only deal's link and QR for the club to share with members.
// The link only shows the deal; members still redeem in the restaurant with the sticker.
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Claimed } from "./club-nights";
import { nightDateLabel, timeWindowLabel } from "./format";

export function ClubNightClaimed({ claimed }: { claimed: Claimed }) {
  const { night, club, dealId } = claimed;
  const [url, setUrl] = useState("");
  const [qr, setQr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const link = `${window.location.origin}/deals/${dealId}`;
    let cancelled = false;
    import("qrcode")
      .then((QRCode) => QRCode.toDataURL(link, { margin: 2, width: 480, errorCorrectionLevel: "M" }))
      .then((png) => !cancelled && setQr(png))
      .catch(() => {}); // the link still works without the QR image
    queueMicrotask(() => !cancelled && setUrl(link));
    return () => {
      cancelled = true;
    };
  }, [dealId]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  const canShare = typeof navigator !== "undefined" && "share" in navigator;
  const title = `${club} night at ${night.business_name}`;

  return (
    <div>
      <p className="text-sm font-semibold text-green-dark">Claimed</p>
      <h1 className="mt-1 text-3xl">{title}</h1>
      <p className="mt-1 text-sm text-ink-muted">
        {nightDateLabel(night.night_date)} · {timeWindowLabel(night.start_time, night.end_time)} · {night.giveback}
      </p>

      <div className="mt-6 rounded-card border border-border bg-surface p-5 shadow-card">
        <p className="text-sm text-ink-muted">Share this link with your members</p>
        <p className="mt-1 break-all font-semibold">{url}</p>
        <div className="mt-4 flex gap-3">
          <button onClick={copy} className="min-h-11 flex-1 rounded-button bg-ink px-4 font-semibold text-white">
            {copied ? "Copied" : "Copy link"}
          </button>
          {canShare && (
            <button
              onClick={() => navigator.share({ title, url }).catch(() => {})}
              className="min-h-11 flex-1 rounded-button border border-border-strong px-4 font-semibold"
            >
              Share
            </button>
          )}
        </div>
        {qr && (
          <div className="mt-5 flex flex-col items-center">
            {/* eslint-disable-next-line @next/next/no-img-element -- generated data URL */}
            <img src={qr} alt={`QR code for ${title}`} className="h-56 w-56" />
            <a href={qr} download={`${club}-night-qr.png`} className="mt-2 flex min-h-11 items-center font-semibold text-green-dark underline">
              Download QR
            </a>
          </div>
        )}
      </div>

      <p className="mt-4 text-sm text-ink-muted">
        Members open this link and redeem in the restaurant like any deal. Each visit counts for your club.
      </p>
      <Link href={`/deals/${dealId}`} className="mt-6 inline-flex min-h-11 items-center rounded-button bg-orange px-6 font-bold text-ink">
        Open the deal
      </Link>
    </div>
  );
}
