type CameraModule = typeof import("html5-qrcode");
type Callbacks = { ready: () => void; decoded: (text: string) => void; failed: () => void };

// Cancelling during permission/startup must also stop a camera that becomes
// available later. Serialize release and suppress all callbacks after cleanup.
export function startStaffCamera(elementId: string, callbacks: Callbacks, load: () => Promise<CameraModule> = () => import("html5-qrcode")) {
  let cancelled = false;
  let scanner: import("html5-qrcode").Html5Qrcode | null = null;
  let releasePromise: Promise<void> | null = null;
  const element = document.getElementById(elementId);
  const originalAppend = element?.append;
  // html5-qrcode 2.x ignores video.play()'s promise. Handle it on this host's
  // video only: removing a pending preview otherwise leaks an AbortError.
  const append = (...nodes: (Node | string)[]) => {
    for (const node of nodes) if (node instanceof HTMLVideoElement) {
      const play = node.play.bind(node);
      node.play = () => {
        const playing = play();
        void playing.catch(() => {
          if (!cancelled) { callbacks.failed(); void release(); }
        });
        return playing;
      };
    }
    originalAppend?.apply(element, nodes);
  };
  if (element) element.append = append;
  function release() {
    return releasePromise ??= (async () => {
      try { if (scanner?.isScanning) await scanner.stop(); } catch { /* Track cleanup below still runs if the library stop fails. */ }
      const video = element?.querySelector("video");
      const stream = video?.srcObject as MediaStream | null | undefined;
      stream?.getTracks().forEach(track => track.stop());
      // The library clears by ID. A late old session must not clear a newer
      // React element that reused that ID after Stop / Start or navigation.
      try { if (document.getElementById(elementId) === element) scanner?.clear(); } catch { /* React removes the remaining preview on unmount. */ }
      if (element?.append === append && originalAppend) element.append = originalAppend;
    })();
  }
  const done = (async () => {
    try {
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await load();
      if (cancelled) return;
      scanner = new Html5Qrcode(elementId, { formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE], verbose: false });
      await scanner.start({ facingMode: "environment" }, {
        fps: 10,
        qrbox: (width, height) => { const size = Math.max(50, Math.min(250, Math.floor(Math.min(width, height) * 0.7))); return { width: size, height: size }; },
      }, text => { if (!cancelled) callbacks.decoded(text); }, () => {});
      if (cancelled) await release();
      else callbacks.ready();
    } catch {
      if (!cancelled) callbacks.failed();
      await release();
    }
  })();
  return async () => { cancelled = true; await done; await release(); };
}
