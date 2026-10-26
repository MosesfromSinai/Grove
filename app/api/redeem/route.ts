import { NextResponse } from "next/server";
import { redeemDeal } from "@/lib/redeem";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const code = body?.code;
  if (typeof code !== "string" || !code) {
    return NextResponse.json({ ok: false, reason: "invalid" }, { status: 400 });
  }
  return NextResponse.json(await redeemDeal(code));
}