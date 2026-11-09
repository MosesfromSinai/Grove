"use client";

// Claim a club night (#110). Lists open nights; a student claims one for their club by typing
// the club name, then shares the link-only deal it creates with members.
import { useCallback, useEffect, useState } from "react";
import { getOpenClubNights, type OpenClubNight } from "@/lib/supabase";
import { nightDateLabel, timeWindowLabel } from "./format";

export function ClubNights() {
  const [nights, setNights] = useState<OpenClubNight[] | undefined>(undefined); // undefined = loading
  const [failed, setFailed] = useState(false);

  const load = useCallback(() => {
    let cancelled = false;
    getOpenClubNights()
      .then((n) => !cancelled && (setNights(n), setFailed(false)))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(load, [load]);

  if (failed) {
    return <p className="py-10 text-center text-ink-muted">Couldn&apos;t load club nights. Check your connection and try again.</p>;
  }
  if (nights === undefined) return <p className="py-10 text-center text-ink-muted">Loading club nights…</p>;

  return (
    <div>
      <h1 className="text-3xl">Club nights</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Claim a night for your club. Members visit with Grove, and the restaurant gives part of the sales back to your club.
      </p>
      {nights.length === 0 ? (
        <p className="py-10 text-center text-ink-muted">No open club nights right now. Check back soon.</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {nights.map((night) => (
            <li key={night.id} className="rounded-card border border-border bg-surface p-5 shadow-card">
              <h2 className="text-xl">{night.business_name}</h2>
              <p className="mt-1 text-sm text-ink-muted">
                {nightDateLabel(night.night_date)} · {timeWindowLabel(night.start_time, night.end_time)}
              </p>
              <span className="mt-3 inline-block rounded-pill bg-peach px-3 py-1 text-sm font-semibold text-brown">
                {night.giveback}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
