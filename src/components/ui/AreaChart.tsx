interface Point {
  label: string;
  value: number;
}

interface Props {
  data: Point[];
  height?: number;
  showDots?: boolean;
  className?: string;
}

export function AreaChart({
  data,
  height = 260,
  showDots = true,
  className = "",
}: Props) {
  if (data.length === 0) {
    return (
      <div
        className={`flex items-center justify-center text-sm text-ink-400 ${className}`}
        style={{ height }}
      >
        No data yet
      </div>
    );
  }

  const width = 700;
  const padX = 32;
  const padTop = 20;
  const padBottom = 32;
  const innerW = width - padX * 2;
  const innerH = height - padTop - padBottom;

  const values = data.map((d) => d.value);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;

  const step = data.length > 1 ? innerW / (data.length - 1) : innerW;

  const pts = data.map((d, i) => {
    const x = padX + i * step;
    const y = padTop + (1 - (d.value - min) / range) * innerH;
    return { x, y, value: d.value, label: d.label };
  });

  const linePath = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");

  const areaPath =
    `${linePath} L${pts[pts.length - 1].x},${padTop + innerH} L${pts[0].x},${padTop + innerH} Z`;

  const gridLines = 4;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={`w-full ${className}`}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10B981" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
        </linearGradient>
      </defs>

      {Array.from({ length: gridLines + 1 }).map((_, i) => {
        const y = padTop + (i / gridLines) * innerH;
        const tickVal = Math.round(max - (i / gridLines) * range);
        return (
          <g key={i}>
            <line
              x1={padX}
              x2={width - padX}
              y1={y}
              y2={y}
              stroke="#E2E8F0"
              strokeDasharray="3 3"
            />
            <text
              x={padX - 6}
              y={y + 3}
              textAnchor="end"
              fontSize="10"
              fill="#94A3B8"
            >
              {tickVal}
            </text>
          </g>
        );
      })}

      <path d={areaPath} fill="url(#areaFill)" />
      <path
        d={linePath}
        fill="none"
        stroke="#10B981"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {showDots &&
        pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill="#fff" stroke="#10B981" strokeWidth="2" />
        ))}

      {pts.map((p, i) => (
        <text
          key={`lbl-${i}`}
          x={p.x}
          y={height - 8}
          textAnchor="middle"
          fontSize="10"
          fill="#94A3B8"
        >
          {p.label}
        </text>
      ))}
    </svg>
  );
}
