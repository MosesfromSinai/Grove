import * as webpush from "npm:web-push@4.0.0";
import { admin, signedIn } from "../_shared/auth.ts";
import { makeHandler, type Delivery } from "./handler.ts";

const secret=Deno.env.get("PUSH_DISPATCH_SECRET");
const publicKey=Deno.env.get("VAPID_PUBLIC_KEY");
const privateKey=Deno.env.get("VAPID_PRIVATE_KEY");
const subject=Deno.env.get("VAPID_SUBJECT");
const enabled=Deno.env.get("PUSH_SEND_ENABLED")==="true" && !!secret && secret.length>=32 && !!publicKey && !!privateKey && !!subject;
if (enabled) webpush.setVapidDetails(subject!,publicKey!,privateKey!);

const check = <T>(result: {data:T;error:unknown}):T => {
  if(result.error) throw Error("Database operation failed");
  return result.data;
};
Deno.serve(makeHandler({
  enabled, now:Date.now,
  async authorize(req,deal) {
    if(secret && secret.length>=32 && req.headers.get("Authorization")===`Bearer ${secret}`) return null;
    if(!deal) return "NOT_SIGNED_IN";
    const caller=await signedIn(req);
    if(!caller.ok) return caller.error;
    const row=check(await admin.from("deals").select("business_id,visibility").eq("id",deal).maybeSingle());
    if(!row) return "DEAL_NOT_LIVE";
    const owner=check(await admin.from("business_members").select("role").eq("business_id",row.business_id).eq("user_id",caller.id).eq("role","owner").maybeSingle());
    if(!owner) return "NOT_OWNER";
    if(row.visibility!=="public" || check(await admin.rpc("deal_live_at",{p_deal:deal,p_business:row.business_id}))!==true) return "DEAL_NOT_LIVE";
    return null;
  },
  async claim(deal) { return check(await admin.rpc("claim_push_deliveries",{p_deal_id:deal,p_limit:50})) as Delivery[]; },
  async send(row,payload,ttl) {
    if(check(await admin.rpc("push_delivery_eligible",{p_subscription_id:row.subscription_id,p_deal_id:row.deal_id}))!==true) throw Error("Preference or deal changed");
    await webpush.sendNotification({endpoint:row.endpoint,keys:row.keys},payload,{
      TTL:ttl,urgency:"normal",timeout:5000,
    });
  },
  async finish(row,outcome) {
    check(await admin.from("push_deliveries").update({outcome}).eq("subscription_id",row.subscription_id).eq("deal_id",row.deal_id).eq("window_start",row.window_start));
  },
  async remove(row) { check(await admin.from("push_subscriptions").delete().eq("id",row.subscription_id)); },
}));
