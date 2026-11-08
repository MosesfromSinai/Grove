"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CalendarDays, LayoutDashboard, Plus, QrCode, ScanLine, Store, Tags } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/deals/new", label: "Post a deal", icon: Plus },
  { href: "/dashboard/deals", label: "My deals", icon: Tags },
  { href: "/dashboard/club-nights", label: "Club nights", icon: CalendarDays },
  { href: "/dashboard/stats", label: "Stats", icon: BarChart3 },
  { href: "/dashboard/scan", label: "Staff scanner", icon: ScanLine },
  { href: "/dashboard/settings", label: "QR sticker & PIN", icon: QrCode },
  { href: "/dashboard/onboarding", label: "Business setup", icon: Store },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Business dashboard" className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:flex lg:flex-col">
      {items.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          aria-current={pathname === href ? "page" : undefined}
          className={cn(
            "flex min-h-11 items-center gap-2.5 rounded-button px-3 py-3 text-sm font-bold text-ink-nav transition-colors hover:bg-green-tint/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green lg:px-4",
            pathname === href && "bg-green-tint text-green-dark",
          )}
        >
          <Icon aria-hidden="true" className="size-5 shrink-0" strokeWidth={2} />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}

export function DashboardTip() {
  const posting = usePathname() === "/dashboard/deals/new";
  return <div className="mt-5 rounded-button bg-green-dark p-4 text-surface lg:mt-auto">
    <p className="text-sm font-extrabold">{posting ? "Tip" : "Your sticker never changes"}</p>
    <p className="mt-2 text-sm leading-relaxed">{posting
      ? "Keep titles short and specific: “$2 off any burrito” tells students what to expect."
      : "Print it once. Whatever deal is live is what students can redeem."}</p>
  </div>;
}
