interface SparklineProps {
  data: number[];
  w?: number;
  h?: number;
  color?: string;
  style?: "line" | "area" | "bars";
}

export function Sparkline({
  data,
  w = 90,
  h = 28,
  color = "currentColor",
  style = "line",
}: SparklineProps) {
  if (!data || data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const rng = max - min || 1;
  const xs = data.map((_, i) => (i / (data.length - 1)) * w);
  const ys = data.map((v) => h - ((v - min) / rng) * (h - 4) - 2);

  if (style === "bars") {
    const bw = (w / data.length) * 0.7;
    return (
      <svg width={w} height={h}>
        {data.map((_, i) => {
          const y = ys[i];
          const x = xs[i] - bw / 2;
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={bw}
              height={h - y - 2}
              fill={color}
              opacity="0.7"
            />
          );
        })}
      </svg>
    );
  }

  const d = xs
    .map((x, i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${ys[i].toFixed(1)}`)
    .join(" ");

  if (style === "area") {
    const dArea = d + ` L${w},${h} L0,${h}Z`;
    return (
      <svg width={w} height={h}>
        <path d={dArea} fill={color} opacity="0.18" />
        <path d={d} stroke={color} strokeWidth="1.5" fill="none" />
      </svg>
    );
  }

  return (
    <svg width={w} height={h}>
      <path d={d} stroke={color} strokeWidth="1.5" fill="none" />
    </svg>
  );
}
