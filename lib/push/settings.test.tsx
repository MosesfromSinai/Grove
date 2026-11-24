// @vitest-environment jsdom
import {act} from "react";
import {createRoot,type Root} from "react-dom/client";
import {afterEach,beforeEach,expect,test,vi} from "vitest";
import {PushSettings} from "./settings";
const m=vi.hoisted(()=>{
 process.env.NEXT_PUBLIC_PUSH_ENABLED="true";process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY="test-public-key";
 return {support:vi.fn(),prepare:vi.fn(),location:vi.fn(),enable:vi.fn(),disable:vi.fn(),get:vi.fn(),subscription:vi.fn()};
});
vi.mock("./browser",()=>({pushSupport:m.support,preparePush:m.prepare,locationForPush:m.location,enablePush:m.enable,disablePush:m.disable}));
vi.mock("@/lib/supabase",()=>({isMockData:false,getPushSubscription:m.get,savePushSubscription:vi.fn(),removePushSubscription:vi.fn()}));
let node:HTMLDivElement;let root:Root;
beforeEach(()=>{
 vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT",true);vi.clearAllMocks();process.env.NEXT_PUBLIC_PUSH_ENABLED="true";
 m.support.mockReturnValue("supported");m.subscription.mockResolvedValue(null);m.prepare.mockResolvedValue({pushManager:{getSubscription:m.subscription}});
 m.location.mockResolvedValue({lat:33.974,lng:-117.328});m.enable.mockResolvedValue({ok:true,expires_at:"2026-11-19T00:00:00Z"});m.disable.mockResolvedValue(undefined);
 vi.stubGlobal("Notification",{permission:"granted"});node=document.createElement("div");document.body.append(node);root=createRoot(node);
});
afterEach(async()=>{await act(async()=>root.unmount());node.remove();vi.unstubAllGlobals();});
async function render(){await act(async()=>{root.render(<PushSettings/>);});}
function button(text:string){return [...node.querySelectorAll<HTMLButtonElement>("button")].find(x=>x.textContent===text)!;}
test("hidden rollout does no worker or permission work",async()=>{
 process.env.NEXT_PUBLIC_PUSH_ENABLED="false";await render();expect(node.textContent).toBe("");expect(m.prepare).not.toHaveBeenCalled();expect(m.enable).not.toHaveBeenCalled();
});
test("iPhone install instructions precede notification permission and worker registration",async()=>{
 m.support.mockReturnValue("install");await render();expect(node.textContent).toContain("Add to Home Screen");expect(m.prepare).not.toHaveBeenCalled();expect(node.querySelector("button")).toBeNull();
});
test("explicit area then enable, confirmed state, and turning off",async()=>{
 await render();expect(m.location).not.toHaveBeenCalled();expect(m.enable).not.toHaveBeenCalled();expect(button("Enable alerts").disabled).toBe(true);
 await act(async()=>button("Set alert area").click());expect(button("Enable alerts").disabled).toBe(false);
 await act(async()=>button("Enable alerts").click());expect(node.textContent).toContain("Alerts are enabled");expect(button("Turn off alerts")).toBeDefined();
 await act(async()=>button("Turn off alerts").click());expect(node.textContent).toContain("Alerts are off");
});
test("denied location cannot enable or silently use a campus fallback",async()=>{
 m.location.mockRejectedValue(Error("LOCATION_UNAVAILABLE"));await render();await act(async()=>button("Set alert area").click());
 expect(button("Enable alerts").disabled).toBe(true);expect(m.enable).not.toHaveBeenCalled();expect(node.textContent).toContain("saved area was not changed");
});
test("server refusal stays off and displays a friendly error",async()=>{
 m.enable.mockResolvedValue({ok:false,error:"SUBSCRIPTION_IN_USE"});await render();await act(async()=>button("Set alert area").click());await act(async()=>button("Enable alerts").click());
 expect(node.textContent).toContain("another Grove account");expect(node.textContent).not.toContain("Alerts are enabled");
});
test("worker failure has a reload message rather than a false enabled state",async()=>{
 m.prepare.mockRejectedValue(Error("timeout"));await render();expect(node.textContent).toContain("Reload this page");expect(node.querySelector("button")).toBeNull();
});


test("uncertain enable with a remaining browser subscription keeps an off action and unknown status",async()=>{
 m.subscription.mockResolvedValueOnce(null).mockResolvedValue({endpoint:"https://fcm.googleapis.com/test"});
 m.enable.mockRejectedValue(Error("offline"));await render();await act(async()=>button("Set alert area").click());await act(async()=>button("Enable alerts").click());
 expect(node.textContent).toContain("Status unknown");expect(button("Turn off alerts")).toBeDefined();expect(button("Enable alerts").disabled).toBe(true);
 await act(async()=>button("Turn off alerts").click());expect(node.textContent).toContain("Alerts are off");
});
