import type { HTMLAttributes } from "react";

export function Card({
  className = "",
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl border border-ink-200/60 bg-white shadow-card ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
