// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { PostDealForm } from "./post-deal-form";

const boundary = vi.hoisted(() => ({ createDeal: vi.fn() }));
vi.mock("@/lib/supabase", () => ({ createDeal: boundary.createDeal }));
vi.mock("./business-context", () => ({
  useBusiness: () => ({ profile: { business: { id: "business-test", name: "Test restaurant", is_truck: false } } }),
  BusinessLoading: () => <p>Loading</p>,
}));

let container: HTMLDivElement;
let root: Root;
beforeEach(async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  boundary.createDeal.mockReset();
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(async () => root.render(<PostDealForm />));
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

async function enter(selector: string, value: string) {
  const element = container.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector)!;
  const prototype = element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  await act(async () => {
    Object.getOwnPropertyDescriptor(prototype, "value")!.set!.call(element, value);
    element.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
async function submit() {
  await act(async () => { container.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })); });
}
async function fill() {
  await enter("#deal-title", "Lunch special");
  await enter("#deal-description", "Two dollars off lunch.");
  await enter("#discount-value", "2");
  await enter("#deal-start-date", "2027-01-04");
  await enter("#deal-start-time", "14:00");
  await enter("#deal-end-date", "2027-01-04");
  await enter("#deal-end-time", "17:00");
}

test("split schedule saves campus time and shows its actual window in the preview", async () => {
  boundary.createDeal.mockResolvedValue({ ok: false, error: "NOT_OWNER" });
  await fill();
  expect(container.querySelector('aside[aria-label="Deal preview"]')!.textContent).toContain("3:00:00 window");
  await submit();
  expect(boundary.createDeal).toHaveBeenCalledWith(expect.objectContaining({
    business_id: "business-test", starts_at: "2027-01-04T22:00:00.000Z", ends_at: "2027-01-05T01:00:00.000Z",
    discount_type: "amount_off", discount_value: 2,
  }));
});

test("invalid split schedules focus the error summary and never write", async () => {
  await fill();
  await enter("#deal-end-time", "13:00");
  await submit();
  expect(boundary.createDeal).not.toHaveBeenCalled();
  expect(document.activeElement).toBe(container.querySelector('[role="alert"]'));
  expect(document.activeElement!.textContent).toContain("End time must be after start time");
});

test("discount choices clear the numeric amount and free-item saves a null value", async () => {
  boundary.createDeal.mockResolvedValue({ ok: false, error: "NOT_OWNER" });
  await fill();
  await act(async () => container.querySelector<HTMLInputElement>('[value="free_item"]')!.click());
  expect(container.querySelector("#discount-value")).toBeNull();
  await submit();
  expect(boundary.createDeal).toHaveBeenCalledWith(expect.objectContaining({ discount_type: "free_item", discount_value: null }));
  await act(async () => container.querySelector<HTMLInputElement>('[value="percent_off"]')!.click());
  expect(container.querySelector<HTMLInputElement>("#discount-value")!.value).toBe("");
});

test("a failed save keeps entries, presents permission or network errors, and supports retry", async () => {
  await fill();
  boundary.createDeal.mockResolvedValueOnce({ ok: false, error: "NOT_OWNER" }).mockRejectedValueOnce(new Error("offline"));
  await submit();
  expect(container.querySelector('[role="alert"]')!.textContent).toContain("permission");
  await submit();
  expect(container.querySelector('[role="alert"]')!.textContent).toContain("entries are still here");
  expect(container.querySelector<HTMLInputElement>("#deal-title")!.value).toBe("Lunch special");
});

test("UCR badge switch changes the preview and title counter follows typing", async () => {
  await enter("#deal-title", "Lunch special");
  expect(container.querySelector("#title-count")!.textContent).toBe("13 / 40 characters");
  await act(async () => container.querySelector<HTMLInputElement>('[role="switch"]')!.click());
  expect(container.querySelector('aside[aria-label="Deal preview"]')!.textContent).not.toContain("UCR students only");
});
