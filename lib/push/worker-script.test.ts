import {readFileSync} from "node:fs";
import vm from "node:vm";
import {expect,test,vi} from "vitest";
function worker() {
 const handlers:Record<string,(event:unknown)=>void>={};const showNotification=vi.fn().mockResolvedValue(undefined);const openWindow=vi.fn().mockResolvedValue(undefined);
 const self={addEventListener:(name:string,fn:(event:unknown)=>void)=>{handlers[name]=fn},registration:{showNotification},clients:{claim:vi.fn(),matchAll:vi.fn().mockResolvedValue([]),openWindow},skipWaiting:vi.fn(),location:{origin:"https://grove.example"}};
 vm.runInNewContext(readFileSync("public/sw.js","utf8"),{self,URL});return {handlers,self,showNotification,openWindow};
}
test("push always displays a visible notification and rejects external notification links",async()=>{
 const w=worker();let done!:Promise<unknown>;
 w.handlers.push({data:{json:()=>({title:"Deal",body:"Public",path:"https://evil.invalid"})},waitUntil:(p:Promise<unknown>)=>{done=p}});await done;
 expect(w.showNotification).toHaveBeenCalledWith("Deal",expect.objectContaining({data:{path:"/map"}}));
 w.handlers.notificationclick({notification:{close:vi.fn(),data:{path:"//evil.invalid"}},waitUntil:(p:Promise<unknown>)=>{done=p}});await done;
 expect(w.openWindow).toHaveBeenCalledWith("https://grove.example/map");expect(w.handlers.fetch).toBeUndefined();
});
test("malformed payload shows safe fallback and valid deal clicks focus same-origin window",async()=>{
 const w=worker();let done!:Promise<unknown>;
 w.handlers.push({data:{json:()=>{throw Error()}},waitUntil:(p:Promise<unknown>)=>{done=p}});await done;expect(w.showNotification.mock.calls[0][0]).toBe("Grove deal nearby");
 const client={url:"https://grove.example/profile",navigate:vi.fn().mockResolvedValue(undefined),focus:vi.fn()};w.self.clients.matchAll.mockResolvedValue([client] as never);
 const path="/deals/de000000-0000-4000-8000-000000000001";
 w.handlers.notificationclick({notification:{close:vi.fn(),data:{path}},waitUntil:(p:Promise<unknown>)=>{done=p}});await done;
 expect(client.navigate).toHaveBeenCalledWith("https://grove.example"+path);expect(client.focus).toHaveBeenCalled();expect(w.openWindow).not.toHaveBeenCalled();
});
