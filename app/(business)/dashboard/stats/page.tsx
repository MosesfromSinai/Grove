import type { Metadata } from "next";
import { BusinessStats } from "@/components/business/business-stats";

export const metadata: Metadata = { title: "Stats" };

export default function StatsPage() {
  return <BusinessStats />;
}
