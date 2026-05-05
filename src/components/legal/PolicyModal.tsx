"use client";

import { useEffect, useRef, type ReactNode } from "react";

interface PolicyModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  ariaLabel?: string;
}

export function PolicyModal({ open, onClose, children, ariaLabel = "Policy" }: PolicyModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 sm:py-10"
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden />
      <div
        ref={dialogRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-surface shadow-pop"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-500 transition hover:bg-ink-100 hover:text-ink-900"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
            aria-hidden
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
        <div className="overflow-y-auto px-6 py-8 pr-14 sm:px-10 sm:py-10 sm:pr-14">{children}</div>
      </div>
    </div>
  );
}
