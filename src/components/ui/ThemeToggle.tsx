"use client";

import { useTheme, type ThemePreference } from "@/lib/theme";
import { IconMonitor, IconMoon, IconSun } from "@/components/ui/Icons";
import type { ReactNode } from "react";

interface Option {
  value: ThemePreference;
  label: string;
  icon: ReactNode;
}

const OPTIONS: Option[] = [
  { value: "light", label: "Light", icon: <IconSun className="h-4 w-4" /> },
  { value: "dark", label: "Dark", icon: <IconMoon className="h-4 w-4" /> },
  {
    value: "system",
    label: "System",
    icon: <IconMonitor className="h-4 w-4" />,
  },
];

export function ThemeToggle() {
  const { preference, setPreference } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className="inline-flex rounded-xl border border-ink-200 bg-ink-50 p-1"
    >
      {OPTIONS.map((opt) => {
        const active = preference === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setPreference(opt.value)}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              active
                ? "bg-white text-ink-900 shadow-card"
                : "text-ink-500 hover:text-ink-800"
            }`}
          >
            <span className={active ? "text-brand-600" : "text-ink-400"}>
              {opt.icon}
            </span>
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
