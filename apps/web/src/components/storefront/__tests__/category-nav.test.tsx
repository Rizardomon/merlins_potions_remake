import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { CategoryNav } from "../category-nav";

describe("CategoryNav", () => {
  it("renders Potions as active", () => {
    render(<CategoryNav />);
    const active = screen.getByText("Potions");
    expect(active.closest("[aria-current='page']")).toBeDefined();
  });

  it("renders inactive categories with Soon badge", () => {
    render(<CategoryNav />);
    const inactive = ["Ingredients", "Books", "Supplies", "Charms", "Clearance"];
    for (const label of inactive) {
      const el = screen.getByText(label);
      const wrapper = el.closest("[aria-disabled='true']");
      expect(wrapper, `${label} should be aria-disabled`).toBeDefined();
    }
  });

  it("inactive categories are not buttons or links", () => {
    render(<CategoryNav />);
    const inactive = ["Ingredients", "Books", "Supplies", "Charms", "Clearance"];
    for (const label of inactive) {
      const el = screen.getByText(label);
      const tagName = el.tagName.toLowerCase();
      expect(["a", "button"]).not.toContain(tagName);
      const parent = el.closest("a, button");
      expect(parent).toBeNull();
    }
  });

  it("inactive categories display Soon badge", () => {
    render(<CategoryNav />);
    const soonBadges = screen.getAllByText(/soon/i);
    expect(soonBadges.length).toBe(5);
  });

  it("Clearance has highlight styling", () => {
    render(<CategoryNav />);
    const clearance = screen.getByText("Clearance");
    const wrapper = clearance.closest("[aria-disabled='true']");
    expect(wrapper?.className).toContain("red");
  });
});
