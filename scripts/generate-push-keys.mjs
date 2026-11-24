// Generate locally once. Values are written only to ignored .env.local, never stdout.
import { generateKeyPairSync, randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync, chmodSync } from "node:fs";
const path=".env.local";
const previous=existsSync(path)?readFileSync(path,"utf8"):"";
const configured=previous.split(/\r?\n/).some(line=>{
  const match=/^(NEXT_PUBLIC_VAPID_PUBLIC_KEY|VAPID_PUBLIC_KEY|VAPID_PRIVATE_KEY|PUSH_DISPATCH_SECRET)=(.*)$/.exec(line);
  return match && match[2].split("#")[0].trim().length>0;
});
if(configured) {
  throw Error("Push keys already exist. Preserve the current pair; rotate only with a re-subscription plan.");
}
const {privateKey}=generateKeyPairSync("ec",{namedCurve:"prime256v1"});
const jwk=privateKey.export({format:"jwk"});
const publicKey=Buffer.concat([Buffer.from([4]),Buffer.from(jwk.x,"base64url"),Buffer.from(jwk.y,"base64url")]).toString("base64url");
const values={NEXT_PUBLIC_VAPID_PUBLIC_KEY:publicKey,VAPID_PUBLIC_KEY:publicKey,VAPID_PRIVATE_KEY:jwk.d,
  VAPID_SUBJECT:"https://grove-jade.vercel.app",PUSH_DISPATCH_SECRET:randomBytes(32).toString("base64url"),
  NEXT_PUBLIC_PUSH_ENABLED:"false",PUSH_SEND_ENABLED:"false"};
let text=previous;
for(const [key,value] of Object.entries(values)) {
  const line=new RegExp(`^${key}=.*$`,"m");
  text=line.test(text)?text.replace(line,`${key}=${value}`):`${text.trimEnd()}\n${key}=${value}\n`;
}
writeFileSync(path,text.trimStart(),{mode:0o600});chmodSync(path,0o600);
console.log("Push configuration written to .env.local. Sending and the UI remain disabled. No values printed.");
