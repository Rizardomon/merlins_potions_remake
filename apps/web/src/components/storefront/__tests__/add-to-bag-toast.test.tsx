import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AddToBagToast } from "../add-to-bag-toast";

const mockUseBag = vi.fn();

vi.mock("@/lib/bag/provider", () => ({
  useBag: () => mockUseBag(),
}));

const makeCtx = (overrides = {}) => ({
  toastVisible: true,
  toastQuantity: 1,
  openBag: vi.fn(),
  dismissToast: vi.fn(),
  ...overrides,
});

describe("AddToBagToast", () => {
  beforeEach(() => mockUseBag.mockReturnValue(makeCtx()));

  it("does not render when toastVisible is false", () => {
    mockUseBag.mockReturnValue(makeCtx({ toastVisible: false }));
    render(<AddToBagToast />);
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("renders when toastVisible is true", () => {
    render(<AddToBagToast />);
    expect(screen.getByRole("status")).toBeDefined();
  });

  it("displays quantity in message", () => {
    mockUseBag.mockReturnValue(makeCtx({ toastQuantity: 3 }));
    render(<AddToBagToast />);
    expect(screen.getByText(/3 × potion added/i)).toBeDefined();
  });

  it("announces to assistive technology via aria-live", () => {
    render(<AddToBagToast />);
    const el = screen.getByRole("status");
    expect(el.getAttribute("aria-live")).toBe("polite");
    expect(el.getAttribute("aria-atomic")).toBe("true");
  });

  it("'View bag' button calls openBag and dismissToast", () => {
    const openBag = vi.fn();
    const dismissToast = vi.fn();
    mockUseBag.mockReturnValue(makeCtx({ openBag, dismissToast }));
    render(<AddToBagToast />);
    fireEvent.click(screen.getByRole("button", { name: /view bag/i }));
    expect(openBag).toHaveBeenCalled();
    expect(dismissToast).toHaveBeenCalled();
  });
});
