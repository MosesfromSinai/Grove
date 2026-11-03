import { afterEach, expect, test, vi } from "vitest";
import {
  getMyBusiness,
  updateTruckLocation,
  getDealsNearby,
  setClient,
} from "./queries";

afterEach(() => setClient(null as unknown as Parameters<typeof setClient>[0]));
function useRpc(data: unknown, error: { message: string } | null = null) {
  const rpc = vi.fn().mockResolvedValue({ data, error });
  setClient({ rpc } as unknown as Parameters<typeof setClient>[0]);
  return rpc;
}

test("truck update calls the owner RPC with the contract coordinates", async () => {
  const result = {
    ok: true,
    location: { business_id: "truck", lat: 34, lng: -118 },
  };
  const rpc = useRpc(result);
  expect(await updateTruckLocation(result.location)).toEqual(result);
  expect(rpc).toHaveBeenCalledWith("update_truck_location", result.location);
});

test.each([
  [NaN, 0],
  [Infinity, 0],
  [91, 0],
  [0, -181],
])("invalid coordinates %s, %s never reach the server", async (lat, lng) => {
  const rpc = useRpc(null);
  expect(await updateTruckLocation({ business_id: "truck", lat, lng })).toEqual(
    { ok: false, error: "INVALID_LOCATION" },
  );
  expect(rpc).not.toHaveBeenCalled();
});

test("RPC failures reject so the UI cannot report a successful move", async () => {
  useRpc(null, { message: "permission denied" });
  await expect(
    updateTruckLocation({ business_id: "truck", lat: 34, lng: -118 }),
  ).rejects.toThrow("permission denied");
});

test("owner profile comes from the authenticated boundary; no profile is an error", async () => {
  const profile = { business: { id: "actual-business" }, pin_ready: true };
  const rpc = useRpc(profile);
  expect(await getMyBusiness()).toEqual(profile);
  expect(rpc).toHaveBeenCalledWith("get_my_business");
  useRpc(null);
  await expect(getMyBusiness()).rejects.toThrow("No owned business");
});

test("nearby wrapper sends all filters and propagates database errors", async () => {
  const rpc = useRpc([]);
  expect(
    await getDealsNearby({
      lat: 34,
      lng: -118,
      radiusM: 800,
      hasDeals: true,
      openNow: true,
    }),
  ).toEqual([]);
  expect(rpc).toHaveBeenCalledWith("deals_nearby", {
    lat: 34,
    lng: -118,
    radius_m: 800,
    has_deals: true,
    open_now: true,
  });
  useRpc(null, { message: "query failed" });
  await expect(
    getDealsNearby({ lat: 34, lng: -118, radiusM: 3000 }),
  ).rejects.toThrow("query failed");
});
