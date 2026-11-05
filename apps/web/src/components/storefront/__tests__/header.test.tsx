import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Header } from "../header";

const mockUseBag = vi.fn(() => ({ itemCount: 0 }));

vi.mock("@/lib/bag/provider", () => ({
  useBag: () => mockUseBag(),
}));

describe("Header", () => {
  beforeEach(() => mockUseBag.mockReturnValue({ itemCount: 0 }));

  it("renders brand name", () => {
    render(<Header />);
    expect(screen.getByRole("link", { name: /merlin's potions/i })).toBeDefined();
  });

  it("renders search input", () => {
    render(<Header />);
    expect(screen.getByPlaceholderText(/search our stock/i)).toBeDefined();
  });

  it("renders Sign in button (visual only)", () => {
    render(<Header />);
    expect(screen.getByRole("button", { name: /sign in/i })).toBeDefined();
  });

  it("renders Bag button with count 0", () => {
    render(<Header />);
    expect(screen.getByRole("button", { name: /open bag, 0 items/i })).toBeDefined();
  });

  it("shows count badge when bag has items", () => {
    mockUseBag.mockReturnValue({ itemCount: 3 });
    render(<Header />);
    expect(screen.getByRole("button", { name: /open bag, 3 items/i })).toBeDefined();
    expect(screen.getByText("3")).toBeDefined();
  });

  it("singular label for 1 item", () => {
    mockUseBag.mockReturnValue({ itemCount: 1 });
    render(<Header />);
    expect(screen.getByRole("button", { name: /open bag, 1 item$/i })).toBeDefined();
  });
});
