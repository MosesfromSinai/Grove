// The one data switch. Screens import from "@/lib/supabase" and get mocks/ until
// NEXT_PUBLIC_DATA_SOURCE=supabase (real data needs Celso's RLS policies, #128).

import * as mocks from "../../mocks";
import * as real from "./queries";

type Api = Pick<
  typeof mocks,
  | "getDealsNearby"
  | "getDeal"
  | "getBusinessBySlug"
  | "getMyRedemptions"
  | "getBusinessStats"
  | "getMyDeals"
  | "getOpenClubNights"
  | "getClubNights"
  | "getStaff"
  | "subscribeToRedemptions"
  | "redeem"
  | "redeemPin"
  | "issueCode"
  | "staffRedeem"
  | "claimClubNight"
  | "setPin"
  | "addStaff"
  | "notifyDeal"
>;

// Both assignments fail to compile if a real wrapper and its mock ever differ.
const realApi: Api = real;
const mockApi: { [K in keyof Api]: (typeof real)[K] } = mocks;

const api: Api = process.env.NEXT_PUBLIC_DATA_SOURCE === "supabase" ? realApi : mockApi;

export const {
  getDealsNearby,
  getDeal,
  getBusinessBySlug,
  getMyRedemptions,
  getBusinessStats,
  getMyDeals,
  getOpenClubNights,
  getClubNights,
  getStaff,
  subscribeToRedemptions,
  redeem,
  redeemPin,
  issueCode,
  staffRedeem,
  claimClubNight,
  setPin,
  addStaff,
  notifyDeal,
} = api;

export * from "./types";
export { campusClock, dealStatus, liveUntil, openNow } from "./deal-status";
