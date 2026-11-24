import {execFileSync} from "node:child_process";
import {mkdtempSync,readFileSync,rmSync,statSync,writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join,resolve} from "node:path";
import {expect,test} from "vitest";
test("key generator preserves other env values, hides keys and refuses replacement",()=>{
 const dir=mkdtempSync(join(tmpdir(),"grove-push-keys-test-"));
 try {
  writeFileSync(join(dir,".env.local"),"EXISTING_SETTING=unchanged\nVAPID_PRIVATE_KEY=  # empty placeholder\n");
  const script=resolve("scripts/generate-push-keys.mjs");
  const output=execFileSync(process.execPath,[script],{cwd:dir,encoding:"utf8"});
  const text=readFileSync(join(dir,".env.local"),"utf8");const values=Object.fromEntries(text.trim().split("\n").map(line=>line.split("=")));
  expect(values.EXISTING_SETTING).toBe("unchanged");expect(values.VAPID_PUBLIC_KEY).toBe(values.NEXT_PUBLIC_VAPID_PUBLIC_KEY);
  expect(Buffer.from(values.VAPID_PUBLIC_KEY,"base64url")).toHaveLength(65);expect(Buffer.from(values.VAPID_PRIVATE_KEY,"base64url")).toHaveLength(32);
  expect(Buffer.from(values.PUSH_DISPATCH_SECRET,"base64url")).toHaveLength(32);expect(values.PUSH_SEND_ENABLED).toBe("false");
  expect(output).not.toContain(values.VAPID_PRIVATE_KEY);expect(statSync(join(dir,".env.local")).mode&0o777).toBe(0o600);
  expect(()=>execFileSync(process.execPath,[script],{cwd:dir,stdio:"pipe"})).toThrow();expect(readFileSync(join(dir,".env.local"),"utf8")).toBe(text);
 } finally {rmSync(dir,{recursive:true,force:true});}
});
