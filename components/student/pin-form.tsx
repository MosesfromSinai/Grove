"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getDeal, redeemPin } from "@/lib/supabase";
import type { DealDetail, ErrorCode, Redemption } from "@/lib/supabase";
import { errorMessages } from "./error-messages";
import { RedeemedView } from "./redeemed-view";

export function PinForm() {
  const dealId = useSearchParams().get("deal");
  const [deal, setDeal] = useState<DealDetail | null | undefined>(undefined); // undefined = loading
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ErrorCode | null>(null);
  const [failed, setFailed] = useState(false);
  const [redemption, setRedemption] = useState<Redemption | null>(null);

  useEffect(() => {
    if (!dealId) return;
    let cancelled = false;
    getDeal({ id: dealId })
      .then((d) => {
        if (!cancelled) setDeal(d);
      })
      .catch(() => {
        if (!cancelled) setDeal(null);
      });
    return () => {
      cancelled = true;
    };
  }, [dealId]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!deal || pin.length !== 4 || busy) return;
    setBusy(true);
    setError(null);
    setFailed(false);
    try {
      const result = await redeemPin({ deal_id: deal.id, business_id: deal.business.id, pin });
      if (result.ok) {
        setRedemption(result.redemption);
      } else {
        setError(result.error);
        setPin("");
      }
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  if (redemption) return <RedeemedView redemption={redemption} />;

  if (!dealId || deal === null) {
    return (
      <div className="pt-10 text-center">
        <h1 className="text-2xl">Deal not found</h1>
        <Link href="/feed" className="mt-6 inline-flex min-h-11 items-center rounded-button bg-ink px-6 font-semibold text-white">
          Browse deals
        </Link>
      </div>
    );
  }

  if (deal === undefined) return <p className="pt-10 text-center text-ink-muted">Loading…</p>;

  return (
    <div>
      <h1 className="text-2xl">Staff PIN</h1>
      <p className="mt-2 text-ink-muted">
        Hand your phone to a staff member at {deal.business.name}. They enter the restaurant&apos;s 4-digit PIN to confirm
        your visit.
      </p>
      <p className="mt-4 font-semibold">{deal.title}</p>

      <form onSubmit={submit} className="mt-6">
        <label htmlFor="pin" className="text-sm text-ink-muted">
          PIN
        </label>
        <input
          id="pin"
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={4}
          autoComplete="off"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          className="mt-1 block min-h-12 w-full rounded-button border border-border-strong bg-surface px-4 text-center text-2xl tracking-[0.5em]"
        />
        {error && <p className="mt-3 text-sm font-semibold text-brown">{errorMessages[error]}</p>}
        {failed && <p className="mt-3 text-sm font-semibold text-brown">Something went wrong. Try again.</p>}
        <button
          type="submit"
          disabled={busy || pin.length !== 4}
          className="mt-4 min-h-12 w-full rounded-button bg-orange px-6 text-lg font-bold text-ink disabled:opacity-50"
        >
          {busy ? "Checking…" : "Confirm visit"}
        </button>
      </form>
    </div>
  );
}
