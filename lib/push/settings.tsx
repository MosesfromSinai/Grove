"use client";

import { useEffect, useRef, useState } from "react";
import { getPushSubscription, savePushSubscription, removePushSubscription, isMockData } from "@/lib/supabase";
import { disablePush, enablePush, locationForPush, preparePush, pushSupport } from "./browser";

const messages: Record<string,string> = {
  PUSH_BUSY:"Another alert change is in progress. Try again when it finishes.",
  VAPID_KEY_CHANGED:"The alert key changed. Turn alerts off, then enable them again.",
  PERMISSION_DENIED:"Notifications are off. You can allow them in your device’s notification settings.",
  LOCATION_UNAVAILABLE:"We couldn’t get your location. Allow location access and try again; your saved area was not changed.",
  NOT_SIGNED_IN:"Sign in again before enabling alerts.", NOT_VERIFIED_STUDENT:"Alerts are for verified campus students.",
  INVALID_LOCATION:"We couldn’t save that area. Try setting your alert area again.",
  INVALID_SUBSCRIPTION:"This browser’s subscription could not be saved.", UNSUPPORTED_PROVIDER:"This browser’s push service isn’t supported yet.",
  DEVICE_LIMIT:"You already have five devices enabled. Turn alerts off on another device first.",
  SUBSCRIPTION_IN_USE:"This browser belongs to another Grove account. Sign out of that account and turn off its alerts first.",
};
export function PushSettings() {
  if(process.env.NEXT_PUBLIC_PUSH_ENABLED!=="true") return null;
  if(!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) return <p className="text-sm text-ink-muted">Deal alerts aren’t configured yet.</p>;
  if(isMockData) return <p className="text-sm text-ink-muted">Deal alerts are unavailable in the sample preview.</p>;
  return <EnabledPushSettings />;
}
function EnabledPushSettings() {
  const registration=useRef<ServiceWorkerRegistration|null>(null);
  const live=useRef(true);
  const lock=useRef(false);
  const [phase,setPhase]=useState("loading");
  const [busy,setBusy]=useState(false);
  const [area,setArea]=useState<{lat:number;lng:number}|null>(null);
  const [expiry,setExpiry]=useState<string|null>(null);
  const [subscribed,setSubscribed]=useState(false);
  const [message,setMessage]=useState("");
  useEffect(()=>{
    live.current=true;
    async function load() {
      const support=pushSupport();
      if(support!=="supported") { await Promise.resolve(); if(live.current) setPhase(support); return; }
      try {
        const reg=await preparePush();
        const sub=await reg.pushManager.getSubscription();
        const state=sub?await getPushSubscription(sub.endpoint):{active:false,expires_at:null};
        if(!live.current) return;
        registration.current=reg;setSubscribed(!!sub);setExpiry(state.expires_at);
        setPhase(state.active&&Notification.permission==="granted"?"on":"off");
      } catch { if(live.current) { setPhase("failed");setMessage("Alerts couldn’t load. Reload this page to try again."); } }
    }
    void load();
    return ()=>{ live.current=false; };
  },[]);
  async function run(action:()=>Promise<void>) {
    if(lock.current) return;
    lock.current=true;setBusy(true);setMessage("");
    try { await action(); }
    catch(error) { if(live.current) setMessage(messages[(error as Error).message]??"We couldn’t finish that change. Try again; check the alert status before leaving."); }
    finally { lock.current=false;if(live.current) setBusy(false); }
  }
  async function areaAction() {
    const next=await locationForPush();
    if(live.current) { setArea(next);setMessage("Area ready. Tap Enable alerts to save it for seven days."); }
  }
  async function enableAction() {
    if(!area||!registration.current) return;
    try {
    const result=await enablePush(registration.current,process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY??"",area,savePushSubscription);
    if(!live.current) return;
    if(!result.ok) throw Error(result.error);
    setExpiry(result.expires_at);setPhase("on");setSubscribed(true);setArea(null);setMessage("Alerts are enabled for this saved area.");
    } catch(error) {
      // A save may have committed before a lost response. Browser rollback can also
      // fail: keep a usable revocation action instead of claiming alerts are Off.
      const remaining=await registration.current.pushManager.getSubscription().catch(()=>undefined);
      if(live.current) { setSubscribed(remaining!==null);setPhase(remaining===null?"off":"unknown"); }
      throw error;
    }
  }
  async function disableAction() {
    await disablePush(removePushSubscription);
    if(live.current) { setPhase("off");setSubscribed(false);setExpiry(null);setArea(null);setMessage("Alerts are off on this device."); }
  }
  const button="min-h-11 rounded-button border border-border-strong bg-surface px-4 text-sm font-bold text-green-dark focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50";
  return <section className="rounded-card border bg-surface p-4" aria-labelledby="push-title" aria-busy={busy}>
    <h2 id="push-title" className="text-xl">Nearby deal alerts</h2>
    <p className="mt-2 text-sm text-ink-muted">Choose a saved area for public campus deals within 3 km. We round the location to about 100 m and expire the alert area after seven days. No background tracking. Up to three alerts per 24 hours for this saved alert setup.</p>
    {phase==="install" ? <p className="mt-3 text-sm">On iPhone or iPad, use Safari’s Share menu → Add to Home Screen, then open Grove from its icon to enable alerts.</p>
      : phase==="unsupported" ? <p className="mt-3 text-sm">Push isn’t supported in this browser. Use a supported browser over HTTPS.</p>
      : phase==="loading" ? <p className="mt-3 text-sm">Checking alerts…</p>
      : phase!=="failed" && <>
        <p className="mt-3 text-sm font-bold">{phase==="on"?`On${expiry?` until ${new Date(expiry).toLocaleDateString()}`:""}`:phase==="unknown"?"Status unknown. Turn alerts off before retrying.":"Off"}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className={button} disabled={busy} onClick={()=>void run(areaAction)}>Set alert area</button>
          <button type="button" className={button} disabled={busy||!area||phase==="unknown"} onClick={()=>void run(enableAction)}>Enable alerts</button>
          {subscribed&&<button type="button" className={button} disabled={busy} onClick={()=>void run(disableAction)}>Turn off alerts</button>}
        </div>
      </>}
    <p role="status" className="mt-3 text-sm text-ink-muted">{message}</p>
  </section>;
}
