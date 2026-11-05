import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { AnnouncementBar } from "../announcement-bar";

describe("AnnouncementBar", () => {
  it("renders free shipping announcement", () => {
    render(<AnnouncementBar />);
    expect(screen.getByText(/free shipping on orders over \$50/i)).toBeDefined();
  });

  it("has banner role", () => {
    render(<AnnouncementBar />);
    expect(screen.getByRole("banner")).toBeDefined();
  });
});
