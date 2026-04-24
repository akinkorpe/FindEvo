"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { Avatar } from "@/components/ui/Avatar";
import {
  IconGrid,
  IconLayers,
  IconNetwork,
  IconChart,
  IconSparkles,
  IconSettings,
} from "@/components/ui/Icons";
import type { ReactNode } from "react";

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
}

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: <IconGrid className="h-4 w-4" /> },
  { href: "/feed", label: "Power Feed", icon: <IconLayers className="h-4 w-4" /> },
  { href: "/leads", label: "CRM Leads", icon: <IconNetwork className="h-4 w-4" /> },
  { href: "/monitor", label: "Reddit Monitor", icon: <IconChart className="h-4 w-4" /> },
  { href: "/automations", label: "Automations", icon: <IconSparkles className="h-4 w-4" /> },
  { href: "/settings", label: "Settings", icon: <IconSettings className="h-4 w-4" /> },
];

export function Sidebar() {
  const pathname = usePathname() ?? "";

  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col overflow-y-auto border-r border-ink-200/60 bg-white md:flex">
      <div className="px-5 pt-6">
        <Logo />
      </div>

      <nav className="mt-6 flex-1 px-3">
        {NAV.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                active
                  ? "bg-brand-50 font-semibold text-brand-700"
                  : "text-ink-600 hover:bg-ink-50 hover:text-ink-900"
              }`}
            >
              <span
                className={
                  active ? "text-brand-600" : "text-ink-400 group-hover:text-ink-600"
                }
              >
                {item.icon}
              </span>
              {item.label}
              {active && (
                <span className="ml-auto h-5 w-1 rounded-full bg-brand-500" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="m-4 rounded-xl border border-ink-200/60 bg-surface-muted p-3">
        <div className="flex items-center gap-3">
          <Avatar name="Alex Mercer" size="sm" />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-ink-900">
              Alex Mercer
            </div>
            <div className="truncate text-[11px] text-ink-500">
              alex@redditleads.io
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
