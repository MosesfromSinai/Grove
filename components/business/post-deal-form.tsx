"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Check, Clock3, ImagePlus, Plus, Tag } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { createDeal } from "@/lib/supabase";
import { campusDateTimeInput, campusDateTimeToISO, DEAL_PHOTO_TYPES, DEAL_TIMEZONE_LABEL, MAX_DEAL_PHOTO_BYTES, validateCreateDealInput } from "@/lib/supabase/deal-input";
import type { CreateDealErrors, DiscountType, MyDeal } from "@/lib/supabase/types";
import { CAMPUS_TZ } from "@/lib/supabase/deal-status";
import { BusinessLoading, useBusiness } from "@/components/business/business-context";

const control = "mt-2 block min-h-12 w-full min-w-0 rounded-button border border-border-strong bg-surface px-3 py-2.5 text-base outline-none focus-visible:border-green focus-visible:ring-2 focus-visible:ring-green/30 aria-invalid:border-destructive";
const emptyValues = { title: "", description: "", discountType: "amount_off" as DiscountType, discountValue: "", startDate: "", startTime: "", endDate: "", endTime: "", studentsOnly: true };
const fieldNames = { title: "title", description: "description", discountType: "discount_type", discountValue: "discount_value", startDate: "starts_at", startTime: "starts_at", endDate: "ends_at", endTime: "ends_at", studentsOnly: "students_only" } as const;
const discounts: { value: DiscountType; label: string }[] = [
  { value: "amount_off", label: "$ off" }, { value: "percent_off", label: "% off" },
  { value: "free_item", label: "Free item" }, { value: "bogo", label: "BOGO" },
];
const previewDate = new Intl.DateTimeFormat("en-US", { timeZone: CAMPUS_TZ, month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

function FieldError({ name, errors }: { name: keyof CreateDealErrors; errors: CreateDealErrors }) {
  return errors[name] ? <p id={`${name}-error`} className="mt-2 text-sm font-bold text-destructive">{errors[name]}</p> : null;
}

function readPhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read this photo. Try a different file."));
    reader.onload = () => {
      if (typeof reader.result !== "string") return reject(new Error("Could not read this photo."));
      const value = reader.result;
      const image = new window.Image();
      image.onload = () => resolve(value);
      image.onerror = () => reject(new Error("This file is not a readable photo. Choose a JPG, PNG, or WebP."));
      image.src = value;
    };
    reader.readAsDataURL(file);
  });
}

export function PostDealForm() {
  const { profile } = useBusiness();
  const [values, setValues] = useState(emptyValues);
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState("");
  const [photoReading, setPhotoReading] = useState(false);
  const [errors, setErrors] = useState<CreateDealErrors>({});
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<MyDeal | null>(null);
  const [errorFocusRequest, setErrorFocusRequest] = useState(0);
  const fileInput = useRef<HTMLInputElement>(null);
  const titleInput = useRef<HTMLInputElement>(null);
  const summary = useRef<HTMLDivElement>(null);
  const success = useRef<HTMLElement>(null);
  const photoReadId = useRef(0);
  const submitting = useRef(false);
  const hadSaved = useRef(false);

  useEffect(() => {
    if (saved) success.current?.focus();
    else if (hadSaved.current) titleInput.current?.focus();
    hadSaved.current = Boolean(saved);
  }, [saved]);
  useEffect(() => {
    if (errorFocusRequest > 0) summary.current?.focus();
  }, [errorFocusRequest]);

  const numericDiscount = values.discountType === "amount_off" || values.discountType === "percent_off";
  const previewStart = campusDateTimeToISO(`${values.startDate}T${values.startTime}`);
  const previewEnd = campusDateTimeToISO(`${values.endDate}T${values.endTime}`);
  const duration = previewStart && previewEnd ? (Date.parse(previewEnd) - Date.parse(previewStart)) / 1000 : 0;
  const previewWindow = duration > 0 ? `${Math.floor(duration / 3600)}:${String(Math.floor(duration % 3600 / 60)).padStart(2, "0")}:00 window` : "Choose a time window";
  function update<K extends keyof typeof values>(name: K, value: typeof values[K]) {
    setValues(current => ({ ...current, [name]: value }));
    setErrors(current => ({ ...current, [fieldNames[name]]: undefined }));
    setSaveError("");
  }
  function focusSummary() {
    setErrorFocusRequest(current => current + 1);
  }
  function resetForm() {
    ++photoReadId.current;
    setSaved(null);
    setValues(emptyValues);
    setPhoto(null);
    setPhotoName("");
    setPhotoReading(false);
    setErrors({});
    setSaveError("");
    if (fileInput.current) fileInput.current.value = "";
  }

  async function choosePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    if (file) await choosePhotoFile(file);
  }

  async function choosePhotoFile(file: File) {
    if (submitting.current) return;
    const readId = ++photoReadId.current;
    setPhoto(null);
    setPhotoName("");
    setErrors(current => ({ ...current, photo_url: undefined }));
    if (!DEAL_PHOTO_TYPES.includes(file.type) || file.size > MAX_DEAL_PHOTO_BYTES) {
      setErrors(current => ({ ...current, photo_url: "Choose a JPG, PNG, or WebP photo up to 5 MB." }));
      if (fileInput.current) fileInput.current.value = "";
      setPhotoReading(false);
      return;
    }
    setPhotoReading(true);
    try {
      const value = await readPhoto(file);
      if (readId === photoReadId.current) { setPhoto(value); setPhotoName(file.name); }
    } catch (error) {
      if (readId === photoReadId.current) {
        setErrors(current => ({ ...current, photo_url: error instanceof Error ? error.message : "Could not read this photo. Try again." }));
        if (fileInput.current) fileInput.current.value = "";
      }
    } finally {
      if (readId === photoReadId.current) setPhotoReading(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current || photoReading || !profile) return;
    setSaveError("");
    const startsAt = previewStart;
    const endsAt = previewEnd;
    const result = validateCreateDealInput({
      business_id: profile.business.id, title: values.title, description: values.description,
      discount_type: values.discountType,
      discount_value: numericDiscount ? (values.discountValue.trim() ? Number(values.discountValue) : NaN) : null,
      starts_at: startsAt ?? "", ends_at: endsAt ?? "",
      students_only: values.studentsOnly, photo_url: photo,
    });
    const fields: CreateDealErrors = result.ok ? {} : { ...result.fields };
    if (!startsAt) fields.starts_at = "Choose a valid start in campus time; avoid the daylight-saving transition hour.";
    if (!endsAt) fields.ends_at = "Choose a valid end in campus time; avoid the daylight-saving transition hour.";
    if (errors.photo_url) fields.photo_url = errors.photo_url;
    setErrors(fields);
    if (!result.ok || Object.values(fields).some(Boolean)) { focusSummary(); return; }

    submitting.current = true;
    setSaving(true);
    try {
      const response = await createDeal(result.value);
      if (response.ok) {
        setSaved(response.deal);
      } else if (response.error === "INVALID_DEAL") {
        setErrors(response.fields);
        focusSummary();
      } else {
        setSaveError("You do not have permission to post for this business.");
        focusSummary();
      }
    } catch {
      setSaveError("We could not save your deal. Your entries are still here; please try again.");
      focusSummary();
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  }

  if (!profile) return <BusinessLoading />;

  if (saved) {
    return (
      <section ref={success} tabIndex={-1} aria-labelledby="saved-heading" className="max-w-2xl rounded-card border border-border bg-surface-dashboard p-6 shadow-card outline-none sm:p-8">
        <span className="mb-4 inline-flex rounded-button bg-green-tint p-3 text-green"><Check aria-hidden="true" className="size-7" /></span>
        <h2 id="saved-heading" className="text-2xl">Deal saved to the demo</h2>
        <p className="mt-3 break-words text-lg font-bold">{saved.title}</p>
        <p className="mt-2 text-ink-muted">{saved.status === "live" ? "Live in this demo" : "Scheduled in this demo"} · {saved.students_only ? "UCR students only" : "Student deal"}</p>
        <p className="mt-3 text-sm text-ink-fine">This is sample data, not a published deal. Demo changes reset when the page reloads.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={resetForm} className="rounded-button">Post another deal</Button>
          <Link href="/dashboard/deals" onClick={resetForm} className={buttonVariants({ variant: "outline", className: "rounded-button" })}>View my deals</Link>
        </div>
      </section>
    );
  }

  const hasErrors = Object.values(errors).some(Boolean) || Boolean(saveError);
  return (
    <div className="grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
      <form onSubmit={submit} noValidate aria-label="Post a deal" aria-busy={saving} className="min-w-0 rounded-card bg-surface-dashboard p-5 shadow-card sm:p-7">
        <p className="mb-6 break-words text-sm text-ink-muted">Create a public deal for {profile.business.name}. Required fields are marked *.</p>
        {hasErrors && <div ref={summary} tabIndex={-1} role="alert" className="mb-6 rounded-button border border-destructive bg-destructive/5 p-4 text-sm text-destructive outline-none focus:ring-2 focus:ring-destructive">
          <p className="font-bold">{saveError || "Please check the highlighted fields."}</p>
          {Object.values(errors).filter(Boolean).map(message => <p key={message} className="mt-1">{message}</p>)}
        </div>}
        <fieldset disabled={saving} className="min-w-0 space-y-6 disabled:opacity-70">
          <div>
            <label htmlFor="deal-title" className="text-sm font-bold">Deal title *</label>
            <input ref={titleInput} id="deal-title" name="title" required maxLength={40} value={values.title} onChange={event => update("title", event.target.value)} placeholder="$2 off any burrito" aria-invalid={Boolean(errors.title)} aria-describedby={`title-count${errors.title ? " title-error" : ""}`} className={control} />
            <p id="title-count" className="mt-2 text-xs text-ink-fine">{values.title.length} / 40 characters</p>
            <FieldError name="title" errors={errors} />
          </div>
          <div>
            <label htmlFor="deal-description" className="text-sm font-bold">Description *</label>
            <textarea id="deal-description" name="description" required rows={4} value={values.description} onChange={event => update("description", event.target.value)} placeholder="What is included? Add any terms students should know." aria-invalid={Boolean(errors.description)} aria-describedby={errors.description ? "description-error" : undefined} className={`${control} resize-y`} />
            <FieldError name="description" errors={errors} />
          </div>
          <div>
            <div className="flex flex-wrap items-end gap-3">
              <fieldset className="min-w-0 flex-1" aria-describedby={errors.discount_type ? "discount_type-error" : undefined}>
                <legend className="text-sm font-bold">Discount *</legend>
                <div className="mt-2 grid grid-cols-2 gap-1 rounded-button bg-bg-dashboard p-1 min-[480px]:grid-cols-4">
                  {discounts.map(({ value, label }) => <label key={value} className="relative cursor-pointer">
                    <input className="peer sr-only" type="radio" name="discount_type" value={value} checked={values.discountType === value} onChange={() => { update("discountType", value); update("discountValue", ""); setErrors(current => ({ ...current, discount_type: undefined, discount_value: undefined })); }} />
                    <span className="flex min-h-11 items-center justify-center rounded-button px-2 text-sm font-bold peer-checked:bg-surface peer-checked:shadow-card peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-green">{label}</span>
                  </label>)}
                </div>
              </fieldset>
              {numericDiscount && <div className="w-32">
                <label htmlFor="discount-value" className="text-sm font-bold">{values.discountType === "amount_off" ? "Dollars off" : "Percent off"} *</label>
                <input id="discount-value" name="discount_value" type="number" inputMode="decimal" min="0.01" max={values.discountType === "percent_off" ? 100 : undefined} step="0.01" required value={values.discountValue} onChange={event => update("discountValue", event.target.value)} aria-invalid={Boolean(errors.discount_value)} aria-describedby={errors.discount_value ? "discount_value-error" : undefined} className={control} />
              </div>}
            </div>
            <FieldError name="discount_type" errors={errors} />
            <FieldError name="discount_value" errors={errors} />
          </div>
          {!numericDiscount && <p className="text-sm text-ink-muted">Describe the free item or BOGO offer in your title and description.</p>}

          <section aria-label="Deal schedule" className="min-w-0">
            <p id="schedule-help" className="mt-1 text-sm text-ink-fine">{DEAL_TIMEZONE_LABEL}. This deal runs once.</p>
            <div className="mt-3 grid min-w-0 gap-4 sm:grid-cols-2">
              <div className="min-w-0">
                <div className="flex min-h-11 flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-bold">Starts *</p>
                  <Button type="button" variant="link" size="sm" onClick={() => { const now = campusDateTimeInput(new Date()); update("startDate", now.slice(0, 10)); update("startTime", now.slice(11)); }}>Start now</Button>
                </div>
                <div className="grid min-w-0 grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-2">
                  <div className="min-w-0"><label htmlFor="deal-start-date" className="sr-only">Start date *</label><input id="deal-start-date" type="date" required value={values.startDate} onChange={event => update("startDate", event.target.value)} aria-invalid={Boolean(errors.starts_at)} aria-describedby={`schedule-help${errors.starts_at ? " starts_at-error" : ""}`} className={control} /></div>
                  <div className="min-w-0"><label htmlFor="deal-start-time" className="sr-only">Start time *</label><input id="deal-start-time" type="time" required value={values.startTime} onChange={event => update("startTime", event.target.value)} aria-invalid={Boolean(errors.starts_at)} aria-describedby={`schedule-help${errors.starts_at ? " starts_at-error" : ""}`} className={control} /></div>
                </div>
                <FieldError name="starts_at" errors={errors} />
              </div>
              <div className="min-w-0">
                <p className="flex min-h-11 items-center text-sm font-bold">Ends *</p>
                <div className="grid min-w-0 grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-2">
                  <div className="min-w-0"><label htmlFor="deal-end-date" className="sr-only">End date *</label><input id="deal-end-date" type="date" required value={values.endDate} onChange={event => update("endDate", event.target.value)} aria-invalid={Boolean(errors.ends_at)} aria-describedby={`schedule-help${errors.ends_at ? " ends_at-error" : ""}`} className={control} /></div>
                  <div className="min-w-0"><label htmlFor="deal-end-time" className="sr-only">End time *</label><input id="deal-end-time" type="time" required value={values.endTime} onChange={event => update("endTime", event.target.value)} aria-invalid={Boolean(errors.ends_at)} aria-describedby={`schedule-help${errors.ends_at ? " ends_at-error" : ""}`} className={control} /></div>
                </div>
                <FieldError name="ends_at" errors={errors} />
              </div>
            </div>
          </section>

          <div>
            <label htmlFor="deal-photo" className="text-sm font-bold">Deal photo (optional)</label>
            <p id="photo-help" className="mt-1 text-sm text-ink-fine">JPG, PNG, or WebP · up to 5 MB. Photos stay in this demo only.</p>
            <div onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); const file = event.dataTransfer.files[0]; if (file && !saving) void choosePhotoFile(file); }} className="mt-3 rounded-button border-2 border-dashed border-border-strong bg-surface p-4 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-green">
              <label htmlFor="deal-photo" className="flex min-h-16 cursor-pointer items-center gap-4">
                <span className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-button bg-peach-deep text-brown">{photo ? <Image src={photo} alt="" fill unoptimized sizes="64px" className="object-cover" /> : <ImagePlus aria-hidden="true" className="size-7" />}</span>
                <span className="min-w-0 text-sm"><span className="block break-words font-bold">{photoName || "Add a photo of your deal"}</span><span className="mt-1 block text-ink-muted">Drop a photo or <span className="font-bold text-green-dark underline">browse</span></span></span>
              </label>
              <input ref={fileInput} id="deal-photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={choosePhoto} aria-invalid={Boolean(errors.photo_url)} aria-describedby={`photo-help${errors.photo_url ? " photo_url-error" : ""}`} className="sr-only" />
            </div>
            <FieldError name="photo_url" errors={errors} />
            <p role="status" className="mt-2 text-sm text-ink-muted">{photoReading ? "Reading photo…" : ""}</p>
            {(photo || errors.photo_url) && <Button type="button" variant="ghost" onClick={() => { ++photoReadId.current; setPhoto(null); setPhotoName(""); setPhotoReading(false); setErrors(current => ({ ...current, photo_url: undefined })); if (fileInput.current) fileInput.current.value = ""; }}>Remove photo</Button>}
          </div>
          <label className="flex min-h-16 cursor-pointer items-center justify-between gap-4 rounded-button bg-peach/50 p-4">
            <span><span className="block text-sm font-bold">UCR students only</span><span id="students-help" className="mt-1 block text-xs text-ink-muted">Show the UCR badge. Every redemption requires a verified student account.</span></span>
            <input type="checkbox" role="switch" aria-label="UCR students only" aria-describedby="students-help" name="students_only" checked={values.studentsOnly} onChange={event => update("studentsOnly", event.target.checked)} className="peer sr-only" />
            <span aria-hidden="true" className="flex h-11 w-14 shrink-0 items-center rounded-pill bg-ink-muted px-1 peer-checked:justify-end peer-checked:bg-green peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-green"><span className="size-7 rounded-pill bg-surface" /></span>
          </label>
          <div className="flex flex-wrap gap-3 border-t border-border-soft pt-6">
            <Button type="submit" size="lg" disabled={photoReading || saving} className="w-full rounded-button"><Plus aria-hidden="true" className="size-5" />{saving ? "Saving…" : "Post deal to demo"}</Button>
            <Link href="/dashboard" onClick={resetForm} aria-disabled={saving || undefined} tabIndex={saving ? -1 : undefined} className={buttonVariants({ variant: "outline", size: "lg", className: `rounded-button ${saving ? "pointer-events-none opacity-50" : ""}` })}>Cancel</Link>
          </div>
          <p className="text-xs leading-relaxed text-ink-fine">Demo only. Nothing is published to students, and saved deals reset on page reload.</p>
        </fieldset>
      </form>

      <aside aria-label="Deal preview" className="min-w-0 self-start xl:sticky xl:top-6">
        <h2 className="mb-3 font-sans text-xs font-extrabold tracking-wider text-ink-muted">WHAT STUDENTS SEE</h2>
        <article className="overflow-hidden rounded-card border border-border bg-surface shadow-card">
          <div className="relative flex aspect-[16/9] items-center justify-center bg-peach-deep">
            {photo ? <Image src={photo} alt="Deal photo preview" fill unoptimized sizes="(min-width: 1280px) 300px, 100vw" className="object-cover" /> : <ImagePlus aria-hidden="true" className="size-12 text-brown" strokeWidth={1.5} />}
            <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-pill bg-surface px-3 py-2 text-xs font-bold"><Clock3 aria-hidden="true" className="size-4 text-green" />{previewWindow}</span>
            {values.studentsOnly && <span className="absolute right-3 top-3 rounded-pill bg-surface px-3 py-2 text-xs font-extrabold text-brown">UCR students only</span>}
          </div>
          <div className="space-y-3 p-4">
            <p className="break-words text-sm font-bold text-ink-muted">{profile.business.name} · {profile.business.is_truck ? "food truck" : "restaurant"}</p>
            <h3 className="break-words text-2xl">{values.title.trim() || "Your deal title"}</h3>
            <p className="flex items-start gap-2 text-sm font-bold text-green-dark"><Tag aria-hidden="true" className="size-4 shrink-0" />{values.discountType === "free_item" ? "Free item" : values.discountType === "bogo" ? "Buy one, get one free" : values.discountType === "percent_off" ? `${values.discountValue || "—"}% off` : `$${values.discountValue || "—"} off`}</p>
            <p className="text-xs leading-relaxed text-ink-fine">{previewStart && previewEnd && duration > 0 ? `${previewDate.format(new Date(previewStart))} – ${previewDate.format(new Date(previewEnd))} · UC Riverside time` : "Set your start and end times to preview the schedule."}</p>
            <p className="border-t border-border-soft pt-3 text-xs text-ink-fine">Preview only · not published</p>
          </div>
        </article>
        <p className="mt-4 text-sm leading-relaxed text-ink-muted">Students redeem by scanning your Grove sticker at the counter.</p>
      </aside>
    </div>
  );
}
