// Encrypt/sign one synthetic request without sending it. Run with NO network permission.
import * as webpush from "npm:web-push@4.0.0";
import { createECDH,randomBytes } from "node:crypto";
const receiver=createECDH("prime256v1");receiver.generateKeys();
const vapid=webpush.generateVAPIDKeys();
webpush.setVapidDetails("https://grove.example",vapid.publicKey,vapid.privateKey);
const plain="offline Grove notification";
const result=webpush.generateRequestDetails({endpoint:"https://web.push.apple.com/offline-test",
  keys:{p256dh:receiver.getPublicKey().toString("base64url"),auth:randomBytes(16).toString("base64url")}},plain,{
    TTL:60,vapidDetails:{subject:"https://grove.example",publicKey:vapid.publicKey,privateKey:vapid.privateKey},
  });
if(!result.body || result.body.includes(Buffer.from(plain)) || !result.headers.Authorization || result.headers["Content-Encoding"]!=="aes128gcm") throw Error("Offline push encryption check failed");
console.log("Offline VAPID signing and aes128gcm encryption passed. No request sent.");
