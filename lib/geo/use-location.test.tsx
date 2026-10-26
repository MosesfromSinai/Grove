// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { useLocation } from "./use-location";

const campus = { lat: 33.9737, lng: -117.3281 };
let root: Root;
let container: HTMLDivElement;
let requests: { success: PositionCallback; failure: PositionErrorCallback }[];

function LocationHarness() {
  const location = useLocation(campus);
  return (
    <>
      <p>
        {location.status}:{location.coordinates.lat},{location.coordinates.lng}
      </p>
      <button onClick={location.locate}>Locate</button>
      <button onClick={location.useCampus}>Campus</button>
    </>
  );
}

beforeEach(async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("isSecureContext", true);
  requests = [];
  vi.stubGlobal("navigator", {
    geolocation: {
      getCurrentPosition: (
        success: PositionCallback,
        failure: PositionErrorCallback,
      ) => requests.push({ success, failure }),
    },
  });
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(async () => root.render(<LocationHarness />));
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

async function click(label: string) {
  await act(async () =>
    [...container.querySelectorAll("button")]
      .find((button) => button.textContent === label)!
      .click(),
  );
}

const position: GeolocationPosition = {
  timestamp: 0,
  coords: {
    latitude: 10,
    longitude: 20,
    accuracy: 5,
    altitude: null,
    altitudeAccuracy: null,
    heading: null,
    speed: null,
    toJSON: () => ({}),
  },
  toJSON: () => ({}),
};

test("does not request location on mount; a granted request updates the origin", async () => {
  expect(requests).toHaveLength(0);
  await click("Locate");
  expect(container.textContent).toContain("locating");
  await act(async () => requests[0].success(position));
  expect(container.textContent).toContain("located:10,20");
});

test.each([
  [1, "denied"],
  [2, "unavailable"],
  [3, "timeout"],
] as const)(
  "location error %s falls back to campus with %s status",
  async (code, status) => {
    await click("Locate");
    await act(async () =>
      requests[0].failure({
        code,
        message: "test",
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      }),
    );
    expect(container.textContent).toContain(
      `${status}:${campus.lat},${campus.lng}`,
    );
  },
);

test("a late location result cannot undo a campus reset", async () => {
  await click("Locate");
  await click("Campus");
  await act(async () => requests[0].success(position));
  expect(container.textContent).toContain(`campus:${campus.lat},${campus.lng}`);
});

test("only the newest location request may update the origin", async () => {
  await click("Locate");
  await click("Locate");
  await act(async () => requests[1].success(position));
  await act(async () =>
    requests[0].failure({
      code: 1,
      message: "old request",
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3,
    }),
  );
  expect(container.textContent).toContain("located:10,20");
});

test("missing geolocation or insecure context keeps the campus origin", async () => {
  vi.stubGlobal("isSecureContext", false);
  await click("Locate");
  expect(requests).toHaveLength(0);
  expect(container.textContent).toContain(
    `unavailable:${campus.lat},${campus.lng}`,
  );
  vi.stubGlobal("isSecureContext", true);
  vi.stubGlobal("navigator", {});
  await click("Locate");
  expect(container.textContent).toContain(
    `unavailable:${campus.lat},${campus.lng}`,
  );
});
