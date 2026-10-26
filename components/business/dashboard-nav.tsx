"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, LayoutDashboard, Plus, QrCode, Store, Tags } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/deals/new", label: "Post a deal", icon: Plus },
  { href: "/dashboard/deals", label: "My deals", icon: Tags },
  { href: "/dashboard/stats", label: "Stats", icon: BarChart3 },
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
            "flex min-h-11 items-center gap-2.5 rounded-pill px-3 py-3 text-sm font-bold text-ink-nav transition-colors hover:bg-green-tint/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green lg:px-4",
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
