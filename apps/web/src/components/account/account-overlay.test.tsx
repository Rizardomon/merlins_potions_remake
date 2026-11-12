import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AccountOverlayProvider, useAccountOverlay } from "@/lib/account/provider";
import { AccountOverlay } from "./account-overlay";

vi.mock("@/hooks/use-auth", () => ({
  useSession: vi.fn(() => ({ data: { customer: null }, isPending: false })),
  useSignIn: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useSignUp: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  authQueryKeys: { session: ["session"] as const },
}));

vi.mock("@/lib/bag/provider", () => ({
  useBag: vi.fn(() => ({
    state: { lines: [], hydrated: true },
    closeBag: vi.fn(),
    openBag: vi.fn(),
  })),
}));

function TestComponent() {
  const { openOverlay, triggerRef } = useAccountOverlay();

  return (
    <div>
      <button ref={triggerRef} onClick={openOverlay} data-testid="sign-in-btn">
        Sign in
      </button>
      <AccountOverlay />
    </div>
  );
}

describe("AccountOverlay", () => {
  it("does not render when overlay is closed", () => {
    render(
      <AccountOverlayProvider initialSession={{ customer: null }}>
        <TestComponent />
      </AccountOverlayProvider>
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders when overlay is opened", () => {
    render(
      <AccountOverlayProvider initialSession={{ customer: null }}>
        <TestComponent />
      </AccountOverlayProvider>
    );
    const signInBtn = screen.getByTestId("sign-in-btn");
    fireEvent.click(signInBtn);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("renders tabs for sign-in and create account", () => {
    render(
      <AccountOverlayProvider initialSession={{ customer: null }}>
        <TestComponent />
      </AccountOverlayProvider>
    );
    const signInBtn = screen.getByTestId("sign-in-btn");
    fireEvent.click(signInBtn);

    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(2);
    expect(tabs[0].textContent).toContain("Sign in");
    expect(tabs[1].textContent).toContain("Create account");
  });

  it("has proper dialog ARIA attributes", () => {
    render(
      <AccountOverlayProvider initialSession={{ customer: null }}>
        <TestComponent />
      </AccountOverlayProvider>
    );
    const signInBtn = screen.getByTestId("sign-in-btn");
    fireEvent.click(signInBtn);

    const dialog = screen.getByRole("dialog");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(dialog.getAttribute("aria-label")).toBe("Account");
  });
});
