// @vitest-environment jsdom
import { expect, test } from "vitest";
import type { MapBusiness } from "@/lib/geo/nearby";
import { pinElement } from "./pin-icons";

const place = (deals: number): MapBusiness => ({
  id: "b", name: "Orange Peel <Tacos>", lat: 0, lng: 0, distanceM: 0, openNow: true, isTruck: false,
  deals: Array.from({ length: deals }, () => ({}) as MapBusiness["deals"][number]),
});

test("a spot with a live deal gets an orange tag pin", () => {
  const pin = pinElement(place(1));
  expect(pin.className).toContain("grove-map-deal");
  expect(pin.querySelector(".grove-map-pinCircle path")!.getAttribute("d")).toBe("M3 12V4h8l10 10-8 8z");
  expect(pin.getAttribute("aria-label")).toBe("Orange Peel <Tacos>, live deal");
  expect(pin.querySelector(".grove-map-pinTail")).not.toBeNull();
});

test("a spot without a deal gets a green fork-and-knife pin", () => {
  const pin = pinElement(place(0));
  expect(pin.className).toContain("grove-map-regular");
  expect(pin.querySelectorAll(".grove-map-pinCircle path")).toHaveLength(4);
  expect(pin.getAttribute("aria-label")).toBe("Orange Peel <Tacos>, no live deal");
});

test("the name label is plain text, never markup", () => {
  const name = pinElement(place(0)).querySelector(".grove-map-pinName")!;
  expect(name.textContent).toBe("Orange Peel <Tacos>");
  expect(name.children).toHaveLength(0);
});
