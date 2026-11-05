import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Footer } from "../footer";

describe("Footer", () => {
  it("renders company links", () => {
    render(<Footer />);
    for (const label of ["Company", "Contact us", "Shipping", "Returns", "Careers"]) {
      expect(screen.getByRole("link", { name: label })).toBeDefined();
    }
  });

  it("renders social links", () => {
    render(<Footer />);
    for (const label of ["Facebook", "X", "Pinterest", "Tumblr"]) {
      expect(screen.getByRole("link", { name: label })).toBeDefined();
    }
  });

  it("renders copyright", () => {
    render(<Footer />);
    expect(screen.getByText(/© 2026 Merlin's Potions/i)).toBeDefined();
  });

  it("links have no real destination", () => {
    render(<Footer />);
    const links = screen.getAllByRole("link");
    for (const link of links) {
      const href = link.getAttribute("href");
      expect(["#", null, ""]).toContain(href);
    }
  });

  it("all links point to '#' (no real navigation)", () => {
    render(<Footer />);
    const links = screen.getAllByRole("link");
    for (const link of links) {
      expect(link.getAttribute("href")).toBe("#");
    }
  });
});
