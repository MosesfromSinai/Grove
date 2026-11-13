import {beforeEach,expect,test,vi} from "vitest";
import {makeHandler,type Delivery} from "../../supabase/functions/notify-deal/handler";
const row:Delivery={subscription_id:"sub",deal_id:"de000000-0000-4000-8000-000000000001",window_start:"2026-11-12T00:00:00Z",endpoint:"https://web.push.apple.com/offline-test",keys:{p256dh:"test",auth:"test"},business_name:"Test kitchen",title:"Public lunch deal",live_until:"2026-11-12T02:00:00Z"};
const deps={authorize:vi.fn(),enabled:true,claim:vi.fn(),send:vi.fn(),finish:vi.fn(),remove:vi.fn(),now:()=>Date.parse("2026-11-12T01:00:00Z")};
const request=(body:unknown={})=>new Request("https://test.invalid/notify-deal",{method:"POST",body:JSON.stringify(body)});
beforeEach(()=>{vi.resetAllMocks();deps.authorize.mockResolvedValue(null);deps.enabled=true;deps.claim.mockResolvedValue([row]);deps.send.mockResolvedValue(undefined);deps.finish.mockResolvedValue(undefined);deps.remove.mockResolvedValue(undefined);});
test("unauthorized callers and disabled deployment never claim or send",async()=>{
 deps.authorize.mockResolvedValue("NOT_SIGNED_IN");expect(await (await makeHandler(deps)(request())).json()).toEqual({ok:false,error:"NOT_SIGNED_IN"});expect(deps.claim).not.toHaveBeenCalled();
 deps.authorize.mockResolvedValue(null);deps.enabled=false;expect(await (await makeHandler(deps)(request())).json()).toEqual({ok:false,error:"PUSH_DISABLED"});expect(deps.send).not.toHaveBeenCalled();
});
test.each(["NOT_OWNER","DEAL_NOT_LIVE"])("owner rejection %s cannot send",async(error)=>{
 deps.authorize.mockResolvedValue(error);expect(await (await makeHandler(deps)(request({deal_id:row.deal_id}))).json()).toEqual({ok:false,error});expect(deps.claim).not.toHaveBeenCalled();
});
test("sends only DB-derived content with bounded lifetime and records success",async()=>{
 const response=await makeHandler(deps)(request({deal_id:row.deal_id,endpoint:"https://evil.invalid",title:"Ignore me"}));
 expect(await response.json()).toEqual({ok:true,sent:1,failed:0});
 expect(deps.claim).toHaveBeenCalledWith(row.deal_id);expect(deps.send).toHaveBeenCalledWith(row,JSON.stringify({title:"Test kitchen",body:"Public lunch deal",path:`/deals/${row.deal_id}`}),3600);
 expect(deps.finish).toHaveBeenCalledWith(row,"sent");
});
test.each([404,410])("expired provider response %i removes the subscription",async(statusCode)=>{
 deps.send.mockRejectedValue({statusCode});expect(await (await makeHandler(deps)(request())).json()).toEqual({ok:true,sent:0,failed:1});expect(deps.remove).toHaveBeenCalledWith(row);
});
test("transient failure is recorded without automatic retry or leaking endpoint/errors",async()=>{
 deps.send.mockRejectedValue(Error("secret endpoint body"));const response=await makeHandler(deps)(request());expect(await response.text()).not.toContain("secret");expect(deps.send).toHaveBeenCalledOnce();expect(deps.finish).toHaveBeenCalledWith(row,"failed");
});
test("unsafe endpoints and expired windows never reach a network sender",async()=>{
 deps.claim.mockResolvedValue([{...row,endpoint:"https://127.0.0.1/private"},{...row,live_until:"2026-11-11T00:00:00Z"}]);
 expect(await (await makeHandler(deps)(request())).json()).toEqual({ok:true,sent:0,failed:2});expect(deps.send).not.toHaveBeenCalled();
});
test("bad methods, JSON and ids reject before claiming",async()=>{
 const handler=makeHandler(deps);expect((await handler(new Request("https://test.invalid"))).status).toBe(405);
 expect((await handler(new Request("https://test.invalid",{method:"POST",body:"bad"}))).status).toBe(400);
 expect((await handler(request({deal_id:"not-a-uuid"}))).status).toBe(400);
 expect((await handler(new Request("https://test.invalid",{method:"OPTIONS"}))).status).toBe(204);expect(deps.claim).not.toHaveBeenCalled();
});
