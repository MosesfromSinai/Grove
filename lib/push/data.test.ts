import {beforeEach,expect,test,vi} from "vitest";
import type {SupabaseClient} from "@supabase/supabase-js";
import type {Database} from "@/lib/supabase/database.types";
import {setClient,savePushSubscription,getPushSubscription,removePushSubscription} from "@/lib/supabase/queries";
const rpc=vi.fn();beforeEach(()=>{rpc.mockReset();setClient({rpc} as unknown as SupabaseClient<Database>)});
test("subscription wrappers use the shared RPC boundary and preserve server errors",async()=>{
 const input={endpoint:"https://fcm.googleapis.com/test",keys:{p256dh:"B"+"a".repeat(86),auth:"a".repeat(22)},lat:33.974,lng:-117.328};
 rpc.mockResolvedValue({data:{ok:true,expires_at:"later"},error:null});await savePushSubscription(input);
 expect(rpc).toHaveBeenCalledWith("save_push_subscription",{p_endpoint:input.endpoint,p_keys:input.keys,p_lat:input.lat,p_lng:input.lng});
 rpc.mockResolvedValue({data:{active:true,expires_at:"later"},error:null});expect((await getPushSubscription(input.endpoint)).active).toBe(true);
 rpc.mockResolvedValue({data:{ok:true},error:null});await removePushSubscription(input.endpoint);expect(rpc).toHaveBeenLastCalledWith("remove_push_subscription",{p_endpoint:input.endpoint});
 rpc.mockResolvedValue({data:null,error:{message:"offline"}});await expect(getPushSubscription(input.endpoint)).rejects.toThrow("offline");
});
test("mocks save/read/remove and never claim real delivery",async()=>{
 const api=await import("@/mocks");
 const input={endpoint:"https://web.push.apple.com/offline-mock",keys:{p256dh:"B"+"a".repeat(86),auth:"a".repeat(22)},lat:33.974,lng:-117.328};
 expect((await api.savePushSubscription(input)).ok).toBe(true);expect((await api.getPushSubscription(input.endpoint)).active).toBe(true);
 await api.removePushSubscription(input.endpoint);expect((await api.getPushSubscription(input.endpoint)).active).toBe(false);
 expect(await api.savePushSubscription({...input,endpoint:"http://localhost/private"})).toEqual({ok:false,error:"INVALID_SUBSCRIPTION"});
});
