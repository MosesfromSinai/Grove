import type { Metadata } from "next";
import { DashboardPlaceholder } from "@/components/business/dashboard-placeholder";

export const metadata: Metadata = { title: "Stats" };

export default function StatsPage() {
  return <DashboardPlaceholder title="Stats" description="See how your deals bring students through the door." />;
}
