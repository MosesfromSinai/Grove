import QRCode from "qrcode";
import { STICKER_DPI, withPrintResolution, type StickerSize } from "./sticker-format";

function token(styles: CSSStyleDeclaration, name: string): string {
  const value = styles.getPropertyValue(name).trim();
  if (!value) throw new Error("Grove's print styles are unavailable. Reload the page and try again.");
  return value;
}

function lines(ctx: CanvasRenderingContext2D, text: string, width: number, limit: number): string[] {
  const result: string[] = [];
  let line = "";
  for (const character of text) {
    if (ctx.measureText(line + character).width <= width) { line += character; continue; }
    result.push(line.trim());
    line = character;
    if (result.length === limit) break;
  }
  if (result.length < limit && line) result.push(line.trim());
  if (result.join("").replaceAll(" ", "").length < text.replaceAll(" ", "").length && result.length === limit) {
    let last = result[limit - 1];
    while (last && ctx.measureText(last + "…").width > width) last = last.slice(0, -1);
    result[limit - 1] = last + "…";
  }
  return result;
}

export async function renderStickerPng(input: { url: string; name: string; inches: StickerSize; demo: boolean }): Promise<Blob> {
  const styles = getComputedStyle(document.documentElement);
  const green = token(styles, "--color-green");
  const ink = token(styles, "--color-ink");
  const white = token(styles, "--color-surface");
  const accent = token(styles, "--color-orange-light");
  const heading = token(styles, "--font-bricolage");
  const body = token(styles, "--font-figtree");
  await document.fonts.ready;
  await Promise.all([document.fonts.load(`800 48px ${heading}`), document.fonts.load(`600 32px ${body}`)]);

  const width = input.inches * STICKER_DPI;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = width;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("This browser could not create the sticker image. Try another browser.");
  ctx.fillStyle = white;
  ctx.fillRect(0, 0, width, width);
  ctx.fillStyle = green;
  ctx.beginPath(); ctx.roundRect(width * 0.025, width * 0.025, width * 0.95, width * 0.95, width * 0.055); ctx.fill();
  ctx.fillStyle = white;
  ctx.textAlign = "center";
  ctx.font = `800 ${width * 0.075}px ${heading}`;
  ctx.fillText("grove", width * 0.53, width * 0.125);
  // Stroke leaf, matching the dashboard's simple leaf mark.
  ctx.beginPath(); ctx.arc(width * 0.349, width * 0.095, width * 0.036, 0, Math.PI * 2); ctx.fill();
  ctx.save();
  ctx.translate(width * 0.32, width * 0.066); ctx.scale(width * 0.0024, width * 0.0024);
  ctx.strokeStyle = green; ctx.lineWidth = 2; ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.beginPath(); ctx.moveTo(20, 3); ctx.bezierCurveTo(18, 10, 23, 19, 12, 21); ctx.bezierCurveTo(3, 22, 2, 12, 7, 9); ctx.bezierCurveTo(11, 6, 16, 8, 20, 3); ctx.moveTo(4, 23); ctx.quadraticCurveTo(9, 15, 16, 12); ctx.stroke(); ctx.restore();
  if (input.demo) { ctx.font = `800 ${width * 0.024}px ${body}`; ctx.fillStyle = accent; ctx.fillText("DEMO · local preview", width / 2, width * 0.167); }

  const modules = QRCode.create(input.url, { errorCorrectionLevel: "M" }).modules.size + 8;
  const scale = Math.floor(width * 0.55 / modules);
  if (scale < 3) throw new Error("This link is too long for the selected sticker size. Choose a larger sticker.");
  const qr = document.createElement("canvas");
  await QRCode.toCanvas(qr, input.url, { margin: 4, scale, errorCorrectionLevel: "M", color: { dark: ink, light: white } });
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(qr, Math.floor((width - qr.width) / 2), Math.floor(width * 0.2));
  ctx.fillStyle = white;
  ctx.font = `800 ${width * 0.037}px ${body}`;
  ctx.fillText("Scan in the Grove app", width / 2, width * 0.79);
  ctx.fillText("to redeem", width / 2, width * 0.835);
  ctx.fillStyle = accent;
  ctx.font = `700 ${width * 0.031}px ${body}`;
  lines(ctx, input.name, width * 0.8, 1).forEach(line => ctx.fillText(line, width / 2, width * 0.89));
  ctx.fillStyle = white;
  ctx.font = `500 ${width * 0.026}px ${body}`;
  const link = new URL(input.url);
  lines(ctx, link.host + link.pathname, width * 0.82, 2).forEach((line, index) => ctx.fillText(line, width / 2, width * (0.934 + index * 0.029)));
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error("Could not create the PNG. Try again.")), "image/png"));
  return new Blob([withPrintResolution(new Uint8Array(await blob.arrayBuffer()))], { type: "image/png" });
}
