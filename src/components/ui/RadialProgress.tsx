interface Props {
  value: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  tone?: "brand" | "neutral";
}

export function RadialProgress({
  value,
  size = 56,
  strokeWidth = 6,
  label,
  tone = "brand",
}: Props) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;
  const stroke = tone === "brand" ? "#10B981" : "#64748B";

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E2E8F0"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all"
        />
      </svg>
      <span className="absolute text-xs font-semibold text-ink-800">
        {label ?? `${Math.round(clamped)}%`}
      </span>
    </div>
  );
}
