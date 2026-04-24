import Link from "next/link";

export function LogoMark({ className = "" }: { className?: string }) {
  // Orbital node mark — center + 4 spokes
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle cx="16" cy="16" r="4" fill="#10B981" />
      <circle cx="4" cy="16" r="2.5" fill="#10B981" opacity="0.85" />
      <circle cx="28" cy="16" r="2.5" fill="#10B981" opacity="0.85" />
      <circle cx="16" cy="4" r="2.5" fill="#10B981" opacity="0.85" />
      <circle cx="16" cy="28" r="2.5" fill="#10B981" opacity="0.85" />
      <path
        d="M16 16 L4 16 M16 16 L28 16 M16 16 L16 4 M16 16 L16 28"
        stroke="#10B981"
        strokeWidth="1.5"
        opacity="0.45"
      />
    </svg>
  );
}

export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const dims =
    size === "sm" ? "h-5 w-5" : size === "lg" ? "h-8 w-8" : "h-6 w-6";
  const text =
    size === "sm" ? "text-sm" : size === "lg" ? "text-xl" : "text-base";
  return (
    <div className="flex items-center gap-2">
      <LogoMark className={dims} />
      <Link
        href="/onboarding"
        className={`font-semibold tracking-tight text-ink-900 ${text} hover:text-ink-700`}
      >
        RedditLeads
      </Link>
    </div>
  );
}
