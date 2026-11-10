import type { Metadata } from "next";
import { ClubNightPosting } from "@/components/business/club-night-posting";

export const metadata: Metadata = { title: "Club nights" };

export default function ClubNightsPage() {
  return <>
    <header className="mb-7"><h1 className="text-3xl sm:text-4xl">Club nights</h1><p className="mt-2 text-ink-muted">Offer a night for a student club to claim. Give back a little local love.</p></header>
    <ClubNightPosting />
  </>;
}
