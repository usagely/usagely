import { describe, it, expect, vi, beforeAll } from "vitest";
import { render } from "@testing-library/react";
import React from "react";
import { MainChart } from "./main-chart";

vi.mock("recharts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("recharts")>();
  return {
    ...actual,
    ResponsiveContainer: ({
      children,
    }: {
      children: React.ReactElement<{ width: number; height: number }>;
    }) => React.cloneElement(children, { width: 800, height: 240 }),
  };
});

beforeAll(() => {
  if (!SVGElement.prototype.getBBox) {
    SVGElement.prototype.getBBox = function () {
      return { x: 0, y: 0, width: 0, height: 0 } as SVGRect;
    };
  }
});

const sampleData = [
  { date: "2024-01-01", value: 100 },
  { date: "2024-01-02", value: 150 },
  { date: "2024-01-03", value: 120 },
  { date: "2024-01-04", value: 200 },
  { date: "2024-01-05", value: 180 },
];

describe("MainChart", () => {
  it("returns null when data is empty", () => {
    const { container } = render(<MainChart data={[]} />);
    expect(container.innerHTML).toBe("");
  });

  it("returns null when data has only one point", () => {
    const { container } = render(
      <MainChart data={[{ date: "2024-01-01", value: 100 }]} />
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders an SVG chart for valid data", () => {
    const { container } = render(<MainChart data={sampleData} />);
    expect(container.querySelector("svg")).toBeTruthy();
  });
});
