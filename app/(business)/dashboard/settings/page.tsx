import type { Metadata } from "next";
import { CounterSticker } from "@/components/business/counter-sticker";
import { RedemptionSettings } from "@/components/business/redemption-settings";
import { StaffManagement } from "@/components/business/staff-management";

export const metadata: Metadata = { title: "QR sticker & PIN" };

export default function SettingsPage() {
  return <>
    <header className="mb-7"><h1 className="text-3xl sm:text-4xl">Your Grove QR sticker</h1><p className="mt-2 text-ink-muted">Print it once and put it by the register. Its permanent link works for every deal you post.</p></header>
    <CounterSticker />
    <RedemptionSettings />
    <StaffManagement />
  </>;
}
