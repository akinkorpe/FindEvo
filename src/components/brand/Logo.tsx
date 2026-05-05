import Link from "next/link";

export function LogoMark({ className = "" }: { className?: string }) {
  // Orbital node mark — center + 4 spokes
  return (
    <svg
      className={`text-brand-500 ${className}`}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle cx="16" cy="16" r="4" fill="currentColor" />
      <circle cx="4" cy="16" r="2.5" fill="currentColor" opacity="0.85" />
      <circle cx="28" cy="16" r="2.5" fill="currentColor" opacity="0.85" />
      <circle cx="16" cy="4" r="2.5" fill="currentColor" opacity="0.85" />
      <circle cx="16" cy="28" r="2.5" fill="currentColor" opacity="0.85" />
      <path
        d="M16 16 L4 16 M16 16 L28 16 M16 16 L16 4 M16 16 L16 28"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.45"
      />
    </svg>
  );
}

export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const text =
    size === "sm" ? "text-[15px]" : size === "lg" ? "text-[22px]" : "text-[18px]";
  return (
    <Link
      href="/onboarding"
      className={`font-[family-name:var(--font-brand)] tracking-tight text-[#12B886] ${text} transition hover:opacity-80`}
    >
      FindEvo
    </Link>
  );
}
