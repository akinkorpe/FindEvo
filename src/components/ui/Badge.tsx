import type { ReactNode } from "react";

type Tone = "success" | "warning" | "danger" | "neutral" | "brand" | "info";

const tones: Record<Tone, string> = {
  success: "bg-success-50 text-brand-700 ring-brand-200",
  warning: "bg-warning-50 text-amber-700 ring-amber-200",
  danger: "bg-danger-50 text-red-700 ring-red-200",
  neutral: "bg-ink-100 text-ink-700 ring-ink-200",
  brand: "bg-brand-50 text-brand-700 ring-brand-200",
  info: "bg-blue-50 text-blue-700 ring-blue-200",
};

export function Badge({
  tone = "neutral",
  children,
  icon,
  className = "",
  title,
}: {
  tone?: Tone;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${tones[tone]} ${className}`}
    >
      {icon}
      {children}
    </span>
  );
}
