import type { Metadata } from "next";
import { DashboardPlaceholder } from "@/components/business/dashboard-placeholder";

export const metadata: Metadata = { title: "Post a deal" };

export default function PostDealPage() {
  return <DashboardPlaceholder title="Post a deal" description="Give students a reason to stop by." />;
}
