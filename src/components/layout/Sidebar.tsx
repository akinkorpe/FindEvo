"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { Avatar } from "@/components/ui/Avatar";
import { useAuthUser } from "@/lib/useAuthUser";
import { signOut } from "@/lib/auth";
import { useAppShell } from "@/components/layout/AppShell";
import {
  IconGrid,
  IconLayers,
  IconNetwork,
  IconChart,
  IconSparkles,
  IconSettings,
  IconClose,
  IconArrowRight,
} from "@/components/ui/Icons";
import type { ReactNode } from "react";

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
  comingSoon?: boolean;
}

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: <IconGrid className="h-4 w-4" /> },
  { href: "/feed", label: "Power Feed", icon: <IconLayers className="h-4 w-4" /> },
  { href: "/leads", label: "CRM Leads", icon: <IconNetwork className="h-4 w-4" /> },
  { href: "/monitor", label: "Reddit Monitor", icon: <IconChart className="h-4 w-4" />, comingSoon: true },
  { href: "/automations", label: "Automations", icon: <IconSparkles className="h-4 w-4" />, comingSoon: true },
  { href: "/settings", label: "Settings", icon: <IconSettings className="h-4 w-4" /> },
];

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname() ?? "";
  const { user } = useAuthUser();
  const [signingOut, setSigningOut] = useState(false);
  const displayName = user?.fullName ?? user?.email ?? "Account";
  const displayEmail = user?.email ?? "";

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    await signOut();
    window.location.assign("/landing");
  }

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
            !item.comingSoon &&
            (pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href)));

          if (item.comingSoon) {
            return (
              <div
                key={item.href}
                aria-disabled="true"
                className="group mb-0.5 flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2 text-sm text-ink-400"
              >
                <span className="text-ink-300">{item.icon}</span>
                {item.label}
                <span className="ml-auto rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-500">
                  Soon
                </span>
              </div>
            );
          }

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
        <Link
          href="/settings?tab=account"
          className="-m-1 flex items-center gap-3 rounded-lg p-1 transition hover:bg-ink-50"
        >
          <Avatar name={displayName} src={user?.avatarUrl} size="sm" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-ink-900">
              {displayName}
            </div>
            {displayEmail && (
              <div className="truncate text-[11px] text-ink-500">
                {displayEmail}
              </div>
            )}
          </div>
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-ink-200 bg-white px-2.5 py-1.5 text-xs font-medium text-ink-700 transition hover:bg-ink-50 disabled:opacity-60"
        >
          <IconArrowRight className="h-3 w-3" />
          {signingOut ? "Signing out…" : "Sign out"}
        </button>
      </div>
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
