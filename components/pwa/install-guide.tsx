"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Download } from "lucide-react";

type InstallEvent = Event & {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function subscribeStandalone(change: () => void) {
  const media = window.matchMedia("(display-mode: standalone)");
  media.addEventListener("change", change);
  return () => media.removeEventListener("change", change);
}
const isStandalone = () => window.matchMedia("(display-mode: standalone)").matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

export function InstallGuide() {
  const standalone = useSyncExternalStore(subscribeStandalone, isStandalone, () => true);
  const [installed, setInstalled] = useState(false);
  const ios = typeof navigator !== "undefined" && (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));
  const [prompt, setPrompt] = useState<InstallEvent | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const available = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallEvent);
    };
    const complete = () => { setInstalled(true); setPrompt(null); };
    window.addEventListener("beforeinstallprompt", available);
    window.addEventListener("appinstalled", complete);
    return () => {
      window.removeEventListener("beforeinstallprompt", available);
      window.removeEventListener("appinstalled", complete);
    };
  }, []);

  async function install() {
    if (!prompt || busy) return;
    setBusy(true);
    // A browser-provided event can only be used once. Manual steps remain available.
    setPrompt(null);
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      setMessage(choice.outcome === "accepted"
        ? "Finish installing in your browser, then open Grove from your home screen."
        : "You can install later using the steps below.");
    } catch {
      setMessage("Use the steps below to add Grove to your home screen.");
    } finally { setBusy(false); }
  }

  if (installed || standalone) return null;
  return (
    <details className="mt-6 rounded-card border bg-surface p-4 text-sm shadow-card">
      <summary className="min-h-11 cursor-pointer content-center font-bold text-green-dark focus-visible:outline-2 focus-visible:outline-offset-2">
        Add Grove to your home screen
      </summary>
      <p className="mt-2 text-ink-muted">Open Grove like an app. You’ll still need an internet connection.</p>
      {prompt && (
        <button type="button" onClick={() => void install()} disabled={busy}
          className="mt-3 flex min-h-11 items-center gap-2 rounded-button bg-green px-4 font-bold text-white disabled:opacity-60">
          <Download size={18} aria-hidden="true" /> Install Grove
        </button>
      )}
      <p role="status" className="mt-2 text-ink-muted">{message}</p>
      {ios ? (
        <ol className="mt-3 list-decimal space-y-2 pl-5">
          <li>Open Grove in Safari.</li>
          <li>Tap Share (the square with an upward arrow). Depending on your Safari layout, it may be inside the More menu.</li>
          <li>Choose Add to Home Screen. You may need to scroll down.</li>
          <li>Keep Open as Web App enabled if shown, then tap Add.</li>
        </ol>
      ) : (
        <p className="mt-3 text-ink-muted">On Android, open Grove in Chrome, tap the three-dot menu, then Install and create shortcut → Install. Some versions call this Add to Home screen or Install app. On a computer, use the install icon in the address bar if available. If your browser has no install option, you can bookmark Grove.</p>
      )}
    </details>
  );
}
