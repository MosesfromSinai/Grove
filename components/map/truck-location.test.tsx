// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import type { BusinessProfile } from "@/lib/supabase/types";
import { TruckLocation } from "./truck-location";

const mock = vi.hoisted(() => ({
  profile: null as BusinessProfile | null,
  updateProfile: vi.fn(),
  save: vi.fn(),
}));
vi.mock("@/components/business/business-context", () => ({
  useBusiness: () => ({
    profile: mock.profile,
    updateProfile: mock.updateProfile,
  }),
}));
vi.mock("@/lib/supabase/business", () => ({ updateTruckLocation: mock.save }));
let root: Root;
let container: HTMLDivElement;
let success: PositionCallback;
let failure: PositionErrorCallback;
let locate: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("isSecureContext", true);
  locate = vi.fn((s: PositionCallback, f: PositionErrorCallback) => {
    success = s;
    failure = f;
  });
  vi.stubGlobal("navigator", { geolocation: { getCurrentPosition: locate } });
  mock.profile = {
    pin_ready: true,
    business: {
      id: "truck-1",
      name: "Test truck",
      address: "Original address",
      lat: 33,
      lng: -117,
      hours: {},
      logo_url: null,
      is_truck: true,
      open_now: false,
      redemption_mode: "sticker",
    },
  };
  mock.updateProfile.mockReset();
  mock.save
    .mockReset()
    .mockResolvedValue({
      ok: true,
      location: { business_id: "truck-1", lat: 34, lng: -118 },
    });
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});
const render = async () => {
  await act(async () => root.render(<TruckLocation />));
};
const click = async () => {
  await act(async () => container.querySelector("button")!.click());
};
const position = {
  coords: { latitude: 34, longitude: -118 },
} as GeolocationPosition;

test("saves only an explicitly granted device position and updates the owner profile", async () => {
  await render();
  expect(locate).not.toHaveBeenCalled();
  await click();
  expect(container.querySelector("button")!.disabled).toBe(true);
  await act(async () => success(position));
  expect(mock.save).toHaveBeenCalledWith({
    business_id: "truck-1",
    lat: 34,
    lng: -118,
  });
  expect(mock.updateProfile).toHaveBeenCalledWith({
    ...mock.profile,
    business: { ...mock.profile!.business, lat: 34, lng: -118 },
  });
  expect(container.textContent).toContain("Sample pin moved");
});

test("denied location never saves a campus fallback or changes the pin", async () => {
  await render();
  await click();
  await act(async () => failure({ code: 1 } as GeolocationPositionError));
  expect(mock.save).not.toHaveBeenCalled();
  expect(mock.updateProfile).not.toHaveBeenCalled();
  expect(container.querySelector('[role="alert"]')!.textContent).toContain(
    "Your pin hasn’t moved",
  );
});

test.each(["NOT_OWNER", "NOT_A_TRUCK", "INVALID_LOCATION", "NOT_SIGNED_IN"])(
  "server %s failure leaves the pin alone",
  async (error) => {
    mock.save.mockResolvedValue({ ok: false, error });
    await render();
    await click();
    await act(async () => success(position));
    expect(mock.updateProfile).not.toHaveBeenCalled();
    expect(container.querySelector('[role="alert"]')).not.toBeNull();
  },
);

test("network failure allows retry and does not report success", async () => {
  mock.save.mockRejectedValue(new Error("offline"));
  await render();
  await click();
  await act(async () => success(position));
  expect(mock.updateProfile).not.toHaveBeenCalled();
  expect(container.querySelector("button")!.disabled).toBe(false);
  expect(container.textContent).toContain("couldn’t save");
});

test("a callback after switching businesses cannot move either pin", async () => {
  await render();
  await click();
  mock.profile = {
    ...mock.profile!,
    business: { ...mock.profile!.business, id: "truck-2" },
  };
  await render();
  await act(async () => success(position));
  expect(mock.save).not.toHaveBeenCalled();
});

test("restaurants do not show the truck action", async () => {
  mock.profile!.business.is_truck = false;
  await render();
  expect(container.querySelector("button")).toBeNull();
});

test("insecure location support fails closed before prompting or saving", async () => {
  vi.stubGlobal("isSecureContext", false);
  await render();
  await click();
  expect(locate).not.toHaveBeenCalled();
  expect(mock.save).not.toHaveBeenCalled();
  expect(container.textContent).toContain("HTTPS");
});
