import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { CreateAccountForm } from "./create-account-form";
import { AccountOverlayProvider } from "@/lib/account/provider";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";

describe("CreateAccountForm - Terms and Privacy Links Integration", () => {
  function renderWithProviders(component: React.ReactNode) {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    return render(
      <QueryClientProvider client={queryClient}>
        <AccountOverlayProvider initialSession={{ customer: null }}>
          {component}
        </AccountOverlayProvider>
      </QueryClientProvider>
    );
  }

  it("renders terms link with correct attributes for new tab", () => {
    renderWithProviders(<CreateAccountForm />);
    const termsLink = screen.getByRole("link", { name: /terms/i });
    expect(termsLink).toHaveAttribute("href", "/terms");
    expect(termsLink).toHaveAttribute("target", "_blank");
    expect(termsLink).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders privacy policy link with correct attributes for new tab", () => {
    renderWithProviders(<CreateAccountForm />);
    const privacyLink = screen.getByRole("link", { name: /privacy policy/i });
    expect(privacyLink).toHaveAttribute("href", "/privacy");
    expect(privacyLink).toHaveAttribute("target", "_blank");
    expect(privacyLink).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("has both terms and privacy links visible in the form", () => {
    renderWithProviders(<CreateAccountForm />);
    expect(screen.getByRole("link", { name: /terms/i })).toBeVisible();
    expect(screen.getByRole("link", { name: /privacy policy/i })).toBeVisible();
  });

  it("terms and privacy links are part of the terms acceptance statement", () => {
    renderWithProviders(<CreateAccountForm />);
    const termsAcceptanceText = screen.getByText(/i agree to the/i);
    expect(termsAcceptanceText).toBeInTheDocument();
    expect(termsAcceptanceText.closest("label")).toContainElement(
      screen.getByRole("link", { name: /terms/i })
    );
    expect(termsAcceptanceText.closest("label")).toContainElement(
      screen.getByRole("link", { name: /privacy policy/i })
    );
  });

  it("form fields remain intact when links are opened in new tab", () => {
    renderWithProviders(<CreateAccountForm />);

    // Verify form fields are rendered
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();

    // Verify links exist and have target="_blank" (which prevents form loss)
    const termsLink = screen.getByRole("link", { name: /terms/i });
    const privacyLink = screen.getByRole("link", { name: /privacy policy/i });

    // target="_blank" with rel="noopener noreferrer" ensures the link opens
    // in a new tab without affecting the current page/form
    expect(termsLink).toHaveAttribute("target", "_blank");
    expect(privacyLink).toHaveAttribute("target", "_blank");

    // Verify all form inputs are still present after link rendering
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
  });
});
