"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Check, Store } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { BusinessLoading, useBusiness } from "@/components/business/business-context";
import { readImage } from "@/components/business/read-image";
import { getBusinessLocationOptions, saveBusiness, setPin } from "@/lib/supabase/business";
import { BUSINESS_DAYS, copyHours, validateBusinessInput } from "@/lib/supabase/business-input";
import { IMAGE_TYPES, MAX_IMAGE_BYTES } from "@/lib/supabase/image-input";
import type { BusinessInputErrors, BusinessLocationOption, BusinessProfile, Hours, Weekday } from "@/lib/supabase/types";

const control = "mt-2 block min-h-12 w-full min-w-0 rounded-button border border-border-strong bg-surface-dashboard px-3 py-2.5 text-base outline-none focus-visible:border-green focus-visible:ring-2 focus-visible:ring-green/30 aria-invalid:border-destructive disabled:opacity-50";
const valuesFor = ({ business }: BusinessProfile) => ({ name: business.name, address: business.address, lat: String(business.lat), lng: String(business.lng), isTruck: business.is_truck });

function FieldError({ field, errors }: { field: keyof BusinessInputErrors; errors: BusinessInputErrors }) {
  return errors[field] ? <p id={`business-${field}-error`} className="mt-2 text-sm font-bold text-destructive">{errors[field]}</p> : null;
}

export function BusinessOnboarding() {
  const { profile } = useBusiness();
  return profile ? <BusinessSetupForm key={profile.business.id} initialProfile={profile} /> : <BusinessLoading />;
}

function BusinessSetupForm({ initialProfile }: { initialProfile: BusinessProfile }) {
  const { updateProfile } = useBusiness();
  const [values, setValues] = useState(() => valuesFor(initialProfile));
  const [hours, setHours] = useState<Hours>(() => copyHours(initialProfile.business.hours));
  const [logo, setLogo] = useState<string | null>(initialProfile.business.logo_url);
  const [locations, setLocations] = useState<BusinessLocationOption[]>([]);
  const [selectedAddress, setSelectedAddress] = useState(initialProfile.business.address);
  const [lookupError, setLookupError] = useState("");
  const [errors, setErrors] = useState<BusinessInputErrors>({});
  const [saveError, setSaveError] = useState("");
  const [logoReading, setLogoReading] = useState(false);
  const [working, setWorking] = useState(false);
  const [saved, setSaved] = useState<BusinessProfile | null>(null);
  const [pin, setNewPin] = useState<string | null>(null);
  const [pinError, setPinError] = useState("");
  const [errorFocusRequest, setErrorFocusRequest] = useState(0);
  const file = useRef<HTMLInputElement>(null);
  const nameInput = useRef<HTMLInputElement>(null);
  const summary = useRef<HTMLDivElement>(null);
  const confirmation = useRef<HTMLElement>(null);
  const imageReadId = useRef(0);
  const inFlight = useRef(false);
  const hadSaved = useRef(false);

  useEffect(() => {
    if (saved) confirmation.current?.focus();
    else if (hadSaved.current) nameInput.current?.focus();
    hadSaved.current = Boolean(saved);
  }, [saved]);
  useEffect(() => {
    if (errorFocusRequest > 0) summary.current?.focus();
  }, [errorFocusRequest]);

  useEffect(() => {
    let active = true;
    getBusinessLocationOptions().then(rows => { if (active) setLocations(rows); })
      .catch(() => { if (active) setLookupError("Sample addresses are unavailable. You can enter your address and coordinates below."); });
    return () => { active = false; };
  }, []);
  // Next.js can preserve page state while navigating. Do not restore a revealed
  // PIN when returning to a cached onboarding page.
  useEffect(() => () => { setNewPin(null); }, []);

  function clearError(field: keyof BusinessInputErrors) {
    setErrors(current => ({ ...current, [field]: undefined }));
    setSaveError("");
  }
  function resetDraft(profile = initialProfile) {
    ++imageReadId.current;
    setValues(valuesFor(profile)); setHours(copyHours(profile.business.hours)); setLogo(profile.business.logo_url);
    setSelectedAddress(profile.business.address); setErrors({}); setSaveError(""); setLogoReading(false);
    setNewPin(null); setPinError(""); setSaved(null);
    if (file.current) file.current.value = "";
  }
  function setDayOpen(day: Weekday, open: boolean) {
    clearError("hours");
    setHours(current => {
      const next = copyHours(current);
      if (open) next[day] = [["11:00", "21:00"]]; else delete next[day];
      return next;
    });
  }
  function changeTime(day: Weekday, index: 0 | 1, value: string) {
    clearError("hours");
    setHours(current => {
      const next = copyHours(current);
      if (next[day]?.[0]) next[day][0][index] = value;
      return next;
    });
  }
  async function chooseLogo(event: ChangeEvent<HTMLInputElement>) {
    const chosen = event.currentTarget.files?.[0];
    const readId = ++imageReadId.current;
    setLogo(null); clearError("logo_url");
    if (!chosen) { setLogoReading(false); return; }
    if (!IMAGE_TYPES.includes(chosen.type) || chosen.size > MAX_IMAGE_BYTES) {
      setErrors(current => ({ ...current, logo_url: "Choose a JPG, PNG, or WebP logo up to 5 MB." }));
      event.currentTarget.value = ""; setLogoReading(false); return;
    }
    setLogoReading(true);
    try {
      const data = await readImage(chosen);
      if (readId === imageReadId.current) setLogo(data);
    } catch (error) {
      if (readId === imageReadId.current) {
        setErrors(current => ({ ...current, logo_url: error instanceof Error ? error.message : "Could not read this logo. Try again." }));
        if (file.current) file.current.value = "";
      }
    } finally { if (readId === imageReadId.current) setLogoReading(false); }
  }
  async function generateFirstPin(profile: BusinessProfile) {
    setPinError("");
    try {
      const result = await setPin({ business_id: profile.business.id });
      if (!result.ok) {
        setPinError(result.error === "NOT_OWNER" ? "You do not have permission to generate this business's PIN." : "Sign in before generating a PIN.");
        return;
      }
      const ready = { ...profile, pin_ready: true };
      setNewPin(result.pin); setSaved(ready); updateProfile(ready);
    } catch { setPinError("Your business was saved, but we could not generate the PIN. Please try again."); }
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current || logoReading) return;
    const result = validateBusinessInput({
      business_id: initialProfile.business.id, name: values.name, address: values.address,
      lat: values.lat.trim() ? Number(values.lat) : NaN, lng: values.lng.trim() ? Number(values.lng) : NaN,
      hours, logo_url: logo, is_truck: values.isTruck,
    });
    const fields: BusinessInputErrors = result.ok ? {} : { ...result.fields };
    if (errors.logo_url) fields.logo_url = errors.logo_url;
    setErrors(fields); setSaveError("");
    if (!result.ok || Object.values(fields).some(Boolean)) { setErrorFocusRequest(current => current + 1); return; }
    inFlight.current = true; setWorking(true);
    try {
      const response = await saveBusiness(result.value);
      if (response.ok) {
        setSaved(response.profile); updateProfile(response.profile);
        if (!response.profile.pin_ready) await generateFirstPin(response.profile);
      } else {
        if (response.error === "INVALID_BUSINESS") setErrors(response.fields);
        else setSaveError("You do not have permission to set up this business.");
        setErrorFocusRequest(current => current + 1);
      }
    } catch {
      setSaveError("We could not save your business. Your entries are still here; please try again.");
      setErrorFocusRequest(current => current + 1);
    } finally { inFlight.current = false; setWorking(false); }
  }
  async function retryPin() {
    if (!saved || inFlight.current) return;
    inFlight.current = true; setWorking(true);
    try { await generateFirstPin(saved); } finally { inFlight.current = false; setWorking(false); }
  }

  if (saved) return <section ref={confirmation} tabIndex={-1} aria-labelledby="business-saved" className="max-w-2xl rounded-card border border-border bg-surface-dashboard p-6 shadow-card outline-none sm:p-8">
    <Check aria-hidden="true" className="mb-4 size-9 text-green" />
    <h2 id="business-saved" className="text-2xl">Business saved to the demo</h2>
    <p className="mt-3 break-words text-lg font-bold">{saved.business.name}</p>
    <p className="mt-2 break-words text-sm text-ink-muted">{saved.business.address}</p>
    {working && <p role="status" className="mt-4 text-sm text-ink-muted">Generating your first PIN…</p>}
    {pin && <div className="mt-6 rounded-button bg-green-tint p-5">
      <h3 className="text-xl">Your first staff PIN</h3>
      <output aria-label="First staff PIN" className="mt-3 block font-heading text-4xl font-extrabold tracking-[0.2em] text-green-dark">{pin}</output>
      <p className="mt-3 text-sm text-ink-muted">Save this PIN for your staff. It will be hidden when you finish or leave this page.</p>
      <Button onClick={() => setNewPin(null)} className="mt-4 rounded-button">I have saved my PIN</Button>
    </div>}
    {pinError && <div role="alert" className="mt-4 text-sm text-destructive"><p>{pinError}</p><Button disabled={working} onClick={retryPin} className="mt-3 rounded-button">Generate first PIN</Button></div>}
    {!pin && !working && saved.pin_ready && <p className="mt-4 text-sm font-bold text-green-dark">Your staff PIN is set. Keep it for in-store redemptions.</p>}
    <p className="mt-5 text-sm text-ink-fine">Demo changes reset on a full page reload. Nothing has been published.</p>
    <div className="mt-6 flex flex-wrap gap-3">
      <Link href="/dashboard" onClick={() => setNewPin(null)} aria-disabled={working || undefined} tabIndex={working ? -1 : undefined} className={buttonVariants({ className: `rounded-button ${working ? "pointer-events-none opacity-50" : ""}` })}>Go to dashboard</Link>
      <Button variant="outline" disabled={working} onClick={() => resetDraft(saved)} className="rounded-button">Edit business details</Button>
    </div>
  </section>;

  const hasErrors = Boolean(saveError) || Object.values(errors).some(Boolean);
  return <form onSubmit={submit} noValidate aria-label="Business setup" aria-busy={working} className="max-w-4xl rounded-card border border-border bg-surface-dashboard p-5 shadow-card sm:p-7">
    <p className="mb-6 text-sm text-ink-muted">Set up your sample business. Required fields are marked *.</p>
    {hasErrors && <div ref={summary} role="alert" tabIndex={-1} className="mb-6 rounded-button border border-destructive p-4 text-sm text-destructive outline-none focus:ring-2 focus:ring-destructive"><p className="font-bold">{saveError || "Please check the highlighted fields."}</p>{Object.values(errors).filter(Boolean).map(message => <p key={message} className="mt-1">{message}</p>)}</div>}
    <fieldset disabled={working} className="min-w-0 space-y-6 disabled:opacity-70">
      <div>
        <label htmlFor="business-name" className="text-sm font-bold">Business name *</label>
        <input ref={nameInput} id="business-name" required value={values.name} onChange={event => { setValues(current => ({ ...current, name: event.target.value })); clearError("name"); }} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "business-name-error" : undefined} className={control} />
        <FieldError field="name" errors={errors} />
      </div>
      <section aria-labelledby="location-heading" className="min-w-0 space-y-4">
        <div><h2 id="location-heading" className="text-xl">Where can students find you?</h2><p className="mt-1 text-sm text-ink-fine">Choose a sample address to fill its coordinates. For another location, enter its address, latitude, and longitude.</p></div>
        {lookupError && <p role="alert" className="text-sm text-ink-muted">{lookupError}</p>}
        <div><label htmlFor="sample-address" className="text-sm font-bold">Sample address lookup</label><select id="sample-address" value={selectedAddress} onChange={event => { const address = event.target.value; setSelectedAddress(address); const selected = locations.find(item => item.address === address); if (selected) { setValues(current => ({ ...current, address: selected.address, lat: String(selected.lat), lng: String(selected.lng) })); clearError("address"); clearError("lat"); clearError("lng"); } }} className={control}><option value="">Enter a location manually</option>{locations.map((location, index) => <option key={`${location.address}-${index}`} value={location.address}>{location.address}</option>)}</select></div>
        <div>
          <label htmlFor="business-address" className="text-sm font-bold">Address *</label>
          <input id="business-address" required value={values.address} onChange={event => { setSelectedAddress(""); setValues(current => ({ ...current, address: event.target.value, lat: "", lng: "" })); clearError("address"); }} aria-invalid={Boolean(errors.address)} aria-describedby={`location-help${errors.address ? " business-address-error" : ""}`} className={control} />
          <p id="location-help" className="mt-2 text-xs text-ink-fine">Changing the address clears its coordinates so an old location cannot be saved by mistake.</p><FieldError field="address" errors={errors} />
        </div>
        <div className="grid min-w-0 gap-4 sm:grid-cols-2">
          {([{ key: "lat", label: "Latitude", min: -90, max: 90 }, { key: "lng", label: "Longitude", min: -180, max: 180 }] as const).map(({ key, label, min, max }) => <div key={key} className="min-w-0"><label htmlFor={`business-${key}`} className="text-sm font-bold">{label} *</label><input id={`business-${key}`} type="number" step="any" min={min} max={max} required value={values[key]} onChange={event => { setSelectedAddress(""); setValues(current => ({ ...current, [key]: event.target.value })); clearError(key); }} aria-invalid={Boolean(errors[key])} aria-describedby={errors[key] ? `business-${key}-error` : undefined} className={control} /><FieldError field={key} errors={errors} /></div>)}
        </div>
      </section>
      <section aria-labelledby="hours-heading" className="min-w-0">
        <h2 id="hours-heading" className="text-xl">Weekly hours</h2>
        <p id="hours-help" className="mt-1 text-sm text-ink-fine">UC Riverside time. Uncheck a day to mark it closed. A closing time earlier than opening means past midnight.</p>
        <div className="mt-4 divide-y divide-border-soft">
          {BUSINESS_DAYS.map(({ key, label }) => {
            const period = hours[key]?.[0];
            return <div key={key} className="grid min-w-0 grid-cols-2 items-center gap-3 py-4 sm:grid-cols-[140px_minmax(0,1fr)_minmax(0,1fr)]">
              <label className="col-span-2 flex min-h-11 cursor-pointer items-center gap-3 text-sm font-bold sm:col-span-1"><input type="checkbox" checked={Boolean(period)} onChange={event => setDayOpen(key, event.target.checked)} className="size-5 shrink-0 accent-green focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green" />{label} open</label>
              {([0, 1] as const).map(index => <label key={index} className="min-w-0 text-xs font-bold text-ink-muted">{index === 0 ? "Opens" : "Closes"}<input aria-label={`${label} ${index === 0 ? "opens" : "closes"}`} type="time" required={Boolean(period)} disabled={!period} value={period?.[index] ?? ""} onChange={event => changeTime(key, index, event.target.value)} aria-invalid={Boolean(errors.hours)} aria-describedby={`hours-help${errors.hours ? " business-hours-error" : ""}`} className={control} /></label>)}
            </div>;
          })}
        </div><FieldError field="hours" errors={errors} />
      </section>
      <div>
        <label htmlFor="business-logo" className="text-sm font-bold">Business logo (optional)</label>
        <p id="logo-help" className="mt-1 text-sm text-ink-fine">JPG, PNG, or WebP · up to 5 MB. The logo stays in this demo only.</p>
        <div className="mt-3 flex size-24 items-center justify-center overflow-hidden rounded-button bg-peach-deep text-brown">{logo ? <Image src={logo} alt="Business logo preview" width={96} height={96} unoptimized className="size-full object-cover" /> : <Store aria-hidden="true" className="size-8" />}</div>
        <input ref={file} id="business-logo" type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseLogo} aria-invalid={Boolean(errors.logo_url)} aria-describedby={`logo-help${errors.logo_url ? " business-logo_url-error" : ""}`} className={`${control} text-sm file:mr-3 file:min-h-11 file:rounded-button file:border-0 file:bg-green-tint file:px-3 file:font-bold file:text-green-dark`} />
        <FieldError field="logo_url" errors={errors} /><p role="status" className="mt-2 text-sm text-ink-muted">{logoReading ? "Reading logo…" : ""}</p>
        {(logo || errors.logo_url) && <Button type="button" variant="ghost" onClick={() => { ++imageReadId.current; setLogo(null); setLogoReading(false); clearError("logo_url"); if (file.current) file.current.value = ""; }}>Remove logo</Button>}
      </div>
      <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-bold"><input type="checkbox" checked={values.isTruck} onChange={event => { setValues(current => ({ ...current, isTruck: event.target.checked })); clearError("is_truck"); }} className="size-5 shrink-0 accent-green focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green" />This is a food truck</label>
      <div className="flex flex-wrap gap-3 border-t border-border-soft pt-6"><Button type="submit" size="lg" disabled={working || logoReading} className="rounded-button">{working ? "Saving…" : initialProfile.pin_ready ? "Save business" : "Save business & get PIN"}</Button><Link href="/dashboard" onClick={() => resetDraft()} aria-disabled={working || undefined} tabIndex={working ? -1 : undefined} className={buttonVariants({ variant: "outline", size: "lg", className: `rounded-button ${working ? "pointer-events-none opacity-50" : ""}` })}>Cancel</Link></div>
      <p className="text-xs text-ink-fine">Demo only. Changes reset on full page reload.</p>
    </fieldset>
  </form>;
}
