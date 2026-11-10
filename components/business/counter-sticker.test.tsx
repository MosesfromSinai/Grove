// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { CounterSticker } from "./counter-sticker";

const api = vi.hoisted(() => ({ read: vi.fn(), render: vi.fn() }));
vi.mock("@/lib/supabase", () => ({ getBusinessSticker: api.read, isMockData: true }));
vi.mock("./business-context", () => ({ useBusiness: () => ({ profile: { business: { id: "b1" } } }), BusinessLoading: () => <p>Loading business</p> }));
vi.mock("./render-sticker", () => ({ renderStickerPng: api.render }));
const sticker = { business_id: "b1", business_name: "Test Kitchen", qr_slug: "test-kitchen" };
let root: Root;
let container: HTMLDivElement;
beforeEach(async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://preview.example");
  let sequence = 0;
  vi.stubGlobal("URL", class extends URL {
    static createObjectURL = vi.fn(() => `blob:sticker-${sequence++}`);
    static revokeObjectURL = vi.fn();
  });
  api.read.mockReset().mockResolvedValue(sticker);
  api.render.mockReset().mockResolvedValue(new Blob(["png"], { type: "image/png" }));
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
async function show() { await act(async () => root.render(<CounterSticker />)); }

test("read errors allow retry and a missing slug never enables download", async () => {
  api.read.mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce(null);
  await show();
  expect(container.querySelector('[role="alert"]')!.textContent).toContain("could not load");
  await act(async () => container.querySelector<HTMLButtonElement>("button")!.click());
  expect(container.textContent).toContain("Sticker not available");
  expect(api.render).not.toHaveBeenCalled();
});

test("missing origin blocks image generation rather than assuming a deployed domain", async () => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
  await show();
  expect(container.textContent).toContain("app URL is not configured");
  expect(api.render).not.toHaveBeenCalled();
});

test("image failure supports retry; changing print size revokes the old preview", async () => {
  api.render.mockRejectedValueOnce(new Error("image failed")).mockResolvedValue(new Blob(["png"]));
  await show();
  expect(container.querySelector('[role="alert"]')!.textContent).toContain("image failed");
  await act(async () => [...container.querySelectorAll<HTMLButtonElement>("button")].find(button => button.textContent === "Retry image")!.click());
  expect(api.render).toHaveBeenLastCalledWith({ url: "https://preview.example/b/test-kitchen", name: "Test Kitchen", inches: 4, demo: true });
  await act(async () => container.querySelector<HTMLInputElement>('input[value="6"]')!.click());
  expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:sticker-0");
  expect(api.render).toHaveBeenLastCalledWith(expect.objectContaining({ inches: 6 }));
  expect(container.textContent).toContain("1800 × 1800 pixels");
});
