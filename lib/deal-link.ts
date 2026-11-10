// Deal links (#115): the shareable /deals/<id> link and its QR, for flyers and group chats.
// Advertising only: it opens the deal and never redeems (see CLAUDE.md, two QR codes).

export function dealUrl(origin: string, dealId: string): string {
  return new URL(`/deals/${encodeURIComponent(dealId)}`, origin).href;
}

export async function dealQrPng(url: string): Promise<string> {
  const QRCode = await import("qrcode");
  return QRCode.toDataURL(url, { margin: 2, width: 480, errorCorrectionLevel: "M" });
}

// A safe download name from the deal title: "2-off-any-burrito-qr.png".
export function qrFileName(title: string): string {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
  return `${slug || "deal"}-qr.png`;
}
