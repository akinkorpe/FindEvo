"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { IconCheck } from "@/components/ui/Icons";

interface SelectOption<T extends string> {
  value: T;
  label: string;
}

interface SelectProps<T extends string> {
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  className?: string;
  disabled?: boolean;
  ariaLabel?: string;
}

export function Select<T extends string>({
  value,
  options,
  onChange,
  className = "",
  disabled = false,
  ariaLabel,
}: SelectProps<T>) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const selected = useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value],
  );

  useEffect(() => {
    function onOutsideClick(ev: MouseEvent) {
      if (!rootRef.current) return;
      if (ev.target instanceof Node && !rootRef.current.contains(ev.target)) {
        setOpen(false);
      }
    }

    function onEsc(ev: KeyboardEvent) {
      if (ev.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onOutsideClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onOutsideClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-11 w-full items-center justify-between rounded-xl border border-ink-200 bg-white px-3 text-sm shadow-card outline-none transition focus:border-ink-300 focus:ring-2 focus:ring-ink-200/70 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="truncate text-ink-800">{selected?.label ?? value}</span>
        <svg
          viewBox="0 0 20 20"
          fill="none"
          className={`h-4 w-4 text-ink-400 transition ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          <path
            d="M5 7.5L10 12.5L15 7.5"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 rounded-xl border border-ink-200 bg-white p-1 shadow-card"
        >
          {options.map((opt) => {
            const isActive = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm transition ${
                  isActive
                    ? "bg-brand-50 text-brand-700"
                    : "text-ink-700 hover:bg-ink-50"
                }`}
              >
                <span>{opt.label}</span>
                {isActive && <IconCheck className="h-3.5 w-3.5" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
