"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { Avatar } from "@/components/ui/Avatar";
import { useAuthUser } from "@/lib/useAuthUser";
import { useAppShell } from "@/components/layout/AppShell";
import {
  IconGrid,
  IconLayers,
  IconNetwork,
  IconChart,
  IconSparkles,
  IconSettings,
  IconClose,
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

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname() ?? "";
  const { user } = useAuthUser();
  const displayName = user?.fullName ?? user?.email ?? "Account";
  const displayEmail = user?.email ?? "";

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 pt-6">
        <Logo />
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-500 hover:bg-ink-100 md:hidden"
          >
            <IconClose className="h-4 w-4" />
          </button>
        )}
      </div>

      <nav className="mt-6 flex-1 overflow-y-auto px-3">
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

      <Link
        href="/settings?tab=account"
        className="m-4 block rounded-xl border border-ink-200/60 bg-surface-muted p-3 transition hover:bg-ink-50"
      >
        <div className="flex items-center gap-3">
          <Avatar name={displayName} src={user?.avatarUrl} size="sm" />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-ink-900">
              {displayName}
            </div>
            {displayEmail && (
              <div className="truncate text-[11px] text-ink-500">
                {displayEmail}
              </div>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}

export function Sidebar() {
  const { navOpen, closeNav } = useAppShell();

  return (
    <>
      {/* Desktop: sticky aside */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 overflow-y-auto border-r border-ink-200/60 bg-white md:block">
        <SidebarContent />
      </aside>

      {/* Mobile: overlay drawer */}
      <div
        className={`fixed inset-0 z-50 md:hidden ${navOpen ? "" : "pointer-events-none"}`}
        aria-hidden={!navOpen}
      >
        {/* Scrim */}
        <div
          onClick={closeNav}
          className={`absolute inset-0 bg-ink-900/40 transition-opacity duration-200 ${
            navOpen ? "opacity-100" : "opacity-0"
          }`}
        />
        {/* Panel */}
        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
          className={`absolute left-0 top-0 h-full w-72 max-w-[85vw] border-r border-ink-200/60 bg-white shadow-pop transition-transform duration-200 ${
            navOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <SidebarContent onClose={closeNav} />
        </aside>
      </div>
    </>
  );
}

export default Sidebar;
