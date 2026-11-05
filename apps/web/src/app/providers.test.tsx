import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Providers } from "./providers";

describe("Providers", () => {
  it("renders children", () => {
    render(
      <Providers>
        <span>child content</span>
      </Providers>,
    );
    expect(screen.getByText("child content")).toBeDefined();
  });

  it("does not use ThemeProvider (no data-theme on document root)", () => {
    render(
      <Providers>
        <span>content</span>
      </Providers>,
    );
    expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
  });
});
