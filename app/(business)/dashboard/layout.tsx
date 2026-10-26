import type { Metadata } from "next";
import { DashboardShell } from "@/components/business/dashboard-shell";
import { BusinessProvider } from "@/components/business/business-context";

export const metadata: Metadata = {
  title: { default: "Dashboard · Grove", template: "%s · Grove Business" },
  robots: { index: false, follow: false },
};

// Preview only. Celso's business membership checks will guard real business data.
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <BusinessProvider><DashboardShell>{children}</DashboardShell></BusinessProvider>;
}
