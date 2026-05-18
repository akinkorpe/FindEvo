interface Point {
  label: string;
  value: number;
}

interface Props {
  data: Point[];
  height?: number;
  showDots?: boolean;
  className?: string;
  /**
   * Render an x-axis label every Nth point. Default 1 (every point).
   * Use to keep 30-day / yearly charts readable — the path still draws
   * through every sample, only the text annotations are thinned out.
   */
  labelEvery?: number;
  /**
   * Render a dot every Nth point. Default 1. Same rationale as labelEvery
   * — at 365 samples a dot per day turns the line into a solid bar.
   */
  dotEvery?: number;
}

/**
 * Pick a y-axis tick step that gives ~4 grid lines while keeping the
 * numbers human (1, 2, 5, 10, 20, 50, ...). Avoids the "round to the same
 * value twice" problem that shows up when the data only spans 0-3 leads.
 */
function niceStep(range: number, targetTicks: number): number {
  if (range <= 0) return 1;
  const rough = range / targetTicks;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rough)));
  const normalized = rough / magnitude;
  // Snap to 1 / 2 / 5 × 10^k — the standard "nice numbers" rule.
  const snapped = normalized < 1.5 ? 1 : normalized < 3 ? 2 : normalized < 7 ? 5 : 10;
  return snapped * magnitude;
}

export function AreaChart({
  data,
  height = 260,
  showDots = true,
  labelEvery = 1,
  dotEvery = 1,
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
  const rawMax = Math.max(...values, 1);
  const min = Math.min(...values, 0);

  // Use a nice round step so the y-axis labels read 0/1/2/3 instead of
  // 0/1/1/2/2. The chart's actual max is then snapped up to the next tick
  // so the top gridline matches a real number.
  const step = niceStep(rawMax - min, 4);
  const max = Math.ceil(rawMax / step) * step;
  const range = max - min || 1;

  const xStep = data.length > 1 ? innerW / (data.length - 1) : innerW;

  const pts = data.map((d, i) => {
    const x = padX + i * xStep;
    const y = padTop + (1 - (d.value - min) / range) * innerH;
    return { x, y, value: d.value, label: d.label };
  });

  const linePath = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");

  const areaPath =
    `${linePath} L${pts[pts.length - 1].x},${padTop + innerH} L${pts[0].x},${padTop + innerH} Z`;

  // Always include first and last sample in the labels — readers expect
  // the endpoints, especially for "this week" / "last 30 days" framings.
  function shouldLabel(i: number): boolean {
    if (i === 0 || i === pts.length - 1) return true;
    return i % labelEvery === 0;
  }
  function shouldDot(i: number): boolean {
    if (i === 0 || i === pts.length - 1) return true;
    return i % dotEvery === 0;
  }

  const gridLines = Math.max(1, Math.round(range / step));

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={`w-full ${className}`}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
          <stop
            offset="0%"
            stopColor="var(--chart-area-stop)"
            stopOpacity="0.35"
          />
          <stop
            offset="100%"
            stopColor="var(--chart-area-stop)"
            stopOpacity="0"
          />
        </linearGradient>
      </defs>

      {Array.from({ length: gridLines + 1 }).map((_, i) => {
        const y = padTop + (i / gridLines) * innerH;
        const tickVal = max - i * step;
        return (
          <g key={i}>
            <line
              x1={padX}
              x2={width - padX}
              y1={y}
              y2={y}
              stroke="var(--chart-grid)"
              strokeDasharray="3 3"
            />
            <text
              x={padX - 6}
              y={y + 3}
              textAnchor="end"
              fontSize="10"
              fill="var(--chart-axis)"
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
        stroke="var(--chart-line)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {showDots &&
        pts.map((p, i) =>
          shouldDot(i) ? (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r="3"
              fill="var(--chart-dot-fill)"
              stroke="var(--chart-line)"
              strokeWidth="2"
            />
          ) : null,
        )}

      {pts.map((p, i) =>
        shouldLabel(i) ? (
          <text
            key={`lbl-${i}`}
            x={p.x}
            y={height - 8}
            textAnchor="middle"
            fontSize="10"
            fill="var(--chart-axis)"
          >
            {p.label}
          </text>
        ) : null,
      )}
    </svg>
  );
}
