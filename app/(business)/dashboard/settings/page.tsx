import type { Metadata } from "next";
import { DashboardPlaceholder } from "@/components/business/dashboard-placeholder";

export const metadata: Metadata = { title: "QR sticker & PIN" };

export default function SettingsPage() {
  return <DashboardPlaceholder title="QR sticker & PIN" description="Your counter sticker and redemption settings." />;
}
