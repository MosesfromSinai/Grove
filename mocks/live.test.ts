import { expect, test } from "vitest";
import { MOCK_POSITIONS, redeem, subscribeToRedemptions } from "./index";
import type { Redemption } from "../lib/supabase/types";

test("subscribeToRedemptions hears new visits at its business until unsubscribed", async () => {
  const heard: Redemption[] = [];
  const elsewhere: Redemption[] = [];
  const stop = subscribeToRedemptions({ businessId: "biz-opt" }, (r) => heard.push(r));
  subscribeToRedemptions({ businessId: "biz-bob" }, (r) => elsewhere.push(r));

  const input = { deal_id: "deal-opt-horchata", qr_slug: "orange-peel-tacos", ...MOCK_POSITIONS.atOrangePeelTacos };
  expect(await redeem(input)).toMatchObject({ ok: true });
  expect(heard).toMatchObject([{ deal_title: "Free horchata with any combo", business_name: "Orange Peel Tacos" }]);
  expect(elsewhere).toEqual([]);

  stop();
  await redeem(input); // ALREADY_REDEEMED_TODAY, and nobody is listening anyway
  expect(heard).toHaveLength(1);
});
