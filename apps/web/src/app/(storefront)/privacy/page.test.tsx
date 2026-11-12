import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import PrivacyPage from "./page";

describe("PrivacyPage", () => {
  it("renders the page with the correct title", () => {
    render(<PrivacyPage />);
    expect(screen.getByRole("heading", { level: 1, name: /privacy policy/i })).toBeInTheDocument();
  });

  it("displays placeholder warning prominently", () => {
    render(<PrivacyPage />);
    expect(screen.getByText(/placeholder content/i)).toBeInTheDocument();
    expect(screen.getByText(/final legal review is pending/i)).toBeInTheDocument();
  });

  it("shows placeholder notice in warning box", () => {
    render(<PrivacyPage />);
    const warningBox = screen.getByText(/placeholder content/i).closest("div");
    expect(warningBox).toHaveClass("border-[#4B2E83]", "bg-[#D9C7F2]");
  });

  it("contains section headers for all privacy sections", () => {
    render(<PrivacyPage />);
    expect(screen.getByRole("heading", { name: /introduction/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /information we collect/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /how we use information/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /data protection/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /your rights/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /cookies and tracking/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /third-party sharing/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /contact information/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /changes to this policy/i })).toBeInTheDocument();
  });

  it("displays content marked as placeholder", () => {
    render(<PrivacyPage />);
    const placeholderTexts = screen.getAllByText(/\[placeholder/i);
    expect(placeholderTexts.length).toBeGreaterThan(0);
  });

  it("contains last updated notice indicating placeholder status", () => {
    render(<PrivacyPage />);
    expect(screen.getByText(/this privacy policy is currently in placeholder status/i)).toBeInTheDocument();
  });

  it("applies correct typography and colors from design system", () => {
    render(<PrivacyPage />);
    const title = screen.getByRole("heading", { level: 1 });
    expect(title).toHaveClass("font-serif", "text-5xl", "text-[#1F1A26]");
  });

  it("renders without crashing", () => {
    const { container } = render(<PrivacyPage />);
    expect(container).toBeInTheDocument();
  });
});
