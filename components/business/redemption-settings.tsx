"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { KeyRound, QrCode, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isMockData, setPin, setRedemptionMode, type BusinessProfile, type RedemptionMode } from "@/lib/supabase";
import { useBusiness } from "./business-context";

const modeName = { sticker: "Sticker", staff_scan: "Staff scan" };
type Action = "mode" | "pin";

export function RedemptionSettings() {
  const { profile } = useBusiness();
  return profile ? <Settings key={`${profile.business.id}:${profile.membership_role}`} profile={profile} /> : null;
}

function Settings({ profile }: { profile: BusinessProfile }) {
  const { updateProfile, refresh } = useBusiness();
  const owner = profile.membership_role === "owner";
  const [mode, setMode] = useState<RedemptionMode>(profile.business.redemption_mode);
  const [action, setAction] = useState<Action | null>(null);
  const [busy, setBusy] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [modeUncertain, setModeUncertain] = useState(false);
  const [modeError, setModeError] = useState("");
  const [modeMessage, setModeMessage] = useState("");
  const [pinError, setPinError] = useState("");
  const [pinNotice, setPinNotice] = useState("");
  const [newPin, setNewPin] = useState<string | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const lifetime = useRef({ active: false, busy: false, version: 0, revealEpoch: 0, pinVisible: false });

  // Next preserves cached pages with Activity. Clear secrets synchronously
  // before hiding, so returning cannot paint the previous one-time PIN.
  useLayoutEffect(() => {
    const life = lifetime.current;
    const modal = dialog.current;
    life.active = true;
    function hidePin() { ++life.revealEpoch; setNewPin(null); if (life.pinVisible) setPinNotice("PIN hidden when you left this page. It cannot be shown again."); life.pinVisible = false; }
    const visibility = () => { if (document.visibilityState === "hidden") hidePin(); };
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("pagehide", hidePin);
    return () => {
      life.active = false; ++life.version; ++life.revealEpoch;
      life.busy = false; life.pinVisible = false; setBusy(false); setNewPin(null); setPinNotice(""); modal?.close();
      document.removeEventListener("visibilitychange", visibility); window.removeEventListener("pagehide", hidePin);
    };
  }, []);
  useEffect(() => {
    if (!newPin) return;
    const timer = window.setTimeout(() => { lifetime.current.pinVisible = false; setNewPin(null); setPinNotice("The PIN has been hidden. It cannot be shown again."); }, 60_000);
    return () => window.clearTimeout(timer);
  }, [newPin]);

  function closeDialog() { dialog.current?.close(); setAction(null); }
  function ask(next: Action) {
    if (!owner || blocked || lifetime.current.busy) return;
    setAction(next);
    requestAnimationFrame(() => { if (lifetime.current.active && dialog.current && !dialog.current.open) dialog.current.showModal(); });
  }
  function denyAccess() { setBlocked(true); lifetime.current.pinVisible = false; setNewPin(null); }
  async function confirm() {
    if (!action || !owner || blocked || lifetime.current.busy) return;
    lifetime.current.busy = true; setBusy(true);
    const request = ++lifetime.current.version;
    const epoch = lifetime.current.revealEpoch;
    const current = () => lifetime.current.active && lifetime.current.version === request;
    if (action === "mode") { setModeError(""); setModeMessage(""); }
    else { setPinError(""); lifetime.current.pinVisible = false; setNewPin(null); setPinNotice(""); }
    try {
      if (action === "mode") {
        const result = await setRedemptionMode({ business_id: profile.business.id, redemption_mode: mode });
        if (!current()) return;
        if (result.ok) {
          updateProfile({ ...profile, business: { ...profile.business, redemption_mode: result.redemption_mode } });
          setMode(result.redemption_mode); setModeMessage(`Redemption mode saved: ${modeName[result.redemption_mode]}.`);
        } else if (result.error === "NOT_OWNER" || result.error === "NOT_SIGNED_IN") {
          denyAccess(); setModeError("Your access has changed. Reload the business before changing settings.");
        } else setModeError(result.error === "STAFF_SCAN_UNAVAILABLE" ? "Staff scan setup is still pending. Keep Sticker mode until Grove confirms it is ready." : "Choose a supported redemption mode.");
      } else {
        const result = await setPin({ business_id: profile.business.id });
        if (!current()) return;
        if (result.ok) {
          if (!/^\d{4}$/.test(result.pin)) throw new Error("Unconfirmed PIN response");
          updateProfile({ ...profile, pin_ready: true });
          if (epoch === lifetime.current.revealEpoch && document.visibilityState === "visible") {
            lifetime.current.pinVisible = true; setNewPin(result.pin); setPinNotice("New PIN shown once. It will be hidden in one minute or when you leave this page.");
          } else setPinNotice("The PIN was reset while this page was hidden. It cannot be displayed now; reset again when you are ready to save it.");
        } else if (result.error === "NOT_OWNER" || result.error === "NOT_SIGNED_IN") {
          denyAccess(); setPinError("Your access has changed. Reload the business before resetting the PIN.");
        } else setPinError("The PIN could not be reset. Please try again when ready.");
      }
    } catch {
      if (!current()) return;
      if (action === "mode") { setModeUncertain(true); setModeError("The change may have saved. Reload the business to confirm its current mode before trying again."); }
      else setPinError("The reset may have completed, but we could not confirm the new PIN. The previous PIN may no longer work. Check your connection and reset again when ready.");
    } finally {
      if (current()) { lifetime.current.busy = false; setBusy(false); closeDialog(); }
    }
  }

  // Staff scan is a stretch goal (#20 not built), so it's offered only to a business already in
  // that mode, disabled, so it can switch back to Sticker.
  return <div className="mt-6 grid items-start gap-6 xl:grid-cols-2">
    <section aria-labelledby="redemption-settings-heading" className="min-w-0 rounded-card border border-border bg-surface-dashboard p-5 shadow-card sm:p-7">
      <div className="flex items-center gap-3"><span className="rounded-button bg-green-tint p-3 text-green"><ScanLine aria-hidden="true" className="size-5" /></span><h2 id="redemption-settings-heading" className="text-2xl">Redemption settings</h2></div>
      <p className="mt-4 text-sm leading-relaxed text-ink-muted">Choose how students verify a visit. Your permanent counter sticker link stays the same.</p>
      <p className="mt-3 text-sm font-bold">Current mode: {modeName[profile.business.redemption_mode]}</p>
      {!owner && <p className="mt-3 text-sm text-ink-muted">Only the business owner can change redemption settings or reset the PIN.</p>}
      {isMockData && <p className="mt-3 text-xs text-ink-fine">Demo settings. Changes reset on reload.</p>}
      {profile.business.redemption_mode === "staff_scan" && <p className="mt-3 rounded-button bg-peach p-3 text-sm leading-relaxed text-brown">Staff scan isn&apos;t available yet. Switch back to Sticker mode for live redemptions.</p>}
      <fieldset disabled={!owner || busy || blocked || modeUncertain} className="mt-5">
        <legend className="text-sm font-bold">Redemption mode</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">{(profile.business.redemption_mode === "staff_scan" ? ["sticker", "staff_scan"] as const : ["sticker"] as const).map(value => {
          const Icon = value === "sticker" ? QrCode : ScanLine;
          return <label key={value} className="relative cursor-pointer"><input type="radio" name="redemption-mode" value={value} checked={mode === value} disabled={value === "staff_scan"} onChange={() => { setMode(value); setModeError(""); setModeMessage(""); }} className="peer sr-only" />
            <span className="flex min-h-28 flex-col gap-2 rounded-button border border-border-strong p-4 peer-checked:border-green peer-checked:bg-green-tint peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-green peer-disabled:cursor-not-allowed peer-disabled:opacity-60"><span className="flex items-center gap-2 text-sm font-bold"><Icon aria-hidden="true" className="size-4" />{modeName[value]}</span><span className="text-xs leading-relaxed text-ink-muted">{value === "sticker" ? "Students scan your counter sticker in Grove. A backup PIN helps if location fails." : "Students show a short-lived code for staff to scan and verify."}</span></span>
          </label>;
        })}</div>
      </fieldset>
      {owner && <Button disabled={busy || blocked || modeUncertain || mode === profile.business.redemption_mode} onClick={() => ask("mode")} className="mt-5 rounded-button bg-green text-surface hover:bg-green-dark">{busy && action === "mode" ? "Saving…" : "Save redemption mode"}</Button>}
      {modeError && <p role="alert" className="mt-4 text-sm text-destructive">{modeError}</p>}
      <p role="status" className="mt-3 text-sm text-green-dark">{modeMessage}</p>
      {(blocked || modeUncertain) && <Button variant="outline" onClick={refresh} className="mt-3">Reload business</Button>}
    </section>
    <section aria-labelledby="backup-pin-heading" className="min-w-0 rounded-card border border-border bg-surface-dashboard p-5 shadow-card sm:p-7">
      <div className="flex items-center gap-3"><span className="rounded-button bg-peach p-3 text-brown"><KeyRound aria-hidden="true" className="size-5" /></span><h2 id="backup-pin-heading" className="text-2xl">Backup store PIN</h2></div>
      <p className="mt-4 text-sm leading-relaxed text-ink-muted">If a student’s location is not working in Sticker mode, staff can tell them this PIN to redeem instead. Each successful redemption still counts as a visit.</p>
      <p className="mt-3 text-sm text-ink-fine">Existing PINs cannot be viewed. Reset only when you need a new one.</p>
      {newPin && <div className="mt-5 rounded-button border border-border-strong bg-bg-dashboard p-4"><label htmlFor="new-backup-pin" className="block text-sm font-bold">New backup PIN · shown once</label><output id="new-backup-pin" className="mt-3 block font-heading text-4xl font-extrabold tracking-[0.3em]">{newPin}</output><Button variant="outline" className="mt-4" onClick={() => { lifetime.current.pinVisible = false; setNewPin(null); setPinNotice("PIN hidden. It cannot be shown again."); }}>I’ve saved it — hide PIN</Button></div>}
      {pinNotice && <p role="status" className="mt-4 text-sm text-green-dark">{pinNotice}</p>}
      {owner ? <Button variant="outline" disabled={busy || blocked} onClick={() => ask("pin")} className="mt-5 rounded-button">{busy && action === "pin" ? "Resetting…" : "Reset PIN"}</Button> : <p className="mt-4 text-sm text-ink-muted">Ask the owner to reset the PIN if needed.</p>}
      {pinError && <p role="alert" className="mt-4 text-sm text-destructive">{pinError}</p>}
    </section>
    <dialog ref={dialog} aria-labelledby="settings-action-heading" aria-describedby="settings-action-description" aria-busy={busy} onCancel={event => { if (lifetime.current.busy) event.preventDefault(); else setAction(null); }} onClose={() => setAction(null)} className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-card border border-border bg-surface-dashboard p-6 text-ink shadow-card backdrop:bg-ink/40">
      {action && <><h2 id="settings-action-heading" className="text-2xl">{action === "pin" ? "Reset the backup PIN?" : `Switch to ${modeName[mode]}?`}</h2><p id="settings-action-description" className="mt-3 text-sm leading-relaxed text-ink-muted">{action === "pin" ? "The previous PIN will stop working. The new PIN will be shown once; save it privately before leaving this page." : mode === "staff_scan" ? "Staff will need the Grove scanner to verify each visit. Your permanent sticker link and backup PIN will stay the same." : "Students will scan the permanent counter sticker in Grove. The backup PIN stays the same."}</p><div className="mt-6 flex flex-wrap gap-3"><Button variant="outline" disabled={busy} onClick={closeDialog}>Keep current settings</Button><Button disabled={busy} onClick={confirm} className="rounded-button bg-green text-surface hover:bg-green-dark">{busy ? "Saving…" : action === "pin" ? "Reset PIN now" : "Confirm mode change"}</Button></div></>}
    </dialog>
  </div>;
}
