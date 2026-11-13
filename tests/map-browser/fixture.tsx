import { useState } from "react";
import { createRoot } from "react-dom/client";
import { NearbyMap } from "@/components/map/nearby-map";
import { InstallGuide } from "@/components/pwa/install-guide";
import type { MapBusiness } from "@/lib/geo/nearby";
import "./fixture.css";

const center = { lat: 33.9737, lng: -117.3281 };
const pins: MapBusiness[] = Array.from({ length: 100 }, (_, i) => ({
  id: `spot-${i}`, name: `Test spot ${i}`, lat: center.lat + ((i % 10) - 5) * 0.0008,
  lng: center.lng + (Math.floor(i / 10) - 5) * 0.0008,
  distanceM: i * 10, openNow: true, isTruck: false, deals: [],
}));
function Fixture() {
  const [selected, select] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);
  return <main>
    <h1>100 test pins</h1>
    <button onClick={() => setRefresh(value => value + 1)}>Refresh positions</button>
    <output aria-label="Refresh count">{refresh}</output>
    <output aria-label="Selected spot">{selected}</output>
    <NearbyMap center={{ ...center, lat: center.lat + refresh * 0.00001 }}
      businesses={pins.map(pin => ({ ...pin, name: pin.id === "spot-0" ? `Refreshed spot ${refresh}` : pin.name, lng: pin.lng + refresh * 0.00001 }))}
      selectedId={selected} onSelect={id => select(id)} />
    <InstallGuide />
  </main>;
}
createRoot(document.getElementById("root")!).render(<Fixture />);
