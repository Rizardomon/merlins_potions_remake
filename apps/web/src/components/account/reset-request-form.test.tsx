import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ResetRequestForm } from "./reset-request-form";
import { useRequestPasswordReset } from "@/hooks/use-auth";
import { useAccountOverlay } from "@/lib/account/provider";

vi.mock("@/hooks/use-auth");
vi.mock("@/lib/account/provider");

describe("ResetRequestForm", () => {
  const mockResetMutation = {
    mutateAsync: vi.fn(),
    isPending: false,
  };

  const mockAccountOverlay = {
    switchView: vi.fn(),
    setEmail: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRequestPasswordReset).mockReturnValue(mockResetMutation as any);
    vi.mocked(useAccountOverlay).mockReturnValue(mockAccountOverlay as any);
  });

  it("renders reset request form with email input", () => {
    render(<ResetRequestForm />);
    expect(screen.getByText("Reset your password")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("your@email.com")).toBeInTheDocument();
    expect(screen.getByText("Send reset link")).toBeInTheDocument();
  });

  it("shows validation error for empty email on submit", async () => {
    render(<ResetRequestForm />);
    const button = screen.getByText("Send reset link");
    await userEvent.click(button);
    expect(screen.getByText("Enter your email")).toBeInTheDocument();
  });

  it("shows validation error for invalid email", async () => {
    render(<ResetRequestForm />);
    const input = screen.getByPlaceholderText("your@email.com");
    await userEvent.type(input, "invalid-email");
    await userEvent.click(screen.getByText("Send reset link"));
    expect(screen.getByText("Enter a valid email")).toBeInTheDocument();
  });

  it("clears validation error on field change after blur", async () => {
    render(<ResetRequestForm />);
    const input = screen.getByPlaceholderText("your@email.com");

    // Blur to trigger touched
    await userEvent.click(input);
    await userEvent.click(screen.getByText("Reset your password")); // Click elsewhere

    // Should show error
    expect(screen.getByText("Enter your email")).toBeInTheDocument();

    // Type valid email
    await userEvent.type(input, "test@example.com");
    expect(screen.queryByText("Enter your email")).not.toBeInTheDocument();
  });

  it("submits form with valid email and switches to check-inbox", async () => {
    mockResetMutation.mutateAsync.mockResolvedValueOnce(undefined);

    render(<ResetRequestForm />);

    const input = screen.getByPlaceholderText("your@email.com");
    const submitButton = screen.getByText("Send reset link");

    await userEvent.type(input, "test@example.com");
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockResetMutation.mutateAsync).toHaveBeenCalledWith({
        email: "test@example.com",
      });
    });
  });


  it("shows error message on rate limit (429)", async () => {
    mockResetMutation.mutateAsync.mockRejectedValueOnce({
      status: 429,
      message: "Too many attempts",
    });

    render(<ResetRequestForm />);

    const input = screen.getByPlaceholderText("your@email.com");
    await userEvent.type(input, "test@example.com");
    await userEvent.click(screen.getByText("Send reset link"));

    await waitFor(() => {
      expect(screen.getByText("Too many attempts. Try again in 15 minutes.")).toBeInTheDocument();
    });
  });

  it("shows generic error message on other errors", async () => {
    mockResetMutation.mutateAsync.mockRejectedValueOnce({
      status: 500,
      message: "Internal error",
    });

    render(<ResetRequestForm />);

    const input = screen.getByPlaceholderText("your@email.com");
    await userEvent.type(input, "test@example.com");
    await userEvent.click(screen.getByText("Send reset link"));

    await waitFor(() => {
      expect(screen.getByText("Something went wrong. Please try again.")).toBeInTheDocument();
    });
  });

  it("has back to sign-in link", () => {
    render(<ResetRequestForm />);
    const backLink = screen.getByText("Back to sign in");
    expect(backLink).toBeInTheDocument();
  });
});
