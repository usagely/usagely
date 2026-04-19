"use client";

import {
  ResponsiveContainer,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Area,
  Line,
  Bar,
  ReferenceLine,
} from "recharts";
import { fmtMoney } from "@/src/lib/formatters";

interface Annotation {
  index: number;
  label: string;
}

interface MainChartProps {
  data: { date: string; value: number }[];
  style?: "line" | "area" | "bars";
  color?: string;
  h?: number;
  annotate?: Annotation[];
}

function AnnotationLabel({
  viewBox,
  label,
}: {
  viewBox?: { x?: number; y?: number };
  label: string;
}) {
  const x = viewBox?.x ?? 0;
  return (
    <g>
      <rect
        x={x - 55}
        y={4}
        width={110}
        height={22}
        rx={4}
        fill="var(--surface)"
        stroke="var(--hairline)"
      />
      <text
        x={x}
        y={19}
        fontSize={10.5}
        textAnchor="middle"
        fill="var(--ink)"
      >
        {label}
      </text>
    </g>
  );
}

export function MainChart({
  data,
  style = "area",
  color = "var(--chart-1)",
  h = 240,
  annotate,
}: MainChartProps) {
  if (!data || data.length < 2) return null;

  const labelIdxs = [
    0,
    Math.floor(data.length / 3),
    Math.floor((2 * data.length) / 3),
    data.length - 1,
  ];
  const labelSet = new Set(labelIdxs);

  const tickFormatter = (_: string, index: number) => {
    if (!labelSet.has(index)) return "";
    const d = data[index];
    return d?.date ? d.date.slice(5) : "";
  };

  return (
    <ResponsiveContainer width="100%" height={h}>
      <ComposedChart data={data}>
        <CartesianGrid
          strokeDasharray="2 4"
          stroke="var(--hairline)"
          vertical={false}
        />
        <XAxis
          dataKey="date"
          tickFormatter={tickFormatter}
          tick={{
            fontSize: 10,
            fill: "var(--muted)",
            fontFamily: "var(--font-mono)",
          }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v: number) => fmtMoney(v)}
          tick={{
            fontSize: 10,
            fill: "var(--muted)",
            fontFamily: "var(--font-mono)",
          }}
          axisLine={false}
          tickLine={false}
          width={44}
        />

        {style === "area" && (
          <Area
            type="linear"
            dataKey="value"
            stroke={color}
            strokeWidth={1.8}
            fill={color}
            fillOpacity={0.14}
            dot={false}
          />
        )}

        {style === "line" && (
          <Line
            type="linear"
            dataKey="value"
            stroke={color}
            strokeWidth={1.8}
            dot={false}
          />
        )}

        {style === "bars" && (
          <Bar dataKey="value" fill={color} opacity={0.85} radius={[1, 1, 0, 0]} />
        )}

        {annotate?.map((a) => (
          <ReferenceLine
            key={a.index}
            x={data[a.index]?.date}
            stroke="var(--danger)"
            strokeDasharray="2 3"
            strokeOpacity={0.6}
            label={<AnnotationLabel label={a.label} />}
          />
        ))}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
