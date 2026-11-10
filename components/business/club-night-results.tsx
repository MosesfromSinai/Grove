"use client";

// Club night results (#114): claimed club and verified visits per posted night, from getClubNights.
import { CalendarDays, Users } from "lucide-react";
import type { ClubNight } from "@/lib/supabase";

const pill: Record<ClubNight["status"], string> = {
  open: "bg-green-tint text-green-dark",
  claimed: "bg-peach text-brown",
  expired: "bg-border text-ink-muted",
};
const label: Record<ClubNight["status"], string> = { open: "Open", claimed: "Claimed", expired: "Expired" };

export function ClubNightResults({ nights, schedule, onCancel, busy }: {
  nights: ClubNight[];
  schedule: (night: ClubNight) => string;
  onCancel: (night: ClubNight) => void;
  busy: boolean;
}) {
  return (
    <ul className="mt-4 divide-y divide-border-soft">
      {nights.map((night) => (
        <li key={night.id} className="flex flex-wrap items-start justify-between gap-4 py-4">
          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-center gap-2 text-sm font-bold">
              <CalendarDays aria-hidden="true" className="size-4 shrink-0 text-green" />{schedule(night)}
              <span className={`rounded-pill px-2.5 py-0.5 text-xs font-bold ${pill[night.status]}`}>{label[night.status]}</span>
            </p>
            <p className="mt-2 whitespace-pre-line text-sm text-ink-muted [overflow-wrap:anywhere]">{night.giveback}</p>
            {night.claimed_club_name && (
              <p className="mt-2 flex items-center gap-1.5 text-sm">
                <Users aria-hidden="true" className="size-4 text-green" />
                <b className="[overflow-wrap:anywhere]">{night.claimed_club_name}</b>
                <span className="text-ink-muted">· <b className="tabular-nums text-ink">{night.visit_count}</b> verified {night.visit_count === 1 ? "visit" : "visits"}</span>
              </p>
            )}
          </div>
          {night.status === "open" && (
            <button type="button" disabled={busy} onClick={() => onCancel(night)}
              className="min-h-11 rounded-button border border-border-strong bg-surface px-4 text-sm font-bold disabled:opacity-50">
              Cancel
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
