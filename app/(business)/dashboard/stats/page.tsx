import type { Metadata } from "next";
import { BusinessStatsPage } from "@/components/business/business-stats";

export const metadata: Metadata = { title: "Stats" };

export default function StatsPage() {
  return <><header className="mb-7"><h1 className="text-3xl sm:text-4xl">Stats</h1><p className="mt-2 text-ink-muted">See how your deals bring students through the door.</p></header><BusinessStatsPage /></>;
}
