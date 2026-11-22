// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { DealShare } from "./deal-share";

const qrApi = vi.hoisted(() => ({ generate: vi.fn<(url: string) => Promise<string>>() }));
vi.mock("qrcode", () => ({ toDataURL: qrApi.generate }));
const writeText = vi.fn();
let root: Root; let container: HTMLDivElement;
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  HTMLDialogElement.prototype.close = function () { this.open = false; this.dispatchEvent(new Event("close")); };
  writeText.mockReset().mockResolvedValue(undefined);
  qrApi.generate.mockReset().mockResolvedValue("data:image/png;base64,qr");
  Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.unstubAllGlobals(); });
const text = () => container.textContent ?? "";
const click = (label: string) => act(async () => [...container.querySelectorAll("button")].find((b) => b.textContent?.includes(label))!.click());
const open = async (visibility: "public" | "link_only" = "public") => {
  await act(async () => root.render(<DealShare deal={{ id: "deal-9", title: "$2 off any burrito", visibility }} />));
  await click("Share");
  await act(async () => { await Promise.resolve(); });
};

test("shows the /deals link, copies it, and offers the QR download", async () => {
  await open();
  const link = `${window.location.origin}/deals/deal-9`;
  expect(text()).toContain(link);
  await click("Copy link");
  expect(writeText).toHaveBeenCalledWith(link);
  expect(text()).toContain("Copied");
  const download = container.querySelector<HTMLAnchorElement>("a[download]")!;
  expect(download.getAttribute("href")).toBe("data:image/png;base64,qr");
  expect(download.getAttribute("download")).toBe("2-off-any-burrito-qr.png");
  expect(text()).toContain("Students still redeem with the counter sticker");
});

test("a link-only deal says it isn't in the feed", async () => {
  await open("link_only");
  expect(text()).toContain("Link only: share this with your group");
});

test("a failed copy says how to copy by hand", async () => {
  writeText.mockRejectedValue(new Error("denied"));
  await open();
  await click("Copy link");
  expect(text()).toContain("Couldn't copy");
});

test("a failed QR explains the problem and retries without losing the link", async () => {
  qrApi.generate.mockRejectedValueOnce(new Error("QR unavailable"));
  await open();
  expect(container.querySelector('[role="alert"]')?.textContent).toContain("Couldn't prepare the QR");
  expect(container.querySelector("a[download]")).toBeNull();
  await click("Copy link");
  expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/deals/deal-9`);
  await click("Retry QR");
  expect(container.querySelector("a[download]")?.getAttribute("href")).toBe("data:image/png;base64,qr");
  expect(container.querySelector('[role="alert"]')).toBeNull();
});

test("reopening waits for a fresh QR and ignores the closed request", async () => {
  let finishOld!: (png: string) => void;
  let finishNew!: (png: string) => void;
  qrApi.generate
    .mockImplementationOnce(() => new Promise(resolve => { finishOld = resolve; }))
    .mockImplementationOnce(() => new Promise(resolve => { finishNew = resolve; }));
  await open();
  expect(text()).toContain("Preparing QR");
  await click("Done");
  await click("Share");
  await act(async () => finishOld("data:image/png;base64,old"));
  expect(container.querySelector("a[download]")).toBeNull();
  await act(async () => finishNew("data:image/png;base64,new"));
  expect(container.querySelector("a[download]")?.getAttribute("href")).toBe("data:image/png;base64,new");
});

test("a different deal never offers the previous QR while generating", async () => {
  await open();
  let finish!: (png: string) => void;
  qrApi.generate.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
  await act(async () => root.render(<DealShare deal={{ id: "deal-10", title: "New deal", visibility: "public" }} />));
  expect(text()).toContain("/deals/deal-10");
  expect(container.querySelector("a[download]")).toBeNull();
  await act(async () => finish("data:image/png;base64,new"));
  expect(container.querySelector("a[download]")?.getAttribute("href")).toBe("data:image/png;base64,new");
});
