import { expect, test } from "@playwright/test";

// Real Mapbox GL/WebGL and marker code, blank local style: no provider requests,
// account token, tile loading claim or Mapbox usage charge.
test.beforeEach(async ({ page }) => {
  await page.route(/https:\/\/.*mapbox\.com\/.*/, route => {
    if (route.request().url().includes("/styles/v1/")) return route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ version: 8, sources: {}, layers: [{ id: "background", type: "background", paint: { "background-color": "#ddf0e2" } }] }),
    });
    return route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
  });
});

test("100 real Mapbox markers survive refresh, select by keyboard, and pan smoothly", async ({ page }, info) => {
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/");
  const pins = page.locator(".grove-map-canvas button.grove-map-pin");
  await expect(pins).toHaveCount(100);
  await expect(page.getByText("Map tiles unavailable")).toHaveCount(0);
  await pins.nth(49).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Selected spot")).toHaveText("spot-49");
  await expect(pins.nth(49)).toBeFocused();
  const first = await pins.first().elementHandle();
  const metrics = await page.evaluate(async () => {
    const samples = [];
    let running = true;
    const frame = time => { samples.push(time); if (running) requestAnimationFrame(frame); };
    requestAnimationFrame(frame);
    let added = 0, removed = 0;
    const observer = new MutationObserver(records => {
      for (const record of records) {
        added += [...record.addedNodes].filter(node => node instanceof Element && node.matches(".grove-map-pin")).length;
        removed += [...record.removedNodes].filter(node => node instanceof Element && node.matches(".grove-map-pin")).length;
      }
    });
    observer.observe(document.querySelector(".grove-map-canvas"), { subtree: true, childList: true });
    const durations = [];
    for (let i = 0; i < 20; i++) {
      const started = performance.now();
      document.querySelector("main > button").click();
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      durations.push(performance.now() - started);
    }
    await new Promise(resolve => setTimeout(resolve, 600));
    running = false;
    observer.disconnect();
    const gaps = samples.slice(1).map((value, i) => value - samples[i]).sort((a, b) => a - b);
    return { pins: document.querySelectorAll(".grove-map-canvas button.grove-map-pin").length,
      added, removed, refreshes: durations.length, frameP95Ms: gaps[Math.floor(gaps.length * 0.95)],
      maxFrameMs: gaps.at(-1), maxRefreshMs: Math.max(...durations), frames: gaps.length };
  });
  console.log("MAP_METRICS", JSON.stringify(metrics));
  await info.attach("100-pin-metrics", { body: JSON.stringify(metrics, null, 2), contentType: "application/json" });
  await expect(page.getByLabel("Refresh count")).toHaveText("20");
  expect(await first.evaluate(node => node === document.querySelector(".grove-map-canvas button.grove-map-pin"))).toBe(true);
  expect(metrics.pins).toBe(100);
  await expect(page.locator(".mapboxgl-marker.grove-map-pin")).toHaveCount(100);
  await expect(page.getByRole("button", { name: "Refreshed spot 20, no live deal", exact: true })).toHaveCount(1);
  expect(metrics.added).toBe(0);
  expect(metrics.removed).toBe(0);
  // Desktop smoke threshold, deliberately not a physical-phone FPS promise.
  expect(metrics.frames).toBeGreaterThan(30);
  expect(metrics.frameP95Ms).toBeLessThan(50);
  expect(errors).toEqual([]);
  await page.screenshot({ path: info.outputPath("100-pins.png") });
});

test("iPhone guide has manual Safari steps and fits a narrow viewport", async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, "userAgent", { value: "iPhone Safari" }));
  await page.goto("/");
  await page.getByText("Add Grove to your home screen", { exact: true }).click();
  await expect(page.getByText("Open Grove in Safari.")).toBeVisible();
  await expect(page.getByText(/Keep Open as Web App/)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("install events are one-shot; cancellation keeps manual instructions and standalone hides guide", async ({ page }) => {
  await page.goto("/");
  await page.getByText("Add Grove to your home screen", { exact: true }).click();
  await page.evaluate(() => {
    const event = new Event("beforeinstallprompt", { cancelable: true });
    event.prompt = async () => { window.promptCalls = (window.promptCalls || 0) + 1; };
    event.userChoice = Promise.resolve({ outcome: "dismissed" });
    window.dispatchEvent(event);
    window.prevented = event.defaultPrevented;
  });
  await page.getByRole("button", { name: "Install Grove", exact: true }).click();
  await expect(page.getByText("You can install later using the steps below.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Install Grove", exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => ({ calls: window.promptCalls, prevented: window.prevented }))).toEqual({ calls: 1, prevented: true });
  await page.evaluate(() => window.dispatchEvent(new Event("appinstalled")));
  await expect(page.getByText("Add Grove to your home screen", { exact: true })).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => Object.defineProperty(navigator, "standalone", { value: true }));
  await page.reload();
  await expect(page.getByText("Add Grove to your home screen", { exact: true })).toHaveCount(0);
});

test("a rejected native install request leaves Android manual steps available", async ({ page }) => {
  await page.goto("/");
  await page.getByText("Add Grove to your home screen", { exact: true }).click();
  await page.evaluate(() => {
    const event = new Event("beforeinstallprompt", { cancelable: true });
    event.prompt = async () => { throw new Error("Install unavailable"); };
    event.userChoice = Promise.resolve({ outcome: "dismissed" });
    window.dispatchEvent(event);
  });
  await page.getByRole("button", { name: "Install Grove", exact: true }).click();
  await expect(page.getByText("Use the steps below to add Grove to your home screen.")).toBeVisible();
  await expect(page.getByText(/On Android, open Grove in Chrome/)).toBeVisible();
});
