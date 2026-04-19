interface DonutSegment {
  name: string;
  value: number;
  color: string;
}

interface DonutProps {
  segments: DonutSegment[];
  size?: number;
  thickness?: number;
  center?: { label: string; value: string };
}

export function Donut({
  segments,
  size = 160,
  thickness = 18,
  center,
}: DonutProps) {
  const r = size / 2 - thickness / 2;
  const c = size / 2;
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  const circ = 2 * Math.PI * r;
  let acc = 0;

  return (
    <svg width={size} height={size}>
      <circle
        cx={c}
        cy={c}
        r={r}
        fill="none"
        stroke="var(--hairline)"
        strokeWidth={thickness}
      />
      {segments.map((s, i) => {
        const frac = s.value / total;
        const dash = frac * circ;
        const gap = circ - dash;
        const off = -acc * circ;
        acc += frac;
        return (
          <circle
            key={i}
            cx={c}
            cy={c}
            r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={thickness}
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={off}
            transform={`rotate(-90 ${c} ${c})`}
          />
        );
      })}
      {center && (
        <>
          <text
            x={c}
            y={c - 4}
            fontSize="11"
            textAnchor="middle"
            fill="var(--muted)"
          >
            {center.label}
          </text>
          <text
            x={c}
            y={c + 14}
            fontSize="17"
            textAnchor="middle"
            fill="var(--ink)"
            fontFamily="var(--font-mono)"
            fontWeight="500"
          >
            {center.value}
          </text>
        </>
      )}
    </svg>
  );
}
