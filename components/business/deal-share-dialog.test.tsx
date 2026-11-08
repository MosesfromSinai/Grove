// @vitest-environment jsdom
import { Activity, StrictMode, act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { DealShareDialog } from "./deal-share-dialog";
import type { MyDeal } from "@/lib/supabase/types";

const api = vi.hoisted(() => ({ render: vi.fn(), copy: vi.fn() }));
vi.mock("@/lib/supabase", () => ({ isMockData: true }));
vi.mock("./render-deal-qr", () => ({ DEAL_QR_PIXELS: 1200, renderDealQrPng: api.render }));
const deal = { id: "deal1", title: "Club night <img src=x>", visibility: "link_only", status: "live" } as MyDeal;
let root: Root; let container: HTMLDivElement;
const close = vi.fn();
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true); vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://preview.example");
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", { configurable: true, value: vi.fn(function (this: HTMLDialogElement) { this.setAttribute("open", ""); }) });
  Object.defineProperty(HTMLDialogElement.prototype, "close", { configurable: true, value: vi.fn(function (this: HTMLDialogElement) {
    if (!this.open) return;
    this.removeAttribute("open"); queueMicrotask(() => this.dispatchEvent(new Event("close")));
  }) });
  vi.stubGlobal("URL", class extends URL { static createObjectURL = vi.fn(() => "blob:deal-qr"); static revokeObjectURL = vi.fn(); });
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: api.copy } });
  api.render.mockReset().mockResolvedValue(new Blob(["png"])); api.copy.mockReset().mockResolvedValue(undefined); close.mockReset();
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.restoreAllMocks(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
async function show(value = deal) { await act(async () => root.render(<DealShareDialog deal={value} onClose={close} />)); }
function button(label: string) { return [...container.querySelectorAll<HTMLButtonElement>("button")].find(b => b.textContent === label)!; }

test("link-only sharing copies the exact advertising URL and exports the same QR without unsafe title HTML", async () => {
  await show(); const url = "https://preview.example/deals/deal1";
  expect(container.querySelector<HTMLInputElement>("input")!.value).toBe(url);
  expect(api.render).toHaveBeenCalledWith({ url, demo: true }); expect(container.querySelectorAll("img")).toHaveLength(1);
  expect(container.textContent).toContain(deal.title); expect(container.textContent).toContain("Link only"); expect(container.textContent).toContain("scanning it does not apply a discount or verify a visit");
  await act(async () => button("Copy link").click()); expect(api.copy).toHaveBeenCalledWith(url); expect(container.textContent).toContain("Deal link copied");
  const download = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
    expect(this.href).toBe("blob:deal-qr"); expect(this.download).toBe("grove-demo-deal-deal1-qr.png");
  });
  await act(async () => button("Download QR PNG").click()); expect(download).toHaveBeenCalledTimes(1);
});

test("clipboard rejection offers a selected manual link while QR generation remains independent", async () => {
  api.copy.mockRejectedValueOnce(new Error("denied")); api.render.mockRejectedValueOnce(new Error("image failed")); await show();
  expect(button("Download QR PNG").disabled).toBe(true);
  await act(async () => button("Copy link").click()); const input = container.querySelector<HTMLInputElement>("input")!;
  expect(document.activeElement).toBe(input); expect(input.selectionEnd! - input.selectionStart!).toBe(input.value.length); expect(container.textContent).toContain("copy it manually");
  await act(async () => button("Retry QR").click()); expect(button("Download QR PNG").disabled).toBe(false);
});

test("missing configuration blocks both actions instead of assuming a deployment URL", async () => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", ""); await show(); expect(container.textContent).toContain("app URL is not configured"); expect(api.render).not.toHaveBeenCalled(); expect(container.querySelector("input")).toBeNull();
});

test("a delayed native close from Strict Mode cleanup cannot dismiss a reopened dialog", async () => {
  await act(async () => root.render(<StrictMode><DealShareDialog deal={deal} onClose={close} /></StrictMode>));
  expect(container.querySelector("dialog")!.open).toBe(true); expect(close).not.toHaveBeenCalled();
});

test("copy is single-flight and late copy/render responses after closing cannot create assets", async () => {
  let copyDone = () => {}; let renderDone: (blob: Blob) => void = () => {};
  api.copy.mockImplementationOnce(() => new Promise<void>(done => { copyDone = done; }));
  api.render.mockImplementationOnce(() => new Promise<Blob>(done => { renderDone = done; })); await show();
  await act(async () => { button("Copy link").click(); button("Copy link").click(); }); expect(api.copy).toHaveBeenCalledTimes(1);
  await act(async () => root.render(null)); await act(async () => { copyDone(); renderDone(new Blob(["late"])); });
  expect(URL.createObjectURL).not.toHaveBeenCalled(); expect(container.textContent).toBe("");
});

test("closing/hiding releases generated URLs, and expired deals remain shareable with honest wording", async () => {
  const value = { ...deal, status: "ended" as const, visibility: "public" as const };
  await act(async () => root.render(<Activity mode="visible"><DealShareDialog deal={value} onClose={close} /></Activity>));
  expect(container.textContent).toContain("This deal has ended"); expect(button("Copy link").disabled).toBe(false);
  await act(async () => root.render(<Activity mode="hidden"><DealShareDialog deal={value} onClose={close} /></Activity>));
  expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:deal-qr"); expect(HTMLDialogElement.prototype.close).toHaveBeenCalled();
});
