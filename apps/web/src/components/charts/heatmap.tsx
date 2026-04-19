interface HeatmapProps {
  data: number[][];
  labelY?: string[];
  labelX?: string[];
  max?: number;
  cell?: number;
}

export function Heatmap({
  data,
  labelY = [],
  labelX = [],
  max: maxProp,
  cell = 18,
}: HeatmapProps) {
  const m = maxProp || Math.max(...data.flat());

  return (
    <div style={{ display: "inline-block" }}>
      <table style={{ borderCollapse: "separate", borderSpacing: 2 }}>
        <thead>
          <tr>
            <th />
            {labelX.map((l, i) => (
              <th
                key={i}
                style={{
                  fontSize: 10,
                  color: "var(--muted)",
                  fontWeight: 500,
                  padding: "2px 4px",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {l}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, ri) => (
            <tr key={ri}>
              <td
                style={{
                  fontSize: 11,
                  color: "var(--muted)",
                  paddingRight: 8,
                  whiteSpace: "nowrap",
                }}
              >
                {labelY[ri]}
              </td>
              {row.map((v, ci) => {
                const intensity = v / m;
                const bg = `color-mix(in oklab, var(--accent) ${Math.round(intensity * 100)}%, var(--surface-2))`;
                return (
                  <td
                    key={ci}
                    title={String(v)}
                    style={{
                      width: cell,
                      height: cell,
                      background: bg,
                      borderRadius: 2,
                    }}
                  />
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
