// @vitest-environment jsdom
import { afterEach,beforeEach,expect,test,vi } from "vitest";
import { disablePush,signOutWithPush,enablePush,locationForPush,pushSupport,vapidBytes } from "./browser";
const endpoint="https://fcm.googleapis.com/fcm/send/offline-test";
const keys={p256dh:"B"+"a".repeat(86),auth:"a".repeat(22)};
const key=btoa(String.fromCharCode(4)+"a".repeat(64)).replace(/=/g,"");
const unsubscribe=vi.fn();const save=vi.fn();const requestPermission=vi.fn();
const sub={endpoint,toJSON:()=>({endpoint,keys}),unsubscribe};
const getSubscription=vi.fn();const subscribe=vi.fn();
const reg={active:{scriptURL:"http://localhost:3000/sw.js"},pushManager:{getSubscription,subscribe}} as unknown as ServiceWorkerRegistration;
beforeEach(()=>{
 vi.clearAllMocks();unsubscribe.mockResolvedValue(true);save.mockResolvedValue({ok:true,expires_at:"2026-11-20T00:00:00Z"});
 requestPermission.mockResolvedValue("granted");getSubscription.mockResolvedValue(null);subscribe.mockResolvedValue(sub);
 vi.stubGlobal("isSecureContext",true);vi.stubGlobal("PushManager",function(){});
 vi.stubGlobal("Notification",{permission:"default",requestPermission});
 vi.stubGlobal("matchMedia",()=>({matches:false}));
 Object.defineProperty(navigator,"serviceWorker",{configurable:true,value:{getRegistration:vi.fn().mockResolvedValue(reg)}});
});
afterEach(()=>{vi.unstubAllGlobals();delete (navigator as unknown as Record<string,unknown>).serviceWorker;});
test("enable requests notification permission before async subscription work and persists confirmed data",async()=>{
 const result=await enablePush(reg,key,{lat:33.974,lng:-117.328},save);
 expect(result.ok).toBe(true);expect(save).toHaveBeenCalledWith({endpoint,keys,lat:33.974,lng:-117.328});
 expect(requestPermission.mock.invocationCallOrder[0]).toBeLessThan(getSubscription.mock.invocationCallOrder[0]);
 expect(subscribe).toHaveBeenCalledWith({userVisibleOnly:true,applicationServerKey:expect.any(Uint8Array)});
});
test("denied permission never subscribes or saves",async()=>{
 requestPermission.mockResolvedValue("denied");await expect(enablePush(reg,key,{lat:0,lng:0},save)).rejects.toThrow("PERMISSION_DENIED");
 expect(subscribe).not.toHaveBeenCalled();expect(save).not.toHaveBeenCalled();
});
test.each(["NOT_VERIFIED_STUDENT","SUBSCRIPTION_IN_USE"])("a rejected save rolls back a new browser subscription (%s)",async(error)=>{
 save.mockResolvedValue({ok:false,error});expect((await enablePush(reg,key,{lat:0,lng:0},save)).ok).toBe(false);expect(unsubscribe).toHaveBeenCalledOnce();
});
test("uncertain save rolls back a new subscription but preserves an existing one",async()=>{
 save.mockRejectedValue(Error("offline"));await expect(enablePush(reg,key,{lat:0,lng:0},save)).rejects.toThrow("offline");expect(unsubscribe).toHaveBeenCalledOnce();
 unsubscribe.mockClear();getSubscription.mockResolvedValue(sub);await expect(enablePush(reg,key,{lat:0,lng:0},save)).rejects.toThrow();expect(unsubscribe).not.toHaveBeenCalled();
});
test("provider URL validation prevents saving a localhost or unknown endpoint",async()=>{
 subscribe.mockResolvedValue({...sub,endpoint:"https://127.0.0.1/private"});await expect(enablePush(reg,key,{lat:0,lng:0},save)).rejects.toThrow("UNSUPPORTED_PROVIDER");expect(save).not.toHaveBeenCalled();
});
test("sign-out waits for in-flight saves, then revokes and unsubscribes",async()=>{
 let finish!:(result:{ok:true;expires_at:string})=>void;
 save.mockReturnValue(new Promise(resolve=>{finish=resolve}));
 const enabling=enablePush(reg,key,{lat:0,lng:0},save);await vi.waitFor(()=>expect(save).toHaveBeenCalled());
 getSubscription.mockResolvedValue(sub);const remove=vi.fn().mockResolvedValue({ok:true});const stopping=disablePush(remove);
 expect(remove).not.toHaveBeenCalled();finish({ok:true,expires_at:"later"});await enabling;await stopping;
 expect(remove).toHaveBeenCalledWith(endpoint);expect(unsubscribe).toHaveBeenCalled();
});
test("offline server deletion still permits sign-out when the browser unsubscribes",async()=>{
 getSubscription.mockResolvedValue(sub);await expect(disablePush(vi.fn().mockRejectedValue(Error("offline")))).resolves.toBeUndefined();
});
test("both unsubscribe paths failing is surfaced",async()=>{
 getSubscription.mockResolvedValue(sub);unsubscribe.mockResolvedValue(false);
 await expect(disablePush(vi.fn().mockResolvedValue({ok:false,error:"NOT_SIGNED_IN"}))).rejects.toThrow("UNSUBSCRIBE_FAILED");
});
test("location is explicitly requested and rounded, and denied location is not replaced with campus",async()=>{
 Object.defineProperty(navigator,"geolocation",{configurable:true,value:{getCurrentPosition:(ok:(x:unknown)=>void)=>ok({coords:{latitude:33.973732,longitude:-117.328174}})}});
 expect(await locationForPush()).toEqual({lat:33.974,lng:-117.328});
 Object.defineProperty(navigator,"geolocation",{configurable:true,value:{getCurrentPosition:(_:unknown,fail:()=>void)=>fail()}});
 await expect(locationForPush()).rejects.toThrow("LOCATION_UNAVAILABLE");
});
test("insecure and non-installed iPhone modes never report support",()=>{
 vi.stubGlobal("isSecureContext",false);expect(pushSupport()).toBe("unsupported");vi.stubGlobal("isSecureContext",true);
 vi.spyOn(navigator,"userAgent","get").mockReturnValue("iPhone Safari");expect(pushSupport()).toBe("install");vi.restoreAllMocks();
 expect(vapidBytes(key)).toHaveLength(65);expect(()=>vapidBytes("bad")).toThrow();
});


test("starting disable first blocks a late enable while registration lookup is pending",async()=>{
 let finish!:(value:ServiceWorkerRegistration)=>void;
 vi.mocked(navigator.serviceWorker.getRegistration).mockReturnValueOnce(new Promise(resolve=>{finish=resolve}));
 const stopping=disablePush(vi.fn().mockResolvedValue({ok:true}));
 await expect(enablePush(reg,key,{lat:0,lng:0},save)).rejects.toThrow("PUSH_BUSY");
 expect(requestPermission).not.toHaveBeenCalled();finish(reg);await stopping;
});
test("sign-out holds the enable lock until auth has finished",async()=>{
 let finish!:()=>void;const logout=vi.fn(()=>new Promise<void>(resolve=>{finish=resolve}));
 const leaving=signOutWithPush(vi.fn().mockResolvedValue({ok:true}),logout);
 await vi.waitFor(()=>expect(logout).toHaveBeenCalled());
 await expect(enablePush(reg,key,{lat:0,lng:0},save)).rejects.toThrow("PUSH_BUSY");
 finish();await leaving;expect(requestPermission).not.toHaveBeenCalled();
});


test("an uncertain save and failed browser rollback is still exposed to the caller for recovery",async()=>{
 save.mockRejectedValue(Error("offline"));unsubscribe.mockResolvedValue(false);
 await expect(enablePush(reg,key,{lat:0,lng:0},save)).rejects.toThrow("offline");expect(unsubscribe).toHaveBeenCalled();
});
