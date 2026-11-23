// Map pins from canvas screen 3: a round pin with a tail, a tag icon when the spot has a live
// deal, fork and knife otherwise. The SVGs are static markup; the name is set as text.
import type { MapBusiness } from "@/lib/geo/nearby";

const svg = (stroke: string, width: number, paths: string) =>
  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

export const DEAL_ICON = svg("currentColor", 2.4, '<path d="M3 12V4h8l10 10-8 8z"></path><circle cx="7.5" cy="7.5" r="1.5"></circle>');
export const NO_DEAL_ICON = svg(
  "currentColor",
  2.2,
  '<path d="M7 3v8"></path><path d="M4.5 3v4.5a2.5 2.5 0 0 0 5 0V3"></path><path d="M7 11v10"></path><path d="M18 21V3c-2.2 1-3.5 3.3-3.5 6.5V14H18"></path>',
);

export const pinClass = (business: MapBusiness) =>
  `grove-map-pin ${business.deals.length ? "grove-map-deal" : "grove-map-regular"}`;

export const pinLabel = (business: MapBusiness) =>
  `${business.name}, ${business.deals.length ? "live deal" : "no live deal"}`;

// The marker button Mapbox places; the name label shows only while aria-pressed is true.
export function pinElement(business: MapBusiness): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  // Mapbox otherwise assigns role="img" to its marker element.
  button.setAttribute("role", "button");
  button.className = pinClass(business);
  button.setAttribute("aria-label", pinLabel(business));
  const name = document.createElement("span");
  name.className = "grove-map-pinName";
  name.setAttribute("aria-hidden", "true");
  name.textContent = business.name;
  const circle = document.createElement("span");
  circle.className = "grove-map-pinCircle";
  circle.innerHTML = business.deals.length ? DEAL_ICON : NO_DEAL_ICON; // static SVG, no user data
  const tail = document.createElement("span");
  tail.className = "grove-map-pinTail";
  button.append(name, circle, tail);
  return button;
}
