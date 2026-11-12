import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import TermsPage from "./page";

describe("TermsPage", () => {
  it("renders the page with the correct title", () => {
    render(<TermsPage />);
    expect(screen.getByRole("heading", { level: 1, name: /terms of service/i })).toBeInTheDocument();
  });

  it("displays placeholder warning prominently", () => {
    render(<TermsPage />);
    expect(screen.getByText(/placeholder content/i)).toBeInTheDocument();
    expect(screen.getByText(/final legal review is pending/i)).toBeInTheDocument();
  });

  it("shows placeholder notice in warning box", () => {
    render(<TermsPage />);
    const warningBox = screen.getByText(/placeholder content/i).closest("div");
    expect(warningBox).toHaveClass("border-[#4B2E83]", "bg-[#D9C7F2]");
  });

  it("contains section headers for all terms sections", () => {
    render(<TermsPage />);
    expect(screen.getByRole("heading", { name: /agreement to terms/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /use license/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /disclaimer/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /limitations/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /accuracy of materials/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /links/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /modifications/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /governing law/i })).toBeInTheDocument();
  });

  it("displays content marked as placeholder", () => {
    render(<TermsPage />);
    const placeholderTexts = screen.getAllByText(/\[placeholder/i);
    expect(placeholderTexts.length).toBeGreaterThan(0);
  });

  it("contains last updated notice indicating placeholder status", () => {
    render(<TermsPage />);
    expect(screen.getByText(/these terms are currently in placeholder status/i)).toBeInTheDocument();
  });

  it("applies correct typography and colors from design system", () => {
    render(<TermsPage />);
    const title = screen.getByRole("heading", { level: 1 });
    expect(title).toHaveClass("font-serif", "text-5xl", "text-[#1F1A26]");
  });

  it("renders without crashing", () => {
    const { container } = render(<TermsPage />);
    expect(container).toBeInTheDocument();
  });
});
