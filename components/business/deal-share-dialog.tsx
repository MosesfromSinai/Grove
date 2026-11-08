"use client";

import Image from "next/image";
import { Copy, Download, ExternalLink, QrCode, X } from "lucide-react";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { isMockData, type MyDeal } from "@/lib/supabase";
import { dealShareUrl } from "./deal-share-format";
import { DEAL_QR_PIXELS, renderDealQrPng } from "./render-deal-qr";

type Asset = { key: string; url: string } | { key: string; error: string };

export function DealShareDialog({ deal, onClose }: { deal: MyDeal; onClose: () => void }) {
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const linkInput = useRef<HTMLInputElement>(null);
  const life = useRef({ active: false, copying: false });
  const [asset, setAsset] = useState<Asset | null>(null);
  const [revision, setRevision] = useState(0);
  const [message, setMessage] = useState("");
  const [copying, setCopying] = useState(false);
  let url = "";
  let configurationError = "";
  try { url = dealShareUrl(deal.id, process.env.NEXT_PUBLIC_SITE_URL); }
  catch (error) { configurationError = error instanceof Error ? error.message : "The deal link is unavailable."; }
  const renderKey = JSON.stringify([url, revision]);

  useLayoutEffect(() => {
    const current = life.current;
    current.active = true;
    const modal = dialog.current;
    modal?.showModal();
    return () => { current.active = false; modal?.close(); };
  }, []);
  useEffect(() => {
    if (!url) return;
    let active = true;
    let objectUrl: string | null = null;
    renderDealQrPng({ url, demo: isMockData }).then(blob => {
      if (!active) return;
      objectUrl = URL.createObjectURL(blob);
      setAsset({ key: renderKey, url: objectUrl });
    }).catch(error => { if (active) setAsset({ key: renderKey, error: error instanceof Error ? error.message : "We could not prepare the QR. Try again." }); });
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [url, renderKey]);

  async function copy() {
    if (!url || life.current.copying) return;
    life.current.copying = true; setCopying(true); setMessage("");
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(url);
      if (life.current.active) setMessage("Deal link copied.");
    } catch {
      if (life.current.active) {
        setMessage("The browser could not copy the link. Select the link above and copy it manually.");
        linkInput.current?.focus(); linkInput.current?.select();
      }
    } finally { life.current.copying = false; if (life.current.active) setCopying(false); }
  }
  const current = asset?.key === renderKey ? asset : null;
  function download() {
    if (!current || !("url" in current)) return;
    const anchor = document.createElement("a");
    try {
      anchor.href = current.url;
      anchor.download = `grove-${isMockData ? "demo-" : ""}deal-${deal.id}-qr.png`;
      document.body.append(anchor); anchor.click();
      setMessage("QR download started. Keep the white border clear when adding it to a flyer.");
    } catch { setMessage("The browser could not start the download. Please try again."); }
    finally { anchor.remove(); }
  }

  return <dialog ref={dialog} aria-labelledby={`${id}-heading`} aria-describedby={`${id}-help`} onCancel={event => { event.preventDefault(); onClose(); }} onClose={event => { if (!event.currentTarget.open) onClose(); }} className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-card border border-border bg-surface-dashboard p-5 text-ink shadow-card backdrop:bg-ink/40 sm:p-7">
    <div className="flex items-start justify-between gap-4"><h2 id={`${id}-heading`} className="text-2xl">Share deal</h2><Button variant="ghost" size="icon" aria-label="Close sharing" onClick={onClose}><X aria-hidden="true" className="size-5" /></Button></div>
    <p className="mt-3 font-bold [overflow-wrap:anywhere]">{deal.title}</p>
    <p id={`${id}-help`} className="mt-3 text-sm leading-relaxed text-ink-muted">This link and QR open the deal in Grove. Students redeem in store using the normal Grove checks.</p>
    <p className="mt-3 text-sm font-bold text-green-dark">{deal.visibility === "link_only" ? "Link only · Hidden from the feed, map and counter sticker page. Share this link with your group." : "Public deal · Share in flyers and group chats."}</p>
    {deal.status === "ended" && <p className="mt-3 text-sm text-ink-fine">This deal has ended. Its link opens the details, but it cannot be redeemed.</p>}
    {deal.status === "scheduled" && <p className="mt-3 text-sm text-ink-fine">Redemption is available only during this deal’s scheduled windows.</p>}
    {isMockData && <p className="mt-3 text-sm font-bold text-brown">Demo link and QR. Sample deals are for preview only.</p>}
    {configurationError ? <p role="alert" className="mt-5 text-sm text-destructive">{configurationError}</p> : <>
      <label htmlFor={`${id}-link`} className="mt-5 block text-sm font-bold">Deal link</label>
      <input ref={linkInput} id={`${id}-link`} readOnly value={url} onFocus={event => event.target.select()} className="mt-2 block min-h-12 w-full min-w-0 rounded-button border border-border-strong bg-surface px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-green" />
      <div className="mt-3 flex flex-wrap gap-3"><Button variant="outline" disabled={copying} onClick={() => { void copy(); }}><Copy aria-hidden="true" className="size-4" />{copying ? "Copying…" : "Copy link"}</Button><a href={url} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "outline" })}><ExternalLink aria-hidden="true" className="size-4" />Open deal</a></div>
      <div aria-busy={!current} className="mt-5 rounded-button border border-border bg-surface p-4">
        {current && "url" in current ? <Image src={current.url} alt={`Deal link QR for ${deal.title}`} width={DEAL_QR_PIXELS} height={DEAL_QR_PIXELS} unoptimized className="mx-auto aspect-square h-auto w-full max-w-64" /> : <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-center"><QrCode aria-hidden="true" className="size-8 text-green" />{current && "error" in current ? <><p role="alert" className="text-sm text-destructive">{current.error}</p><Button variant="outline" onClick={() => setRevision(value => value + 1)}>Retry QR</Button></> : <p role="status" className="text-sm text-ink-muted">Preparing deal QR…</p>}</div>}
      </div>
      <Button disabled={!current || !("url" in current)} onClick={download} className="mt-4 w-full bg-green text-surface hover:bg-green-dark"><Download aria-hidden="true" className="size-4" />Download QR PNG</Button>
      <p className="mt-3 text-xs leading-relaxed text-ink-fine">1200 × 1200 pixels · 300 DPI PNG. This advertising QR opens the deal; scanning it does not apply a discount or verify a visit.</p>
    </>}
    <p role="status" className="mt-3 text-sm text-green-dark">{message}</p>
  </dialog>;
}
