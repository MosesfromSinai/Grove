import type { Metadata } from "next";
import { StaffScannerPage } from "@/components/business/staff-scanner";

export const metadata: Metadata = { title: "Staff scanner" };

export default function StaffScanPage() {
  return <><header className="mb-7"><h1 className="text-3xl sm:text-4xl">Staff scanner</h1><p className="mt-2 text-ink-muted">Check a student’s in-store code and verify their visit.</p></header><StaffScannerPage /></>;
}
