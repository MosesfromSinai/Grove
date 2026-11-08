import QRCode from "qrcode";
import { withPrintResolution } from "./sticker-format";

export const DEAL_QR_PIXELS = 1200;

export async function renderDealQrPng(input: { url: string; demo: boolean }): Promise<Blob> {
  const styles = getComputedStyle(document.documentElement);
  const token = (name: string) => {
    const value = styles.getPropertyValue(name).trim();
    if (!value) throw new Error("Grove’s image styles are unavailable. Reload the page and try again.");
    return value;
  };
  const ink = token("--color-ink");
  const white = token("--color-surface");
  const green = token("--color-green");
  const heading = token("--font-bricolage");
  const body = token("--font-figtree");
  await document.fonts.ready;
  await Promise.all([document.fonts.load(`800 64px ${heading}`), document.fonts.load(`700 40px ${body}`)]);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = DEAL_QR_PIXELS;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("This browser could not create the QR image. Try another browser.");
  ctx.fillStyle = white;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = green;
  ctx.textAlign = "center";
  ctx.font = `800 64px ${heading}`;
  ctx.fillText("grove", 600, 100);
  ctx.fillStyle = ink;
  ctx.font = `700 32px ${body}`;
  ctx.fillText(input.demo ? "DEMO · Deal link QR" : "Deal link QR", 600, 155);
  const qr = document.createElement("canvas");
  const modules = QRCode.create(input.url, { errorCorrectionLevel: "M" }).modules.size + 8;
  const scale = Math.floor(850 / modules);
  if (scale < 3) throw new Error("This deal link is too long to make a readable QR. Copy the link instead.");
  await QRCode.toCanvas(qr, input.url, { margin: 4, scale, errorCorrectionLevel: "M", color: { dark: ink, light: white } });
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(qr, Math.floor((canvas.width - qr.width) / 2), 190);
  ctx.font = `700 40px ${body}`;
  ctx.fillText("Scan to view this deal", 600, 1100);
  ctx.font = `500 28px ${body}`;
  ctx.fillText("Redeem in store using Grove", 600, 1150);
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error("Could not create the PNG. Try again.")), "image/png"));
  return new Blob([withPrintResolution(new Uint8Array(await blob.arrayBuffer()))], { type: "image/png" });
}
