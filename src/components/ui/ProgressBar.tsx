interface Props {
  value: number; // 0-100
  tone?: "brand" | "warning" | "danger" | "neutral";
  size?: "sm" | "md";
  className?: string;
}

const tones = {
  brand: "bg-brand-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
  neutral: "bg-ink-400",
};

export function ProgressBar({
  value,
  tone = "brand",
  size = "sm",
  className = "",
}: Props) {
  const pct = Math.max(0, Math.min(100, value));
  const height = size === "md" ? "h-2" : "h-1.5";
  return (
    <div
      className={`w-full overflow-hidden rounded-full bg-ink-100 ${height} ${className}`}
    >
      <div
        className={`h-full rounded-full ${tones[tone]} transition-all`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
