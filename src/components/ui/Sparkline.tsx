interface Props {
  points: number[];
  width?: number;
  height?: number;
  stroke?: string;
}

export function Sparkline({
  points,
  width = 80,
  height = 20,
  stroke = "#10B981",
}: Props) {
  if (points.length === 0) {
    return <svg width={width} height={height} />;
  }
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const step = points.length > 1 ? width / (points.length - 1) : width;

  const path = points
    .map((p, i) => {
      const x = i * step;
      const y = height - ((p - min) / range) * height;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} className="block">
      <path d={path} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
