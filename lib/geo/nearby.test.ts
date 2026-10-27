import assert from "node:assert/strict";
import { test } from "vitest";
import { getDealsNearby, UCR_CENTER } from "../../mocks";
import {
  formatDistance,
  groupNearbyBusinesses,
  NEARBY_RADIUS_M,
  WALKING_RADIUS_M,
} from "./nearby";

test("multiple public deals share one pin and link-only deals stay hidden", async () => {
  const rows = await getDealsNearby({
    ...UCR_CENTER,
    radiusM: NEARBY_RADIUS_M,
  });
  const pins = groupNearbyBusinesses(rows);
  assert.equal(pins.length, 8);
  const tacos = pins.find((pin) => pin.id === "biz-opt")!;
  assert.equal(tacos.deals.length, 2);
  assert.ok(tacos.deals.every((deal) => !deal.title.includes("Club")));
  assert.equal(pins.find((pin) => pin.id === "biz-tia")!.deals.length, 0);
  assert.ok(
    pins.every(
      (pin, index) => index === 0 || pins[index - 1].distanceM <= pin.distanceM,
    ),
  );
});

test("open-now, deals, and walking-radius filters combine", async () => {
  const all = { ...UCR_CENTER, radiusM: NEARBY_RADIUS_M };
  const open = groupNearbyBusinesses(
    await getDealsNearby({ ...all, openNow: true }),
  );
  assert.equal(open.length, 7);
  assert.ok(open.every((pin) => pin.openNow));
  const walking = groupNearbyBusinesses(
    await getDealsNearby({ ...all, radiusM: WALKING_RADIUS_M }),
  );
  assert.equal(walking.length, 4);
  const filtered = groupNearbyBusinesses(
    await getDealsNearby({
      ...all,
      radiusM: WALKING_RADIUS_M,
      openNow: true,
      hasDeals: true,
    }),
  );
  assert.equal(filtered.length, 3);
  assert.ok(
    filtered.every(
      (pin) =>
        pin.openNow &&
        pin.deals.length > 0 &&
        pin.distanceM <= WALKING_RADIUS_M,
    ),
  );
});

test("an origin far from campus returns no pins", async () => {
  assert.deepEqual(
    groupNearbyBusinesses(
      await getDealsNearby({ lat: 0, lng: 0, radiusM: NEARBY_RADIUS_M }),
    ),
    [],
  );
});

test("distance labels use metres nearby and kilometres further away", () => {
  assert.equal(formatDistance(373), "373 m");
  assert.equal(formatDistance(1_400), "1.4 km");
});
