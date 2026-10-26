"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Check, ImagePlus, Plus, Tag } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { createDeal } from "@/lib/supabase/business";
import { campusDateTimeInput, campusDateTimeToISO, DEAL_PHOTO_TYPES, DEAL_TIMEZONE_LABEL, MAX_DEAL_PHOTO_BYTES, validateCreateDealInput } from "@/lib/supabase/deal-input";
import type { CreateDealErrors, DiscountType, MyDeal } from "@/lib/supabase/types";

const control = "mt-2 block min-h-12 w-full min-w-0 rounded-button border border-border-strong bg-surface-dashboard px-3 py-2.5 text-base outline-none focus-visible:border-green focus-visible:ring-2 focus-visible:ring-green/30 aria-invalid:border-destructive";
const emptyValues = { title: "", description: "", discountType: "amount_off" as DiscountType, discountValue: "", start: "", end: "", studentsOnly: true };
const fieldNames = { title: "title", description: "description", discountType: "discount_type", discountValue: "discount_value", start: "starts_at", end: "ends_at", studentsOnly: "students_only" } as const;

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
  const [values, setValues] = useState(emptyValues);
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoReading, setPhotoReading] = useState(false);
  const [errors, setErrors] = useState<CreateDealErrors>({});
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<MyDeal | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const titleInput = useRef<HTMLInputElement>(null);
  const summary = useRef<HTMLDivElement>(null);
  const success = useRef<HTMLElement>(null);
  const photoReadId = useRef(0);
  const submitting = useRef(false);

  const numericDiscount = values.discountType === "amount_off" || values.discountType === "percent_off";
  function update<K extends keyof typeof values>(name: K, value: typeof values[K]) {
    setValues(current => ({ ...current, [name]: value }));
    setErrors(current => ({ ...current, [fieldNames[name]]: undefined }));
    setSaveError("");
  }
  function focusSummary() {
    requestAnimationFrame(() => summary.current?.focus());
  }
  function resetForm() {
    ++photoReadId.current;
    setSaved(null);
    setValues(emptyValues);
    setPhoto(null);
    setPhotoReading(false);
    setErrors({});
    setSaveError("");
    if (fileInput.current) fileInput.current.value = "";
  }

  async function choosePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    const readId = ++photoReadId.current;
    setPhoto(null);
    setErrors(current => ({ ...current, photo_url: undefined }));
    if (!file) { setPhotoReading(false); return; }
    if (!DEAL_PHOTO_TYPES.includes(file.type) || file.size > MAX_DEAL_PHOTO_BYTES) {
      setErrors(current => ({ ...current, photo_url: "Choose a JPG, PNG, or WebP photo up to 5 MB." }));
      event.currentTarget.value = "";
      setPhotoReading(false);
      return;
    }
    setPhotoReading(true);
    try {
      const value = await readPhoto(file);
      if (readId === photoReadId.current) setPhoto(value);
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
    if (submitting.current || photoReading) return;
    setSaveError("");
    const startsAt = campusDateTimeToISO(values.start);
    const endsAt = campusDateTimeToISO(values.end);
    const result = validateCreateDealInput({
      business_id: "biz-opt", title: values.title, description: values.description,
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
        requestAnimationFrame(() => success.current?.focus());
      } else if (response.error === "INVALID_DEAL") {
        setErrors(response.fields);
        focusSummary();
      } else {
        setSaveError("You do not have permission to post for this business. This demo uses Orange Peel Tacos.");
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

  if (saved) {
    return (
      <section ref={success} tabIndex={-1} aria-labelledby="saved-heading" className="max-w-2xl rounded-card border border-border bg-surface-dashboard p-6 shadow-card outline-none sm:p-8">
        <span className="mb-4 inline-flex rounded-button bg-green-tint p-3 text-green"><Check aria-hidden="true" className="size-7" /></span>
        <h2 id="saved-heading" className="text-2xl">Deal saved to the demo</h2>
        <p className="mt-3 break-words text-lg font-bold">{saved.title}</p>
        <p className="mt-2 text-ink-muted">{saved.status === "live" ? "Live in this demo" : "Scheduled in this demo"} · {saved.students_only ? "UCR students only" : "All students"}</p>
        <p className="mt-3 text-sm text-ink-fine">This is sample data, not a published deal. Demo changes reset when the page reloads.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={() => { resetForm(); requestAnimationFrame(() => titleInput.current?.focus()); }} className="rounded-button">Post another deal</Button>
          <Link href="/dashboard/deals" onClick={resetForm} className={buttonVariants({ variant: "outline", className: "rounded-button" })}>View my deals</Link>
        </div>
      </section>
    );
  }

  const hasErrors = Object.values(errors).some(Boolean) || Boolean(saveError);
  return (
    <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <form onSubmit={submit} noValidate aria-label="Post a deal" aria-busy={saving} className="min-w-0 rounded-card border border-border bg-surface-dashboard p-5 shadow-card sm:p-6">
        <p className="mb-6 text-sm text-ink-muted">Create a public deal for Orange Peel Tacos. Required fields are marked *.</p>
        {hasErrors && <div ref={summary} tabIndex={-1} role="alert" className="mb-6 rounded-button border border-destructive bg-destructive/5 p-4 text-sm text-destructive outline-none focus:ring-2 focus:ring-destructive">
          <p className="font-bold">{saveError || "Please check the highlighted fields."}</p>
          {Object.values(errors).filter(Boolean).map(message => <p key={message} className="mt-1">{message}</p>)}
        </div>}
        <fieldset disabled={saving} className="min-w-0 space-y-6 disabled:opacity-70">
          <div>
            <label htmlFor="deal-title" className="text-sm font-bold">Deal title *</label>
            <input ref={titleInput} id="deal-title" name="title" required value={values.title} onChange={event => update("title", event.target.value)} placeholder="$2 off any burrito" aria-invalid={Boolean(errors.title)} aria-describedby={errors.title ? "title-error" : undefined} className={control} />
            <FieldError name="title" errors={errors} />
          </div>
          <div>
            <label htmlFor="deal-description" className="text-sm font-bold">Description *</label>
            <textarea id="deal-description" name="description" required rows={4} value={values.description} onChange={event => update("description", event.target.value)} placeholder="What is included? Add any terms students should know." aria-invalid={Boolean(errors.description)} aria-describedby={errors.description ? "description-error" : undefined} className={`${control} resize-y`} />
            <FieldError name="description" errors={errors} />
          </div>
          <div className="grid min-w-0 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="discount-type" className="text-sm font-bold">Discount type *</label>
              <select id="discount-type" name="discount_type" value={values.discountType} onChange={event => { update("discountType", event.target.value as DiscountType); update("discountValue", ""); setErrors(current => ({ ...current, discount_type: undefined, discount_value: undefined })); }} aria-invalid={Boolean(errors.discount_type)} aria-describedby={errors.discount_type ? "discount_type-error" : undefined} className={control}>
                <option value="amount_off">Amount off ($)</option><option value="percent_off">Percent off (%)</option><option value="free_item">Free item</option><option value="bogo">Buy one, get one free</option>
              </select>
              <FieldError name="discount_type" errors={errors} />
            </div>
            {numericDiscount && <div>
              <label htmlFor="discount-value" className="text-sm font-bold">{values.discountType === "amount_off" ? "Dollars off" : "Percent off"} *</label>
              <input id="discount-value" name="discount_value" type="number" inputMode="decimal" min="0.01" max={values.discountType === "percent_off" ? 100 : undefined} step="0.01" required value={values.discountValue} onChange={event => update("discountValue", event.target.value)} aria-invalid={Boolean(errors.discount_value)} aria-describedby={errors.discount_value ? "discount_value-error" : undefined} className={control} />
              <FieldError name="discount_value" errors={errors} />
            </div>}
          </div>
          {!numericDiscount && <p className="text-sm text-ink-muted">Describe the free item or BOGO offer in your title and description.</p>}

          <section aria-labelledby="schedule-heading" className="min-w-0">
            <h2 id="schedule-heading" className="text-xl">When does it run?</h2>
            <p id="schedule-help" className="mt-1 text-sm text-ink-fine">{DEAL_TIMEZONE_LABEL}. This deal runs once.</p>
            <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2">
              <div className="min-w-0">
                <div className="flex min-h-11 flex-wrap items-center justify-between gap-2">
                  <label htmlFor="deal-start" className="text-sm font-bold">Starts *</label>
                  <Button type="button" variant="link" size="sm" onClick={() => update("start", campusDateTimeInput(new Date()))}>Start now</Button>
                </div>
                <input id="deal-start" name="starts_at" type="datetime-local" required value={values.start} onChange={event => update("start", event.target.value)} aria-invalid={Boolean(errors.starts_at)} aria-describedby={`schedule-help${errors.starts_at ? " starts_at-error" : ""}`} className={control} />
                <FieldError name="starts_at" errors={errors} />
              </div>
              <div className="min-w-0">
                <label htmlFor="deal-end" className="flex min-h-11 items-center text-sm font-bold">Ends *</label>
                <input id="deal-end" name="ends_at" type="datetime-local" required value={values.end} onChange={event => update("end", event.target.value)} aria-invalid={Boolean(errors.ends_at)} aria-describedby={`schedule-help${errors.ends_at ? " ends_at-error" : ""}`} className={control} />
                <FieldError name="ends_at" errors={errors} />
              </div>
            </div>
          </section>

          <div>
            <label htmlFor="deal-photo" className="text-sm font-bold">Deal photo (optional)</label>
            <p id="photo-help" className="mt-1 text-sm text-ink-fine">JPG, PNG, or WebP · up to 5 MB. Photos stay in this demo only.</p>
            <input ref={fileInput} id="deal-photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={choosePhoto} aria-invalid={Boolean(errors.photo_url)} aria-describedby={`photo-help${errors.photo_url ? " photo_url-error" : ""}`} className={`${control} text-sm file:mr-3 file:min-h-11 file:rounded-button file:border-0 file:bg-green-tint file:px-3 file:font-bold file:text-green-dark`} />
            <FieldError name="photo_url" errors={errors} />
            <p role="status" className="mt-2 text-sm text-ink-muted">{photoReading ? "Reading photo…" : ""}</p>
            {(photo || errors.photo_url) && <Button type="button" variant="ghost" onClick={() => { ++photoReadId.current; setPhoto(null); setPhotoReading(false); setErrors(current => ({ ...current, photo_url: undefined })); if (fileInput.current) fileInput.current.value = ""; }}>Remove photo</Button>}
          </div>
          <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-bold">
            <input type="checkbox" name="students_only" checked={values.studentsOnly} onChange={event => update("studentsOnly", event.target.checked)} className="size-5 shrink-0 accent-green focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green" />
            UCR students only
          </label>
          <div className="flex flex-wrap gap-3 border-t border-border-soft pt-6">
            <Button type="submit" size="lg" disabled={photoReading || saving} className="rounded-button"><Plus aria-hidden="true" className="size-5" />{saving ? "Saving…" : "Post deal to demo"}</Button>
            <Link href="/dashboard" onClick={resetForm} aria-disabled={saving || undefined} tabIndex={saving ? -1 : undefined} className={buttonVariants({ variant: "outline", size: "lg", className: `rounded-button ${saving ? "pointer-events-none opacity-50" : ""}` })}>Cancel</Link>
          </div>
          <p className="text-xs leading-relaxed text-ink-fine">Demo only. Nothing is published to students, and saved deals reset on page reload.</p>
        </fieldset>
      </form>

      <aside aria-label="Deal preview" className="min-w-0 self-start xl:sticky xl:top-6">
        <h2 className="mb-3 text-xl">Deal preview</h2>
        <article className="overflow-hidden rounded-card border border-border bg-surface-dashboard shadow-card">
          <div className="relative flex aspect-[16/10] items-center justify-center bg-peach-deep">
            {photo ? <Image src={photo} alt="Deal photo preview" fill unoptimized sizes="(min-width: 1280px) 400px, 100vw" className="object-cover" /> : <ImagePlus aria-hidden="true" className="size-12 text-brown" strokeWidth={1.5} />}
            {values.studentsOnly && <span className="absolute right-3 top-3 rounded-pill bg-surface px-3 py-2 text-xs font-extrabold text-brown">UCR students only</span>}
          </div>
          <div className="space-y-3 p-5">
            <p className="text-sm font-bold text-ink-muted">Orange Peel Tacos · taco truck</p>
            <h3 className="break-words text-2xl">{values.title.trim() || "Your deal title"}</h3>
            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-ink-muted">{values.description.trim() || "Tell students what is included and when to stop by."}</p>
            <p className="flex items-start gap-2 text-sm font-bold text-green-dark"><Tag aria-hidden="true" className="size-4 shrink-0" />{values.discountType === "free_item" ? "Free item" : values.discountType === "bogo" ? "Buy one, get one free" : values.discountType === "percent_off" ? `${values.discountValue || "—"}% off` : `$${values.discountValue || "—"} off`}</p>
            <p className="border-t border-border-soft pt-3 text-xs text-ink-fine">Preview only · not published</p>
          </div>
        </article>
      </aside>
    </div>
  );
}
