import type { Metadata } from "next";
import { DashboardPlaceholder } from "@/components/business/dashboard-placeholder";

export const metadata: Metadata = { title: "My deals" };

export default function MyDealsPage() {
  return <DashboardPlaceholder title="My deals" description="A home for your active, scheduled, and expired deals." />;
}
