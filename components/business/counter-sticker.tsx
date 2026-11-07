"use client";

import Image from "next/image";
import { Download, QrCode } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { BusinessLoading, useBusiness } from "./business-context";
import { getBusinessSticker, isMockData, type BusinessSticker } from "@/lib/supabase";
import { BusinessAccessError } from "@/lib/supabase/business-errors";
import { STICKER_DPI, STICKER_SIZES, stickerUrl, type StickerSize } from "./sticker-format";
import { renderStickerPng } from "./render-sticker";

type Asset = { key: string; url: string } | { key: string; error: string };

export function CounterSticker() {
  const { profile } = useBusiness();
  return profile ? <StickerPanel key={profile.business.id} businessId={profile.business.id} /> : <BusinessLoading />;
}

function StickerPanel({ businessId }: { businessId: string }) {
  const [result, setResult] = useState<{ sticker: BusinessSticker | null } | null>(null);
  const [loadError, setLoadError] = useState("");
  const [loadRevision, setLoadRevision] = useState(0);
  const [size, setSize] = useState<StickerSize>(4);
  const [asset, setAsset] = useState<Asset | null>(null);
  const [renderRevision, setRenderRevision] = useState(0);
  const [message, setMessage] = useState("");
  useEffect(() => {
    let active = true;
    getBusinessSticker({ businessId }).then(sticker => { if (active) setResult({ sticker }); })
      .catch(error => { if (active) setLoadError(error instanceof BusinessAccessError
        ? "Sign in with a current membership for this business to load its sticker."
        : "We could not load your sticker. Please try again."); });
    return () => { active = false; };
  }, [businessId, loadRevision]);

  const sticker = result?.sticker;
  let url = "";
  let configurationError = "";
  if (sticker) {
    try { url = stickerUrl(sticker.qr_slug, process.env.NEXT_PUBLIC_SITE_URL); }
    catch (error) { configurationError = error instanceof Error ? error.message : "The sticker link is unavailable."; }
  }
  const name = sticker?.business_name ?? "";
  const renderKey = JSON.stringify([url, name, size, renderRevision]);
  useEffect(() => {
    if (!url) return;
    let active = true;
    let objectUrl: string | null = null;
    renderStickerPng({ url, name, inches: size, demo: isMockData })
      .then(blob => {
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setAsset({ key: renderKey, url: objectUrl });
      })
      .catch(error => { if (active) setAsset({ key: renderKey, error: error instanceof Error ? error.message : "We could not prepare the sticker. Please try again." }); });
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [url, name, size, renderKey]);

  function retryLoad() { setResult(null); setLoadError(""); setAsset(null); setMessage(""); setLoadRevision(value => value + 1); }
  const current = asset?.key === renderKey ? asset : null;
  function download() {
    if (!current || !("url" in current) || !sticker) return;
    const anchor = document.createElement("a");
    try {
      anchor.href = current.url;
      anchor.download = `grove-${isMockData ? "demo-" : ""}counter-sticker-${sticker.qr_slug.slice(0, 64)}-${size}in.png`;
      document.body.append(anchor); anchor.click();
      setMessage("PNG download started. Print at actual size (100%) to keep the selected dimensions.");
    } catch { setMessage("The browser could not start the download. Please try again."); }
    finally { anchor.remove(); }
  }

  if (loadError) return <section role="alert" className="rounded-card border border-border bg-surface-dashboard p-6"><p className="text-destructive">{loadError}</p><Button onClick={retryLoad} className="mt-4">Retry sticker</Button></section>;
  if (!result) return <p role="status" className="p-6 text-ink-muted">Loading your permanent sticker…</p>;
  if (!sticker) return <section className="rounded-card border border-border bg-surface-dashboard p-6"><h2 className="text-xl">Sticker not available</h2><p className="mt-3 text-ink-muted">This business has no permanent sticker link available. Ask the Grove coordinator to check its setup, then retry.</p><Button onClick={retryLoad} className="mt-4">Retry sticker</Button></section>;
  if (configurationError) return <section role="alert" className="rounded-card border border-border bg-surface-dashboard p-6"><h2 className="text-xl">Sticker link needs setup</h2><p className="mt-3 text-ink-muted">{configurationError}</p></section>;

  return <div className="grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
    <section aria-label="Counter sticker preview" aria-busy={!current} className="min-w-0 rounded-card bg-border-soft p-5 sm:p-7">
      {current && "url" in current ? <Image src={current.url} alt={`Grove counter sticker for ${name}`} width={size * STICKER_DPI} height={size * STICKER_DPI} unoptimized className="mx-auto aspect-square h-auto w-full max-w-md" />
        : <div className="flex aspect-square flex-col items-center justify-center gap-4 rounded-card bg-bg-dashboard p-5 text-center">
          <QrCode aria-hidden="true" className="size-10 text-green" />
          {current && "error" in current ? <><p role="alert" className="text-sm text-destructive">{current.error}</p><Button onClick={() => setRenderRevision(value => value + 1)}>Retry image</Button></> : <p role="status" className="text-ink-muted">Preparing your sticker…</p>}
        </div>}
      <p className="mt-4 text-xs font-bold text-ink-muted">Permanent counter link</p>
      <p className="mt-2 text-sm text-green-dark [overflow-wrap:anywhere]">{url}</p>
      {isMockData && <p className="mt-3 text-sm text-ink-fine">Demo sticker. Use this only to review the local preview; the printed image is marked DEMO.</p>}
    </section>
    <section aria-labelledby="print-heading" className="min-w-0 rounded-card border border-border bg-surface-dashboard p-5 shadow-card sm:p-7">
      <h2 id="print-heading" className="text-2xl">Print it</h2>
      <fieldset className="mt-5">
        <legend className="text-sm font-bold">Sticker size</legend>
        <div className="mt-3 flex flex-wrap gap-2">{STICKER_SIZES.map(inches => <label key={inches} className="relative cursor-pointer"><input type="radio" name="sticker-size" value={inches} checked={size === inches} onChange={() => { setSize(inches); setMessage(""); }} className="peer sr-only" /><span className="flex min-h-11 items-center justify-center rounded-pill border border-border-strong px-4 text-sm font-bold peer-checked:border-ink peer-checked:bg-ink peer-checked:text-surface peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-green">{inches} × {inches} in</span></label>)}</div>
      </fieldset>
      <p className="mt-4 text-sm text-ink-muted">{size * STICKER_DPI} × {size * STICKER_DPI} pixels · {STICKER_DPI} DPI PNG</p>
      <Button size="lg" disabled={!current || !("url" in current)} onClick={download} className="mt-6 w-full rounded-button bg-green text-surface hover:bg-green-dark"><Download aria-hidden="true" className="size-5" />Download PNG to print</Button>
      <p role="status" className="mt-3 text-sm text-green-dark">{message}</p>
      <p className="mt-5 text-sm leading-relaxed text-ink-muted">Print at actual size (100%), with no fit-to-page scaling. Keep the white border around the QR clear. Weatherproof sticker paper works best on a food truck window.</p>
      <p className="mt-4 text-sm leading-relaxed text-ink-muted">Put it by the register. This permanent counter sticker is used inside Grove to redeem live deals; a deal’s advertising QR is separate.</p>
    </section>
  </div>;
}
