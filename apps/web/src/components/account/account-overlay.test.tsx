import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AccountOverlayProvider, useAccountOverlay } from "@/lib/account/provider";
import { BagProvider } from "@/lib/bag/provider";
import { AccountOverlay } from "./account-overlay";

const mockCatalog = [
  {
    id: "1",
    name: "Potion 1",
    description: "Test",
    priceCents: 1999,
    imageUrl: "test.jpg",
  },
];

function TestComponent() {
  const { openOverlay } = useAccountOverlay();

  return (
    <div>
      <button onClick={openOverlay} data-testid="sign-in-btn">
        Sign in
      </button>
      <AccountOverlay>
        <div data-testid="form-content">Form Content</div>
      </AccountOverlay>
    </div>
  );
}

function renderWithProviders(component: React.ReactNode) {
  return render(
    <AccountOverlayProvider initialSession={{ customer: null }}>
      <BagProvider catalog={mockCatalog}>{component}</BagProvider>
    </AccountOverlayProvider>
  );
}

describe("AccountOverlay", () => {
  it("does not render when overlay is closed", () => {
    renderWithProviders(<TestComponent />);
    expect(screen.queryByTestId("form-content")).toBeNull();
  });

  it("renders when overlay is opened", () => {
    renderWithProviders(<TestComponent />);
    const signInBtn = screen.getByTestId("sign-in-btn");
    fireEvent.click(signInBtn);
    expect(screen.getByTestId("form-content")).toBeDefined();
  });

  it("closes overlay when close button is clicked", () => {
    renderWithProviders(<TestComponent />);
    const signInBtn = screen.getByTestId("sign-in-btn");
    fireEvent.click(signInBtn);
    expect(screen.getByTestId("form-content")).toBeDefined();

    const closeBtn = screen.getByLabelText("Close account overlay");
    fireEvent.click(closeBtn);
    expect(screen.queryByTestId("form-content")).toBeNull();
  });

  it("closes overlay when Escape key is pressed", () => {
    renderWithProviders(<TestComponent />);
    const signInBtn = screen.getByTestId("sign-in-btn");
    fireEvent.click(signInBtn);
    expect(screen.getByTestId("form-content")).toBeDefined();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByTestId("form-content")).toBeNull();
  });

  it("has tabs with proper ARIA roles", () => {
    renderWithProviders(<TestComponent />);
    const signInBtn = screen.getByTestId("sign-in-btn");
    fireEvent.click(signInBtn);

    const tablist = screen.getByRole("tablist");
    expect(tablist).toBeDefined();

    const tabs = screen.getAllByRole("tab");
    expect(tabs.length).toBe(2);
    expect(tabs[0].textContent).toContain("Sign in");
    expect(tabs[1].textContent).toContain("Create account");
  });

  it("switches tabs when clicked", () => {
    renderWithProviders(<TestComponent />);
    const signInBtn = screen.getByTestId("sign-in-btn");
    fireEvent.click(signInBtn);

    let tabs = screen.getAllByRole("tab");
    expect(tabs[0].getAttribute("aria-selected")).toBe("true");
    expect(tabs[1].getAttribute("aria-selected")).toBe("false");

    fireEvent.click(tabs[1]);

    tabs = screen.getAllByRole("tab");
    expect(tabs[0].getAttribute("aria-selected")).toBe("false");
    expect(tabs[1].getAttribute("aria-selected")).toBe("true");
  });

  it("hides body scroll when overlay is open", () => {
    renderWithProviders(<TestComponent />);
    const initialOverflow = document.body.style.overflow;

    const signInBtn = screen.getByTestId("sign-in-btn");
    fireEvent.click(signInBtn);
    expect(document.body.style.overflow).toBe("hidden");

    // Restore after test
    document.body.style.overflow = initialOverflow;
  });

  it("restores body scroll when overlay is closed", () => {
    renderWithProviders(<TestComponent />);
    const signInBtn = screen.getByTestId("sign-in-btn");
    fireEvent.click(signInBtn);
    expect(document.body.style.overflow).toBe("hidden");

    const closeBtn = screen.getByLabelText("Close account overlay");
    fireEvent.click(closeBtn);
    expect(document.body.style.overflow).not.toBe("hidden");
  });

  it("has proper dialog ARIA attributes", () => {
    renderWithProviders(<TestComponent />);
    const signInBtn = screen.getByTestId("sign-in-btn");
    fireEvent.click(signInBtn);

    const dialog = screen.getByRole("dialog");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(dialog.getAttribute("aria-label")).toBe("Account");
  });
});
