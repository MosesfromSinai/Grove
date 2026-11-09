// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { TruckLocation } from "./truck-location";

const mock = vi.hoisted(() => ({
  businessId: "truck-1",
  onMoved: vi.fn(),
  save: vi.fn(),
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
  mock.businessId = "truck-1";
  mock.onMoved.mockReset();
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
  await act(async () => root.render(<TruckLocation businessId={mock.businessId} onMoved={mock.onMoved} />));
};
const click = async () => {
  await act(async () => container.querySelector("button")!.click());
};
const position = {
  coords: { latitude: 34, longitude: -118 },
} as GeolocationPosition;

test("saves only an explicitly granted device position and reports the new pin", async () => {
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
  expect(mock.onMoved).toHaveBeenCalledWith({ lat: 34, lng: -118 });
  expect(container.textContent).toContain("Sample pin moved");
});

test("denied location never saves a campus fallback or changes the pin", async () => {
  await render();
  await click();
  await act(async () => failure({ code: 1 } as GeolocationPositionError));
  expect(mock.save).not.toHaveBeenCalled();
  expect(mock.onMoved).not.toHaveBeenCalled();
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
    expect(mock.onMoved).not.toHaveBeenCalled();
    expect(container.querySelector('[role="alert"]')).not.toBeNull();
  },
);

test("network failure allows retry and does not report success", async () => {
  mock.save.mockRejectedValue(new Error("offline"));
  await render();
  await click();
  await act(async () => success(position));
  expect(mock.onMoved).not.toHaveBeenCalled();
  expect(container.querySelector("button")!.disabled).toBe(false);
  expect(container.textContent).toContain("couldn’t save");
});

test("a callback after switching businesses cannot move either pin", async () => {
  await render();
  await click();
  mock.businessId = "truck-2";
  await render();
  await act(async () => success(position));
  expect(mock.save).not.toHaveBeenCalled();
});

test("a restaurant gets the not-a-truck message", async () => {
  mock.save.mockResolvedValue({ ok: false, error: "NOT_A_TRUCK" });
  await render();
  await click();
  await act(async () => success(position));
  expect(container.textContent).toContain("only available for food trucks");
});

test("insecure location support fails closed before prompting or saving", async () => {
  vi.stubGlobal("isSecureContext", false);
  await render();
  await click();
  expect(locate).not.toHaveBeenCalled();
  expect(mock.save).not.toHaveBeenCalled();
  expect(container.textContent).toContain("HTTPS");
});
