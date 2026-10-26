"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function ScanPage() {
  const router = useRouter();
  const [manualCode, setManualCode] = useState("");
  const [cameraError, setCameraError] = useState(false);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);

  async function submit(code: string) {
    if (busyRef.current || !code.trim()) return;
    busyRef.current = true;
    setBusy(true);
    try {
      const res = await fetch("/api/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const result = await res.json();
      const params = new URLSearchParams(
        result.ok ? { status: "ok", deal: result.dealId } : { status: "error", reason: result.reason }
      );
      router.push(`/redeemed?${params.toString()}`);
    } catch {
      busyRef.current = false;
      setBusy(false);
      alert("Something went wrong. Try again.");
    }
  }

  // Keep the latest submit available to the scanner callback.
  const submitRef = useRef(submit);
  useEffect(() => {
    submitRef.current = submit;
  });

  useEffect(() => {
    let cancelled = false;
    let scanner: import("html5-qrcode").Html5Qrcode | null = null;

    (async () => {
      const { Html5Qrcode } = await import("html5-qrcode");
      if (cancelled) return;
      scanner = new Html5Qrcode("qr-reader");
      try {
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: 250 },
          (text) => submitRef.current(text),
          () => {}
        );
      } catch {
        setCameraError(true);
      }
    })();

    return () => {
      cancelled = true;
      scanner?.stop().then(() => scanner?.clear()).catch(() => {});
    };
  }, []);

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Scan</h1>
      <div id="qr-reader" className="overflow-hidden rounded-xl" />
      {cameraError && (
        <p className="mt-3 text-sm text-red-600">
          Couldn&apos;t access the camera. Allow camera permission in your browser, or enter the code below.
        </p>
      )}

      <div className="mt-6">
        <label htmlFor="code" className="text-sm text-black/60">Or enter a code</label>
        <div className="mt-1 flex gap-2">
          <input
            id="code"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="e.g. 1"
            className="flex-1 rounded-lg border border-black/20 bg-white px-3 py-2"
          />
          <button
            onClick={() => submit(manualCode)}
            disabled={busy}
            className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
          >
            {busy ? "..." : "Redeem"}
          </button>
        </div>
      </div>
    </div>
  );
}