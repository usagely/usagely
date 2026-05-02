import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Donut } from "./donut";

describe("Donut", () => {
  it("renders without throwing for empty segments", () => {
    const { container } = render(<Donut segments={[]} />);
    expect(container.querySelector("svg")).toBeTruthy();
  });

  it("renders one circle per segment plus the background", () => {
    const segments = [
      { name: "A", value: 50, color: "red" },
      { name: "B", value: 30, color: "green" },
      { name: "C", value: 20, color: "blue" },
    ];
    const { container } = render(<Donut segments={segments} />);
    const circles = container.querySelectorAll("circle");
    expect(circles).toHaveLength(4);
  });

  it("pins cumulative-angle math: segments of 50/30/20 cover 360°", () => {
    const segments = [
      { name: "A", value: 50, color: "red" },
      { name: "B", value: 30, color: "green" },
      { name: "C", value: 20, color: "blue" },
    ];
    const size = 160;
    const thickness = 18;
    const r = size / 2 - thickness / 2;
    const circ = 2 * Math.PI * r;
    const total = 100;

    const { container } = render(<Donut segments={segments} />);
    const circles = Array.from(container.querySelectorAll("circle"));
    const segmentCircles = circles.slice(1);

    let expectedAcc = 0;
    let dashSum = 0;

    segmentCircles.forEach((circle, i) => {
      const frac = segments[i].value / total;
      const expectedDash = frac * circ;
      const expectedGap = circ - expectedDash;
      const expectedOff = -expectedAcc * circ;

      const [dash, gap] = circle
        .getAttribute("stroke-dasharray")!
        .split(" ")
        .map(Number);
      const off = Number(circle.getAttribute("stroke-dashoffset"));

      expect(dash).toBeCloseTo(expectedDash, 5);
      expect(gap).toBeCloseTo(expectedGap, 5);
      expect(off).toBeCloseTo(expectedOff, 5);

      dashSum += dash;
      expectedAcc += frac;
    });

    expect(dashSum).toBeCloseTo(circ, 5);
    expect(expectedAcc).toBeCloseTo(1.0, 10);
  });
});
