import type { ErrorCode } from "@/lib/supabase";

export const errorMessages: Record<ErrorCode, string> = {
  NOT_SIGNED_IN: "Sign in to redeem deals.",
  NOT_VERIFIED_STUDENT: "Verify your school email to redeem deals.",
  DEAL_NOT_LIVE: "This deal isn't live right now.",
  WRONG_BUSINESS: "That sticker is for a different restaurant. Scan the one at this counter.",
  TOO_FAR: "You need to be at the restaurant to redeem. Move closer and try again.",
  LOCATION_REQUIRED: "Turn on location so we can confirm you're at the restaurant.",
  ALREADY_REDEEMED_TODAY: "You already used this deal today. Come back tomorrow.",
  BAD_PIN: "That PIN isn't right. Try again.",
  CODE_EXPIRED: "That code expired. Ask for a new one.",
  NOT_STAFF: "Only this restaurant's staff can do that.",
  RATE_LIMITED: "Too many tries. Wait a minute and try again.",
  ALREADY_CLAIMED: "Another club already claimed this night.",
  CLUB_NIGHT_EXPIRED: "This club night has ended.",
  NOT_OWNER: "Only the business owner can do that.",
};