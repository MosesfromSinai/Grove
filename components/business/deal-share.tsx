"use client";

// Share a deal (#115): copy its /deals/<id> link or download its QR for flyers and group chats.
import { useEffect, useRef, useState } from "react";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MyDeal } from "@/lib/supabase";
import { dealQrPng, dealUrl, qrFileName } from "@/lib/deal-link";

export function DealShare({ deal }: { deal: Pick<MyDeal, "id" | "title" | "visibility"> }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [qr, setQr] = useState<string | null>(null);
  const [copied, setCopied] = useState<"yes" | "failed" | null>(null);

  useEffect(() => {
    if (!open) return;
    const link = dealUrl(window.location.origin, deal.id);
    let active = true;
    queueMicrotask(() => active && setUrl(link));
    dealQrPng(link).then((png) => active && setQr(png)).catch(() => {}); // the link still works without the QR
    dialog.current?.showModal();
    return () => {
      active = false;
    };
  }, [open, deal.id]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied("yes");
    } catch {
      setCopied("failed");
    }
  }

  return <>
    <Button variant="outline" onClick={() => { setCopied(null); setOpen(true); }} className="rounded-button">
      <Share2 aria-hidden="true" className="size-4" />Share
    </Button>
    <dialog ref={dialog} aria-labelledby={`share-${deal.id}`} onClose={() => setOpen(false)}
      className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-card border border-border bg-surface-dashboard p-6 shadow-card backdrop:bg-ink/40">
      {open && <>
        <h2 id={`share-${deal.id}`} className="text-2xl [overflow-wrap:anywhere]">Share {deal.title}</h2>
        <p className="mt-2 text-sm text-ink-muted">
          {deal.visibility === "link_only" ? "Link only: share this with your group. It isn't in the feed or on the map." : "Post it on flyers or in group chats."}
        </p>
        <p className="mt-4 break-all rounded-button bg-surface p-3 text-sm font-semibold">{url}</p>
        <div className="mt-3 flex flex-wrap gap-3">
          <Button onClick={copy} className="rounded-button">{copied === "yes" ? "Copied" : "Copy link"}</Button>
          {qr && <a href={qr} download={qrFileName(deal.title)} className="inline-flex min-h-11 items-center font-bold text-green-dark underline">Download QR</a>}
        </div>
        {copied === "failed" && <p role="alert" className="mt-2 text-sm text-destructive">Couldn&apos;t copy. Select the link and copy it by hand.</p>}
        {/* eslint-disable-next-line @next/next/no-img-element -- generated data URL */}
        {qr && <img src={qr} alt={`QR code for ${deal.title}`} className="mx-auto mt-4 size-48" />}
        <p className="mt-4 text-xs text-ink-fine">This link only opens the deal. Students still redeem with the counter sticker.</p>
        <Button variant="outline" onClick={() => dialog.current?.close()} className="mt-5 rounded-button">Done</Button>
      </>}
    </dialog>
  </>;
}
