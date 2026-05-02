import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Sparkline } from "./sparkline";

describe("Sparkline", () => {
  it("returns null for empty data", () => {
    const { container } = render(<Sparkline data={[]} />);
    expect(container.innerHTML).toBe("");
  });

  it("returns null for a single data point", () => {
    const { container } = render(<Sparkline data={[42]} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders a path in line mode", () => {
    const { container } = render(<Sparkline data={[10, 20, 30, 40, 50]} />);
    const paths = container.querySelectorAll("path");
    expect(paths).toHaveLength(1);
  });

  it("renders two paths in area mode (fill + stroke)", () => {
    const { container } = render(
      <Sparkline data={[10, 20, 30, 40, 50]} style="area" />
    );
    const paths = container.querySelectorAll("path");
    expect(paths).toHaveLength(2);
  });

  it("renders one rect per data point in bars mode", () => {
    const data = [10, 20, 30, 40, 50];
    const { container } = render(<Sparkline data={data} style="bars" />);
    const rects = container.querySelectorAll("rect");
    expect(rects).toHaveLength(data.length);
  });
});
