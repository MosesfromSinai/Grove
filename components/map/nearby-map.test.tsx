// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import type { MapBusiness } from "@/lib/geo/nearby";
import { MapExplorer } from "./map-explorer";
import { NearbyMap } from "./nearby-map";

const mock = vi.hoisted(() => {
  process.env.NEXT_PUBLIC_MAPBOX_TOKEN = "test-token";
  return {
    maps: [] as {
      container: HTMLElement;
      handlers: Record<string, () => void>;
      remove: ReturnType<typeof vi.fn>;
    }[],
    failConstructor: false,
    nearby: vi.fn(),
  };
});

vi.mock("@/lib/supabase", () => ({ getDealsNearby: mock.nearby }));

vi.mock("mapbox-gl", () => ({
  default: {
    Map: class {
      container: HTMLElement;
      handlers: Record<string, () => void> = {};
      remove = vi.fn();
      constructor(options: { container: HTMLElement }) {
        if (mock.failConstructor) throw new Error("WebGL unavailable");
        this.container = options.container;
        mock.maps.push(this);
      }
      addControl() {}
      resize() {}
      easeTo() {}
      on(event: string, handler: () => void) {
        this.handlers[event] = handler;
      }
    },
    NavigationControl: class {},
    Marker: class {
      element: HTMLElement;
      constructor(options: { element: HTMLElement }) {
        this.element = options.element;
      }
      setLngLat() {
        return this;
      }
      addTo(map: { container: HTMLElement }) {
        map.container.append(this.element);
        return this;
      }
      remove() {
        this.element.remove();
      }
    },
  },
}));

const center = { lat: 33.9737, lng: -117.3281 };
const businesses: MapBusiness[] = [
  {
    id: "test-business",
    name: "Test kitchen",
    ...center,
    distanceM: 0,
    openNow: true,
    isTruck: false,
    deals: [],
  },
];
let container: HTMLDivElement;
let root: Root;
const onSelect = vi.fn();

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({ matches: true })),
  );
  mock.maps.length = 0;
  mock.failConstructor = false;
  onSelect.mockClear();
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

async function render(selectedId: string | null = null, rows = businesses, at = center, select = onSelect) {
  await act(async () => {
    root.render(
      <NearbyMap
        center={at}
        businesses={rows}
        selectedId={selectedId}
        onSelect={select}
      />,
    );
  });
  await act(async () => {
    await vi.dynamicImportSettled();
  });
}

async function loadMap() {
  await render();
  await act(async () => mock.maps[0].handlers.load());
  await act(async () => {
    await vi.dynamicImportSettled();
  });
}

test("selecting a Mapbox marker retains keyboard focus and its DOM node", async () => {
  await loadMap();
  const button = container.querySelector<HTMLButtonElement>(
    ".grove-map-canvas button",
  )!;
  button.focus();
  button.click();
  expect(onSelect).toHaveBeenCalledWith("test-business");
  await render("test-business");
  expect(container.querySelector(".grove-map-canvas button")).toBe(button);
  expect(document.activeElement).toBe(button);
  expect(button.getAttribute("aria-pressed")).toBe("true");
  expect(button.className).toContain("grove-map-regular");
});

test("unmount removes the map and all marker elements", async () => {
  await loadMap();
  const marker = container.querySelector(".grove-map-canvas button")!;
  await act(async () => root.unmount());
  expect(marker.isConnected).toBe(false);
  expect(mock.maps[0].remove).toHaveBeenCalledOnce();
});

test("map errors leave an accessible pin preview", async () => {
  await loadMap();
  await act(async () => mock.maps[0].handlers.error());
  expect(container.textContent).toContain("Map tiles unavailable");
  expect(
    container.querySelector<HTMLDivElement>(".grove-map-canvas")!.hidden,
  ).toBe(true);
  const button = container.querySelector<HTMLButtonElement>(
    ".grove-map-preview button",
  )!;
  expect(button.querySelector(".grove-map-pinCircle svg")).not.toBeNull();
  expect(button.querySelector(".grove-map-pinName")!.textContent).toBe("Test kitchen");
  button.click();
  expect(onSelect).toHaveBeenCalledWith("test-business");
});

test("map initialization failure falls back to the preview", async () => {
  mock.failConstructor = true;
  await render();
  expect(container.textContent).toContain("Map tiles unavailable");
});

test("a map that never loads falls back after 15 seconds", async () => {
  vi.useFakeTimers();
  await render();
  expect(container.textContent).toContain("Loading map");
  await act(async () => {
    vi.advanceTimersByTime(15_000);
  });
  expect(container.textContent).toContain("Map tiles unavailable");
});


test("100 pins retain their nodes and focus through refreshed rows, center and callbacks", async () => {
  await loadMap();
  const rows = Array.from({ length: 100 }, (_, i) => ({ ...businesses[0], id: `spot-${i}`, name: `Spot ${i}`, lng: center.lng + i / 10000 }));
  await render(null, rows);
  const buttons = [...container.querySelectorAll<HTMLButtonElement>(".grove-map-canvas button")];
  expect(buttons).toHaveLength(100);
  buttons[49].focus();
  const callback = vi.fn();
  await render("spot-49", rows.map(row => ({ ...row })), { ...center, lat: center.lat + 0.001 }, callback);
  expect([...container.querySelectorAll(".grove-map-canvas button")]).toEqual(buttons);
  expect(document.activeElement).toBe(buttons[49]);
  buttons[49].click();
  expect(callback).toHaveBeenCalledWith("spot-49");
  await render(null, rows.slice(0, 50));
  expect(container.querySelectorAll(".grove-map-canvas button")).toHaveLength(50);
  expect(buttons[99].isConnected).toBe(false);
  expect(container.querySelector(".grove-map-canvas button")).toBe(buttons[0]);
});

test("refresh updates a surviving pin's name without replacing it", async () => {
  await loadMap();
  const button = container.querySelector<HTMLButtonElement>(".grove-map-canvas button")!;
  await render(null, [{ ...businesses[0], name: "Renamed truck", lat: center.lat + 0.001 }]);
  expect(container.querySelector(".grove-map-canvas button")).toBe(button);
  expect(button.getAttribute("aria-label")).toBe("Renamed truck, no live deal");
  expect(button.querySelector(".grove-map-pinName")?.textContent).toBe("Renamed truck");
});


test("MapExplorer retains real marker nodes while a filter request is pending", async () => {
  const rows = Array.from({ length: 100 }, (_, i) => ({
    business_id: `business-${i}`, business_name: `Business ${i}`, logo_url: null,
    is_truck: false, ...center, distance_m: i, open_now: true,
    has_deal: false as const, deal_id: null, title: null, discount_type: null,
    discount_value: null, ends_at: null, live_until: null, students_only: null, photo_url: null,
  }));
  mock.nearby.mockResolvedValueOnce(rows);
  await act(async () => { root.render(<MapExplorer />); await vi.dynamicImportSettled(); });
  await act(async () => { mock.maps[0].handlers.load(); await vi.dynamicImportSettled(); });
  const buttons = [...container.querySelectorAll<HTMLButtonElement>(".grove-map-canvas button")];
  expect(buttons).toHaveLength(100);
  let resolve!: (value: typeof rows) => void;
  mock.nearby.mockReturnValueOnce(new Promise<typeof rows>((done) => { resolve = done; }));
  const filter = [...container.querySelectorAll<HTMLButtonElement>("button")].find(button => button.textContent === "Open now")!;
  buttons[49].focus();
  await act(async () => filter.click());
  expect(mock.nearby).toHaveBeenLastCalledWith(expect.objectContaining({ openNow: true }));
  expect(container.querySelector('[aria-label="Nearby places"]')?.getAttribute("aria-busy")).toBe("true");
  expect([...container.querySelectorAll(".grove-map-canvas button")]).toEqual(buttons);
  expect(document.activeElement).toBe(buttons[49]);
  await act(async () => { resolve(rows.map(row => ({ ...row }))); await vi.dynamicImportSettled(); });
  expect([...container.querySelectorAll(".grove-map-canvas button")]).toEqual(buttons);
  expect(document.activeElement).toBe(buttons[49]);
  expect(container.querySelector('[aria-label="Nearby places"]')?.getAttribute("aria-busy")).toBe("false");
});
