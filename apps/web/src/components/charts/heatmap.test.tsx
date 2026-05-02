import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Heatmap } from "./heatmap";

describe("Heatmap", () => {
  it("renders without throwing for empty data", () => {
    const { container } = render(<Heatmap data={[]} />);
    expect(container.querySelector("table")).toBeTruthy();
  });

  it("renders the expected number of data cells for a 3×4 grid", () => {
    const data = [
      [1, 2, 3, 4],
      [5, 6, 7, 8],
      [9, 10, 11, 12],
    ];
    const { container } = render(<Heatmap data={data} />);
    const cells = container.querySelectorAll("td[title]");
    expect(cells).toHaveLength(12);
  });

  it("renders a 7×24 grid (week × hour)", () => {
    const data = Array.from({ length: 7 }, (_, r) =>
      Array.from({ length: 24 }, (_, c) => r * 24 + c)
    );
    const { container } = render(<Heatmap data={data} />);
    const cells = container.querySelectorAll("td[title]");
    expect(cells).toHaveLength(168);
  });
});
