// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import type { MapBusiness } from "@/lib/geo/nearby";
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
  };
});

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

async function render(selectedId: string | null = null) {
  await act(async () => {
    root.render(
      <NearbyMap
        center={center}
        businesses={businesses}
        selectedId={selectedId}
        onSelect={onSelect}
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
