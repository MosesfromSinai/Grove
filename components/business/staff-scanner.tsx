"use client";

import Link from "next/link";
import { Camera, CameraOff, Check, LoaderCircle, ScanLine, TriangleAlert, X } from "lucide-react";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { isMockData, staffRedeem } from "@/lib/supabase";
import { CAMPUS_TZ } from "@/lib/supabase/deal-status";
import { BusinessLoading, useBusiness } from "./business-context";
import { confirmedStaffVisit, staffScanToken } from "./staff-scan-format";
import { startStaffCamera } from "./staff-camera";

type Phase = "idle" | "starting" | "scanning" | "checking" | "verified" | "invalid" | "camera-error" | "uncertain" | "paused";
type Visit = { title: string; redeemedAt: string };
const dateTime = new Intl.DateTimeFormat("en-US", { timeZone: CAMPUS_TZ, month: "short", day: "numeric", hour: "numeric", minute: "2-digit", second: "2-digit" });
const uncertainMessage = "This visit may have been recorded, but we could not confirm the result. Check Overview and the student’s confirmation before scanning again. We will not retry automatically.";

export function StaffScannerPage() {
  const { profile } = useBusiness();
  if (!profile) return <BusinessLoading />;
  // #20's functions are absent. Never call an unavailable real endpoint or
  // request camera access until hosted staff-scan readiness is verified.
  if (!isMockData) return <section className="rounded-card border border-border bg-surface-dashboard p-6 shadow-card"><h2 className="text-xl">Staff scanning is not available yet</h2><p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-muted">Use the counter sticker or backup PIN for now. Grove will enable staff scanning when it is ready for your business.</p></section>;
  if (profile.business.redemption_mode !== "staff_scan") return <section className="rounded-card border border-border bg-surface-dashboard p-6 shadow-card"><h2 className="text-xl">This business uses counter stickers</h2><p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-muted">An owner can choose Staff scan in QR sticker &amp; PIN before using this scanner.</p><Link href="/dashboard/settings" className={buttonVariants({ variant: "outline", className: "mt-5" })}>Open redemption settings</Link></section>;
  return <Scanner key={profile.business.id} businessId={profile.business.id} businessName={profile.business.name} />;
}

function Scanner({ businessId, businessName }: { businessId: string; businessName: string }) {
  const { refresh } = useBusiness();
  const [phase, setPhase] = useState<Phase>("idle");
  const [visit, setVisit] = useState<Visit | null>(null);
  const [reason, setReason] = useState("");
  const [blocked, setBlocked] = useState(false);
  const result = useRef<HTMLElement>(null);
  const life = useRef({ active: false, accepting: false, pending: false, running: false, uncertain: false, version: 0 });
  const readerId = useId();

  useLayoutEffect(() => {
    const current = life.current; current.active = true;
    function leave() {
      ++current.version; current.accepting = false;
      const uncertain = current.pending || current.uncertain;
      current.pending = false; current.uncertain = uncertain;
      setVisit(null);
      setReason(uncertain ? uncertainMessage : "");
      setPhase(uncertain ? "uncertain" : current.running ? "paused" : "idle");
      current.running = false;
    }
    function hidden() { if (document.visibilityState === "hidden") leave(); }
    document.addEventListener("visibilitychange", hidden); window.addEventListener("pagehide", leave);
    return () => { current.active = false; leave(); document.removeEventListener("visibilitychange", hidden); window.removeEventListener("pagehide", leave); };
  }, []);
  useEffect(() => { if (["verified", "invalid", "uncertain", "camera-error"].includes(phase)) result.current?.focus(); }, [phase]);

  function start() {
    if (blocked || life.current.pending) return;
    life.current.accepting = true; life.current.running = true; life.current.uncertain = false;
    setVisit(null); setReason(""); setPhase("starting");
  }
  function stop() { life.current.accepting = false; life.current.running = false; setPhase("idle"); }
  const decoded = useCallback(async (text: string) => {
    const current = life.current;
    if (!current.active || !current.accepting || current.pending) return;
    current.accepting = false; current.running = false;
    const token = staffScanToken(text);
    if (!token) { setReason("That QR is not a changing in-store code. Ask the student to show their latest code in Grove."); setPhase("invalid"); return; }
    current.pending = true; const request = ++current.version; setPhase("checking");
    try {
      const response = confirmedStaffVisit(await staffRedeem({ token }), businessId);
      if (!current.active || request !== current.version) return;
      if (response.ok) { setVisit(response); setPhase("verified"); }
      else { setReason(response.reason); setPhase("invalid"); if (["NOT_SIGNED_IN", "NOT_STAFF", "NOT_OWNER"].includes(response.error)) setBlocked(true); }
    } catch {
      if (current.active && request === current.version) { current.uncertain = true; setReason(uncertainMessage); setPhase("uncertain"); }
    } finally { if (current.active && request === current.version) current.pending = false; }
  }, [businessId]);
  const cameraOpen = phase === "starting" || phase === "scanning";
  useEffect(() => {
    if (!cameraOpen) return;
    let active = true;
    const release = startStaffCamera(readerId, {
      ready: () => { if (active && life.current.accepting) setPhase("scanning"); },
      decoded: text => { if (active) void decoded(text); },
      failed: () => { if (active && life.current.accepting) { life.current.accepting = false; life.current.running = false; setReason("We could not open the camera. Check camera permission and use an HTTPS page or supported browser, then try again."); setPhase("camera-error"); } },
    });
    return () => { active = false; void release(); };
  }, [cameraOpen, readerId, decoded]);

  return <div className="grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
    <section aria-labelledby="scanner-heading" className="min-w-0 rounded-card border border-border bg-surface-dashboard p-5 shadow-card sm:p-7">
      <h2 id="scanner-heading" className="text-2xl">Scan a student’s code</h2><p className="mt-3 text-sm font-bold text-green-dark [overflow-wrap:anywhere]">{businessName}</p>
      <p className="mt-3 text-sm leading-relaxed text-ink-muted">Ask the student to open their changing in-store code. Hold it in the camera frame. Each scan checks one visit.</p>
      <p className="mt-3 text-sm font-bold text-brown">Demo scanner · Sample visits only. Changes reset on reload.</p>
      {(phase === "idle" || phase === "paused") && <div className="mt-6 rounded-card bg-bg-dashboard p-6 text-center"><Camera aria-hidden="true" className="mx-auto size-10 text-green" /><p className="mt-4 text-sm text-ink-muted">{phase === "paused" ? "Camera paused while you were away. Start it when you are ready." : "The camera starts only when you choose Start camera."}</p><Button onClick={start} disabled={blocked} className="mt-5"><Camera aria-hidden="true" className="size-4" />Start camera</Button></div>}
      {cameraOpen && <div className="mt-6"><div id={readerId} className="min-h-60 overflow-hidden rounded-card bg-bg-dashboard" /><p role="status" className="mt-3 text-sm text-ink-muted">{phase === "starting" ? "Opening camera…" : "Camera ready. Point it at the student’s changing code."}</p><Button variant="outline" onClick={stop} className="mt-4"><CameraOff aria-hidden="true" className="size-4" />Stop camera</Button></div>}
      {phase === "checking" && <div role="status" className="mt-6 flex min-h-56 flex-col items-center justify-center gap-4 rounded-card bg-bg-dashboard p-6 text-center"><LoaderCircle aria-hidden="true" className="size-9 text-green motion-safe:animate-spin" /><p className="font-bold">Checking this visit…</p><p className="text-sm text-ink-muted">Keep this page open until the result appears.</p></div>}
      {phase === "verified" && visit && <section ref={result} tabIndex={-1} aria-labelledby="scan-verified" className="mt-6 rounded-card border border-green bg-green-tint p-6 outline-none focus-visible:ring-2 focus-visible:ring-green"><Check aria-hidden="true" className="size-12 text-green" /><h3 id="scan-verified" className="mt-3 text-3xl text-green-dark">Verified</h3><p className="mt-4 text-lg font-bold [overflow-wrap:anywhere]">{visit.title}</p><p className="mt-3 text-sm text-green-dark">One verified visit recorded.</p><p className="mt-2 text-xs text-green-dark"><time dateTime={visit.redeemedAt}>{dateTime.format(new Date(visit.redeemedAt))}</time> · UC Riverside time</p><Button onClick={start} className="mt-5"><ScanLine aria-hidden="true" className="size-4" />Scan next</Button></section>}
      {(["invalid", "camera-error", "uncertain"] as Phase[]).includes(phase) && <section ref={result} tabIndex={-1} role="alert" aria-labelledby="scan-result-heading" className={`mt-6 rounded-card border p-6 outline-none focus-visible:ring-2 ${phase === "invalid" ? "border-destructive bg-destructive/5 focus-visible:ring-destructive" : "border-border-strong bg-peach focus-visible:ring-green"}`}>
        {phase === "invalid" ? <X aria-hidden="true" className="size-10 text-destructive" /> : <TriangleAlert aria-hidden="true" className="size-10 text-brown" />}<h3 id="scan-result-heading" className={`mt-3 text-2xl ${phase === "invalid" ? "text-destructive" : "text-brown"}`}>{phase === "invalid" ? "Not valid" : phase === "uncertain" ? "Result not confirmed" : "Camera unavailable"}</h3><p className="mt-3 text-sm leading-relaxed text-ink-muted">{reason}</p>
        {blocked ? <Button variant="outline" onClick={refresh} className="mt-5">Reload business</Button> : <Button onClick={start} className="mt-5">{phase === "uncertain" ? "I checked — scan next" : phase === "camera-error" ? "Try camera again" : "Scan next"}</Button>}
        {phase === "uncertain" && <Link href="/dashboard" className="mt-3 flex min-h-11 items-center text-sm font-bold text-green-dark underline">Check Overview</Link>}
      </section>}
    </section>
    <aside className="min-w-0 rounded-card border border-border-strong bg-peach p-5 sm:p-6"><ScanLine aria-hidden="true" className="size-7 text-brown" /><h2 className="mt-4 text-xl">One student, one check</h2><p className="mt-3 text-sm leading-relaxed text-brown">Use the changing code on the student’s phone. Deal-link posters and the permanent counter sticker are for other parts of Grove.</p><p className="mt-3 text-sm leading-relaxed text-brown">After a result, choose Scan next for the next student. The camera stops while a code is being checked and when you leave this page.</p></aside>
  </div>;
}
