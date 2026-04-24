"use client";

import {
  IconBell,
  IconUser,
} from "@/components/ui/Icons";

interface Props {
  title: string;
  searchPlaceholder?: string;
  onSearch?: (value: string) => void;
  right?: React.ReactNode;
}

export function Header({ title, right }: Props) {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-ink-200/60 bg-white/90 px-6 backdrop-blur">
      <h1 className="text-lg font-semibold text-ink-900">{title}</h1>
      <div className="ml-auto flex items-center gap-3">
        {right}
        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-ink-500 hover:bg-ink-100"
          aria-label="Notifications"
        >
          <IconBell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        </button>
        <button
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-ink-200 bg-white text-ink-600 hover:bg-ink-50"
          aria-label="Account"
        >
          <IconUser className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}

export default Header;
