// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { PinDetails } from "./pin-details";
import type { MapBusiness } from "@/lib/geo/nearby";

let root: Root;
let container: HTMLDivElement;
const onClose = vi.fn();
const business: MapBusiness = {
  id: "truck",
  name: "Campus kitchen",
  lat: 34,
  lng: -118,
  distanceM: 300,
  openNow: true,
  isTruck: true,
  deals: [],
};
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
    configurable: true,
    value: function (this: HTMLDialogElement) {
      this.open = true;
    },
  });
  Object.defineProperty(HTMLDialogElement.prototype, "close", {
    configurable: true,
    value: function (this: HTMLDialogElement) {
      this.open = false;
      this.dispatchEvent(new Event("close"));
    },
  });
  onClose.mockReset();
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  Reflect.deleteProperty(HTMLDialogElement.prototype, "showModal");
  Reflect.deleteProperty(HTMLDialogElement.prototype, "close");
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

test("a selected pin opens place details and uses Edward’s shared deal card", async () => {
  const deal = {
    business_id: business.id,
    business_name: business.name,
    lat: business.lat,
    lng: business.lng,
    logo_url: null,
    is_truck: true,
    distance_m: 300,
    open_now: true,
    has_deal: true as const,
    deal_id: "public-deal",
    title: "Burrito special",
    discount_type: "amount_off" as const,
    discount_value: 2,
    ends_at: new Date(Date.now() + 60_000).toISOString(),
    live_until: new Date(Date.now() + 60_000).toISOString(),
    students_only: true,
    photo_url: null,
  };
  await act(async () =>
    root.render(
      <PinDetails
        business={{ ...business, deals: [deal] }}
        onClose={onClose}
      />,
    ),
  );
  expect(container.querySelector("dialog")!.open).toBe(true);
  expect(container.textContent).toContain("Open now");
  expect(container.textContent).toContain("300 m away");
  expect(container.querySelector("a")!.getAttribute("href")).toBe(
    "/deals/public-deal",
  );
  expect(container.textContent).toContain("Burrito special");
  await act(async () => container.querySelector("button")!.click());
  expect(onClose).toHaveBeenCalledOnce();
});

test("a closed business with no live deals still has a clear bottom sheet", async () => {
  await act(async () =>
    root.render(
      <PinDetails
        business={{ ...business, openNow: false }}
        onClose={onClose}
      />,
    ),
  );
  expect(container.textContent).toContain("Closed");
  expect(container.textContent).toContain("No deals right now");
  expect(container.querySelector("a")).toBeNull();
  await act(async () =>
    root.render(<PinDetails business={null} onClose={onClose} />),
  );
  expect(container.querySelector("dialog")!.open).toBe(false);
});
