"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type FormEvent } from "react";
import { CalendarDays, Check, Clock3, HeartHandshake, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClubNight, getClubNights, isMockData, type ClubNight, type CreateClubNightErrors, type CreateClubNightInput, type OpenClubNight } from "@/lib/supabase";
import { BusinessAccessError } from "@/lib/supabase/business-errors";
import { MAX_GIVEBACK_LENGTH, validateCreateClubNight } from "@/lib/supabase/club-night-input";
import { CAMPUS_TZ } from "@/lib/supabase/deal-status";
import { campusDateTimeToISO } from "@/lib/supabase/deal-input";
import { BusinessLoading, useBusiness } from "./business-context";

const empty = { night_date: "", start_time: "", end_time: "", giveback: "" };
const control = "mt-2 block min-h-12 w-full min-w-0 rounded-button border border-border-strong bg-surface px-3 py-2.5 text-base outline-none focus-visible:border-green focus-visible:ring-2 focus-visible:ring-green/30 aria-invalid:border-destructive";
const dateFormat = new Intl.DateTimeFormat("en-US", { timeZone: CAMPUS_TZ, year: "numeric", month: "short", day: "numeric" });
const timeFormat = new Intl.DateTimeFormat("en-US", { timeZone: CAMPUS_TZ, hour: "numeric", minute: "2-digit" });
function schedule(night: Pick<OpenClubNight, "night_date" | "start_time" | "end_time">) {
  const start = campusDateTimeToISO(`${night.night_date}T${night.start_time}`);
  const end = campusDateTimeToISO(`${night.night_date}T${night.end_time}`);
  return start && end ? `${dateFormat.format(new Date(start))} · ${timeFormat.format(new Date(start))}–${timeFormat.format(new Date(end))}` : "Choose a date and time window";
}

export function ClubNightPosting() {
  const { profile } = useBusiness();
  return profile ? <Posting key={profile.business.id} businessId={profile.business.id} businessName={profile.business.name} /> : <BusinessLoading />;
}

function Posting({ businessId, businessName }: { businessId: string; businessName: string }) {
  const { refresh } = useBusiness();
  const [values, setValues] = useState(empty);
  const [errors, setErrors] = useState<CreateClubNightErrors>({});
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<OpenClubNight | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [checked, setChecked] = useState(false);
  const [nights, setNights] = useState<ClubNight[] | null>(null);
  const [listError, setListError] = useState("");
  const [listBusy, setListBusy] = useState(false);
  const [focusRequest, setFocusRequest] = useState(0);
  const summary = useRef<HTMLDivElement>(null);
  const success = useRef<HTMLElement>(null);
  const dateInput = useRef<HTMLInputElement>(null);
  const life = useRef({ active: false, posting: false, posted: false, version: 0, listVersion: 0 });

  useLayoutEffect(() => {
    const current = life.current; current.active = true;
    return () => {
      current.active = false; ++current.version; ++current.listVersion;
      if (current.posting) { setUncertain(true); setChecked(false); setSaveError("A post was in progress when you left. Refresh and check posted nights before starting a new post."); }
      current.posting = false; setSaving(false); setListBusy(false);
    };
  }, []);
  const loadNights = useCallback(async (forCheck = false) => {
    const request = ++life.current.listVersion;
    setListBusy(true);
    if (forCheck) setChecked(false);
    try {
      const rows = await getClubNights({ businessId });
      if (life.current.active && request === life.current.listVersion) { setNights(rows); setListError(""); if (forCheck) setChecked(true); }
    } catch (error) {
      if (life.current.active && request === life.current.listVersion) {
        if (error instanceof BusinessAccessError) { setNights(null); setBlocked(true); setListError("Your business access has changed. Reload the business to continue."); }
        else setListError("We could not refresh posted nights. Any previous list may be out of date.");
      }
    } finally { if (life.current.active && request === life.current.listVersion) setListBusy(false); }
  }, [businessId]);
  useEffect(() => {
    let active = true;
    queueMicrotask(() => { if (active) void loadNights(); });
    return () => { active = false; };
  }, [loadNights]);
  useEffect(() => { if (focusRequest) summary.current?.focus(); }, [focusRequest]);
  useEffect(() => { if (saved) success.current?.focus(); }, [saved]);

  function update<K extends keyof typeof empty>(key: K, value: string) {
    if (life.current.posting || uncertain || blocked) return;
    setValues(current => ({ ...current, [key]: value })); setErrors(current => ({ ...current, [key]: undefined })); setSaveError("");
  }
  function newPost() {
    life.current.posted = false; setSaved(null); setValues(empty); setErrors({}); setSaveError(""); setUncertain(false); setChecked(false);
    requestAnimationFrame(() => dateInput.current?.focus());
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (life.current.posting || life.current.posted || blocked || uncertain) return;
    const input: CreateClubNightInput = { business_id: businessId, ...values };
    const result = validateCreateClubNight(input);
    if (!result.ok) { setErrors(result.fields); setSaveError(""); setFocusRequest(value => value + 1); return; }
    life.current.posting = true; const request = ++life.current.version; setSaving(true); setErrors({}); setSaveError("");
    try {
      const response = await createClubNight(result.value);
      if (!life.current.active || request !== life.current.version) return;
      if (response.ok) { life.current.posted = true; setSaved(response.club_night); void loadNights(); }
      else if (response.error === "INVALID_CLUB_NIGHT") { setErrors(response.fields); setFocusRequest(value => value + 1); }
      else { setBlocked(true); setSaveError("Your business access has changed. Reload the business before posting."); setFocusRequest(value => value + 1); }
    } catch {
      if (life.current.active && request === life.current.version) { setUncertain(true); setChecked(false); setSaveError("The club night may have been posted, but we could not confirm it. Refresh and check posted nights before starting a new post. We will not retry automatically."); setFocusRequest(value => value + 1); }
    } finally { if (life.current.active && request === life.current.version) { life.current.posting = false; setSaving(false); } }
  }

  const errorFor = (key: keyof typeof empty) => errors[key] ? <p id={`${key}-error`} className="mt-2 text-sm font-bold text-destructive">{errors[key]}</p> : null;
  const postedNights = nights?.slice(0, 20);
  return <>
    <div className="grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
      {saved ? <section ref={success} tabIndex={-1} aria-labelledby="night-saved-heading" className="rounded-card bg-surface-dashboard p-6 shadow-card outline-none focus-visible:ring-2 focus-visible:ring-green sm:p-8">
        <span className="inline-flex rounded-button bg-green-tint p-3 text-green"><Check aria-hidden="true" className="size-7" /></span><h2 id="night-saved-heading" className="mt-4 text-2xl">{isMockData ? "Club night saved to the demo" : "Open club night posted"}</h2>
        <p className="mt-4 font-bold">{schedule(saved)}</p><p className="mt-2 text-sm text-ink-muted">UC Riverside time</p><p className="mt-4 whitespace-pre-line text-ink-muted [overflow-wrap:anywhere]">{saved.giveback}</p>
        <p className="mt-4 text-sm text-ink-fine">The night is available for a student to claim for their club. Posting does not create a claimed club or a deal.</p>
        {isMockData && <p className="mt-3 text-sm text-ink-fine">Sample data only. Demo changes reset on reload.</p>}
        <Button onClick={newPost} className="mt-6 rounded-button"><Plus aria-hidden="true" className="size-4" />Post another night</Button>
      </section> : <form onSubmit={submit} noValidate aria-label="Post an open club night" aria-busy={saving} className="min-w-0 rounded-card bg-surface-dashboard p-5 shadow-card sm:p-7">
        <h2 className="text-2xl">Post an open club night</h2><p className="mt-3 text-sm leading-relaxed text-ink-muted">Create an open night for {businessName}. A student adds their club name when claiming. Required fields are marked *.</p>
        {(saveError || Object.values(errors).some(Boolean)) && <div ref={summary} role="alert" tabIndex={-1} className="mt-5 rounded-button border border-destructive bg-destructive/5 p-4 text-sm text-destructive outline-none focus:ring-2 focus:ring-destructive"><p className="font-bold">{saveError || "Please check the highlighted fields."}</p>{Object.values(errors).filter(Boolean).map(message => <p key={message} className="mt-2">{message}</p>)}</div>}
        {blocked && <Button type="button" variant="outline" onClick={refresh} className="mt-4">Reload business</Button>}
        <fieldset disabled={saving || blocked || uncertain} className="mt-6 min-w-0 space-y-6 disabled:opacity-70">
          <legend className="sr-only">Club night details</legend>
          <div><label htmlFor="night-date" className="text-sm font-bold">Date *</label><input ref={dateInput} id="night-date" name="night_date" type="date" required value={values.night_date} onChange={event => update("night_date", event.target.value)} aria-invalid={Boolean(errors.night_date)} aria-describedby={errors.night_date ? "night_date-error" : undefined} className={control} />{errorFor("night_date")}</div>
          <div><p id="night-timezone" className="text-sm font-bold">Time window · UC Riverside time ({CAMPUS_TZ})</p><div className="mt-3 grid gap-4 sm:grid-cols-2">{(["start_time", "end_time"] as const).map(key => <div key={key}><label htmlFor={`night-${key}`} className="text-sm font-bold">{key === "start_time" ? "Start time" : "End time"} *</label><input id={`night-${key}`} name={key} type="time" required step={60} value={values[key]} onChange={event => update(key, event.target.value)} aria-invalid={Boolean(errors[key])} aria-describedby={`night-timezone night-window-help${errors[key] ? ` ${key}-error` : ""}`} className={control} />{errorFor(key)}</div>)}</div><p id="night-window-help" className="mt-3 text-xs leading-relaxed text-ink-fine">Start and end on the same date. The end must be in the future. Giveback is settled directly with the club, outside Grove.</p></div>
          <div><label htmlFor="night-giveback" className="text-sm font-bold">Giveback *</label><textarea id="night-giveback" name="giveback" required rows={4} maxLength={MAX_GIVEBACK_LENGTH} value={values.giveback} onChange={event => update("giveback", event.target.value)} placeholder="e.g. 15% of club-night sales back to your club" aria-invalid={Boolean(errors.giveback)} aria-describedby={`giveback-count${errors.giveback ? " giveback-error" : ""}`} className={`${control} resize-y`} /><p id="giveback-count" className="mt-2 text-xs text-ink-fine">{values.giveback.length} / {MAX_GIVEBACK_LENGTH} characters · Explain what the club receives.</p>{errorFor("giveback")}</div>
        </fieldset>
        <Button type="submit" disabled={saving || blocked || uncertain} size="lg" className="mt-7 w-full rounded-button"><Plus aria-hidden="true" className="size-5" />{saving ? "Posting…" : "Post open club night"}</Button>
        {uncertain && <div className="mt-4 text-sm text-ink-muted"><p>Use Refresh posted nights below and check for this date, window and giveback. Starting a new post clears this draft.</p><Button type="button" variant="outline" disabled={!checked || listBusy || blocked || Boolean(listError)} onClick={newPost} className="mt-3">I’ve checked — start a new post</Button></div>}
      </form>}
      <aside aria-label="Club night preview" className="min-w-0 rounded-card border border-border-strong bg-peach p-5 sm:p-6"><span className="inline-flex rounded-button bg-surface-dashboard p-3 text-brown"><HeartHandshake aria-hidden="true" className="size-6" /></span><h2 className="mt-4 text-xl">Open night preview</h2><p className="mt-3 text-sm font-bold [overflow-wrap:anywhere]">{businessName}</p><p className="mt-3 text-sm leading-relaxed text-brown [overflow-wrap:anywhere]">{schedule(saved ?? values)}</p><p className="mt-2 text-xs text-brown">UC Riverside time</p><p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-ink-muted [overflow-wrap:anywhere]">{(saved?.giveback ?? values.giveback).trim() || "Your giveback offer appears here."}</p><p className="mt-4 text-xs leading-relaxed text-brown">Open for a student club to claim. No club has been assigned by this form.</p>{isMockData && <p className="mt-3 text-xs font-bold text-brown">Demo preview</p>}</aside>
    </div>
    <section aria-labelledby="open-nights-heading" className="mt-6 rounded-card border border-border bg-surface-dashboard p-5 shadow-card sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 id="open-nights-heading" className="text-2xl">Posted nights</h2><Button variant="outline" disabled={listBusy || saving} onClick={() => { void loadNights(uncertain); }}><RefreshCw aria-hidden="true" className="size-4" />{listBusy ? "Refreshing…" : "Refresh posted nights"}</Button></div>
      <p className="mt-3 text-xs text-ink-fine">Most recent 20 nights from the last refresh, including claimed and expired nights. Refresh to check the current status.</p>
      {listError && <p role="alert" className="mt-4 text-sm text-destructive">{listError}</p>}{blocked && saved && <Button variant="outline" onClick={refresh} className="mt-3">Reload business</Button>}
      {!nights ? <p role="status" className="mt-5 text-sm text-ink-muted">{listError ? "Posted nights unavailable." : "Loading posted nights…"}</p> : !postedNights?.length ? <p className="mt-5 text-sm text-ink-muted">No posted club nights from the last refresh.</p> : <ul className="mt-4 divide-y divide-border-soft">{postedNights.map(night => <li key={night.id} className="py-4"><p className="flex items-center gap-2 text-sm font-bold"><CalendarDays aria-hidden="true" className="size-4 shrink-0 text-green" />{schedule(night)}</p><p className="mt-2 whitespace-pre-line text-sm text-ink-muted [overflow-wrap:anywhere]">{night.giveback}</p><p className="mt-2 inline-flex items-center gap-1 text-xs text-green-dark"><Clock3 aria-hidden="true" className="size-3.5" />{night.status === "claimed" ? "Claimed" : night.status === "expired" ? "Expired" : "Open"} at last refresh · UC Riverside time</p></li>)}</ul>}
    </section>
  </>;
}
