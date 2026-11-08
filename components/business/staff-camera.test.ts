// @vitest-environment jsdom
import { beforeEach, afterEach, expect, test, vi } from "vitest";
import { startStaffCamera } from "./staff-camera";

const ready = vi.fn(); const decoded = vi.fn(); const failed = vi.fn();
let node: HTMLDivElement;
beforeEach(() => { ready.mockReset(); decoded.mockReset(); failed.mockReset(); node = document.createElement("div"); node.id = "test-camera"; document.body.append(node); });
afterEach(() => node.remove());
function camera(start: () => Promise<null> = async () => null) {
  let receive: (text: string) => void = () => {};
  const instance = { isScanning: false, start: vi.fn(async (_camera: unknown, _config: unknown, callback: (text: string) => void) => { receive = callback; const result = await start(); instance.isScanning = true; return result; }), stop: vi.fn(async () => { instance.isScanning = false; }), clear: vi.fn() };
  const load = async () => ({ Html5Qrcode: class { constructor() { return instance; } }, Html5QrcodeSupportedFormats: { QR_CODE: 0 } }) as unknown as typeof import("html5-qrcode");
  return { instance, load, receive: (text: string) => receive(text) };
}
const settle = () => new Promise(resolve => setTimeout(resolve, 0));

test("camera decodes QR only, and serialized cleanup suppresses further callbacks", async () => {
  const fake = camera(); const stop = startStaffCamera(node.id, { ready, decoded, failed }, fake.load); await settle();
  expect(ready).toHaveBeenCalledTimes(1); expect(fake.instance.start).toHaveBeenCalledWith({ facingMode: "environment" }, expect.objectContaining({ fps: 10 }), expect.any(Function), expect.any(Function));
  fake.receive("opaque"); expect(decoded).toHaveBeenCalledWith("opaque");
  await Promise.all([stop(), stop()]); fake.receive("late"); expect(decoded).toHaveBeenCalledTimes(1); expect(fake.instance.stop).toHaveBeenCalledTimes(1); expect(fake.instance.clear).toHaveBeenCalledTimes(1);
});
test("leaving during camera permission/startup stops a late stream without a ready or decode callback", async () => {
  let resolve: (value: null) => void = () => {};
  const fake = camera(() => new Promise(done => { resolve = done; })); const stop = startStaffCamera(node.id, { ready, decoded, failed }, fake.load); await settle();
  const stopped = stop(); resolve(null); await stopped;
  expect(ready).not.toHaveBeenCalled(); fake.receive("late"); expect(decoded).not.toHaveBeenCalled(); expect(fake.instance.stop).toHaveBeenCalledTimes(1);
});
test("cancelling a delayed library import never opens a camera", async () => {
  const fake = camera(); let loaded: (value: typeof import("html5-qrcode")) => void = () => {};
  const stop = startStaffCamera(node.id, { ready, decoded, failed }, () => new Promise(done => { loaded = done; }));
  const stopped = stop(); loaded(await fake.load()); await stopped; expect(fake.instance.start).not.toHaveBeenCalled();
});
test("a late previous session cannot clear a new preview that reused its element ID", async () => {
  let resolve: (value: null) => void = () => {};
  const fake = camera(() => new Promise(done => { resolve = done; })); const stop = startStaffCamera(node.id, { ready, decoded, failed }, fake.load); await settle();
  const stopped = stop(); const replacement = document.createElement("div"); replacement.id = node.id; replacement.textContent = "New preview"; node.replaceWith(replacement);
  resolve(null); await stopped; expect(fake.instance.stop).toHaveBeenCalledTimes(1); expect(fake.instance.clear).not.toHaveBeenCalled(); expect(replacement.textContent).toBe("New preview"); replacement.remove();
});
test("the library's unawaited play rejection during cleanup is handled on its own video", async () => {
  let rejectPlay: (reason: Error) => void = () => {};
  const originalAppend = node.append;
  const fake = camera(async () => {
    const video = document.createElement("video");
    Object.defineProperty(video, "play", { configurable: true, writable: true, value: () => new Promise<void>((_, reject) => { rejectPlay = reject; }) });
    node.append(video); void video.play(); return null;
  });
  const stop = startStaffCamera(node.id, { ready, decoded, failed }, fake.load); await settle();
  const stopped = stop(); rejectPlay(new DOMException("media removed", "AbortError")); await stopped; await settle();
  expect(failed).not.toHaveBeenCalled(); expect(node.append).toBe(originalAppend); expect(fake.instance.stop).toHaveBeenCalledTimes(1);
});
test("startup failures are handled, and media tracks stop even when the library stop fails", async () => {
  const denied = camera(async () => { throw new Error("permission denied"); }); const denyStop = startStaffCamera(node.id, { ready, decoded, failed }, denied.load); await settle(); await denyStop(); expect(failed).toHaveBeenCalledTimes(1);
  const trackStop = vi.fn(); const video = document.createElement("video"); Object.defineProperty(video, "srcObject", { value: { getTracks: () => [{ stop: trackStop }] } }); node.append(video);
  const fake = camera(); fake.instance.stop.mockRejectedValueOnce(new Error("library stop failed")); const stop = startStaffCamera(node.id, { ready, decoded, failed }, fake.load); await settle(); await stop(); expect(trackStop).toHaveBeenCalledTimes(1); expect(fake.instance.clear).toHaveBeenCalledTimes(1);
});
