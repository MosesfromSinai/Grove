"use client";

// Claim a club night (#110). Lists open nights; a student claims one for their club by typing
// the club name, then shares the link-only deal it creates with members.
import { useCallback, useEffect, useState } from "react";
import { claimClubNight, getOpenClubNights, type ErrorCode, type OpenClubNight } from "@/lib/supabase";
import { errorMessages } from "./error-messages";
import { nightDateLabel, timeWindowLabel } from "./format";

export type Claimed = { night: OpenClubNight; club: string; dealId: string };

function ClaimForm({ night, onClaimed, onGone }: { night: OpenClubNight; onClaimed: (c: Claimed) => void; onGone: (error: ErrorCode) => void }) {
  const [club, setClub] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ErrorCode | null>(null);
  const [failed, setFailed] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const name = club.trim();
    if (!name || busy) return;
    setBusy(true);
    setError(null);
    setFailed(false);
    try {
      const result = await claimClubNight({ club_night_id: night.id, club_name: name });
      if (result.ok) return onClaimed({ night, club: name, dealId: result.deal_id });
      // A night someone else claimed (or that ended) leaves the list, so the list shows the message.
      if (result.error === "ALREADY_CLAIMED" || result.error === "CLUB_NIGHT_EXPIRED") return onGone(result.error);
      setError(result.error);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-4">
      <label htmlFor={`club-${night.id}`} className="text-sm text-ink-muted">Your club&apos;s name</label>
      <input id={`club-${night.id}`} value={club} maxLength={60} required autoComplete="off"
        onChange={(e) => setClub(e.target.value)}
        className="mt-1 block min-h-12 w-full rounded-button border border-border-strong bg-surface px-4" />
      {error && <p className="mt-3 text-sm font-semibold text-brown">{errorMessages[error]}</p>}
      {failed && <p className="mt-3 text-sm font-semibold text-brown">Couldn&apos;t claim this night. Check your connection and try again.</p>}
      <button type="submit" disabled={busy || !club.trim()}
        className="mt-3 min-h-12 w-full rounded-button bg-orange px-6 font-bold text-ink disabled:opacity-50">
        {busy ? "Claiming…" : "Claim night"}
      </button>
      <p className="mt-2 text-xs text-ink-fine">The restaurant pays the giveback to your club directly, outside Grove.</p>
    </form>
  );
}

export function ClubNights() {
  const [nights, setNights] = useState<OpenClubNight[] | undefined>(undefined); // undefined = loading
  const [failed, setFailed] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [, setClaimed] = useState<Claimed | null>(null);

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
      {notice && <p role="alert" className="mt-4 rounded-button bg-peach px-4 py-3 text-sm text-brown">{notice}</p>}
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
              {openId === night.id ? (
                <ClaimForm night={night} onClaimed={setClaimed}
                  onGone={(error) => (setOpenId(null), setNotice(errorMessages[error]), load())} />
              ) : (
                <button onClick={() => (setOpenId(night.id), setNotice(null))}
                  className="mt-4 block min-h-11 w-full rounded-button bg-ink px-6 font-semibold text-white">
                  Claim for my club
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
