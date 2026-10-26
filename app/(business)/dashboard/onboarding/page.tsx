import type { Metadata } from "next";
import { BusinessOnboarding } from "@/components/business/business-onboarding";

export const metadata: Metadata = { title: "Business setup" };

export default function BusinessOnboardingPage() {
  return <>
    <header className="mb-7"><h1 className="text-3xl sm:text-4xl">Set up your business</h1><p className="mt-2 text-ink-muted">Help students find you, then get your first staff PIN.</p></header>
    <BusinessOnboarding />
  </>;
}
