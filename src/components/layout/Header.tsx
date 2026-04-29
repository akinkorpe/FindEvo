"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { IconBell, IconMenu, IconUser } from "@/components/ui/Icons";
import { useAuthUser } from "@/lib/useAuthUser";
import { useAppShell } from "@/components/layout/AppShell";

interface Props {
  title: string;
  searchPlaceholder?: string;
  onSearch?: (value: string) => void;
  right?: React.ReactNode;
}

export function Header({ title, right }: Props) {
  const { user } = useAuthUser();
  const { openNav } = useAppShell();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-ink-200/60 bg-white/90 px-4 backdrop-blur sm:h-16 sm:gap-4 sm:px-6">
      <button
        type="button"
        onClick={openNav}
        aria-label="Open menu"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ink-600 hover:bg-ink-100 md:hidden"
      >
        <IconMenu className="h-5 w-5" />
      </button>
      <h1 className="min-w-0 truncate text-base font-semibold text-ink-900 sm:text-lg">
        {title}
      </h1>
      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        {right && <div className="hidden sm:block">{right}</div>}
        <button
          className="relative hidden h-9 w-9 items-center justify-center rounded-lg text-ink-500 hover:bg-ink-100 sm:flex"
          aria-label="Notifications"
        >
          <IconBell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        </button>
        <Link
          href="/settings?tab=account"
          aria-label="Account"
          title={user?.email ?? "Account"}
          className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg border border-ink-200 bg-white text-ink-600 transition hover:bg-ink-50"
        >
          {user ? (
            <Avatar
              name={user.fullName ?? user.email ?? "Account"}
              src={user.avatarUrl}
              size="sm"
              className="!h-9 !w-9 !text-[11px]"
            />
          ) : (
            <IconUser className="h-4 w-4" />
          )}
        </Link>
      </div>
    </header>
  );
}

export default Header;
