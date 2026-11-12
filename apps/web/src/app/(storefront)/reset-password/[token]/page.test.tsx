import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ResetPasswordPage from "./page";
import { useCompletePasswordReset } from "@/hooks/use-auth";

vi.mock("@/hooks/use-auth");
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe("ResetPasswordPage", () => {
  const mockCompleteMutation = {
    mutateAsync: vi.fn(),
    isPending: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.mocked(useCompletePasswordReset).mockReturnValue(mockCompleteMutation as any);
  });

  const renderPage = (token: string = "test-token-123") => {
    return render(<ResetPasswordPage params={{ token }} />);
  };

  it("renders set new password form", () => {
    renderPage();
    expect(screen.getByText("Set a new password")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter a new password")).toBeInTheDocument();
    expect(screen.getByText("Save new password")).toBeInTheDocument();
  });

  it("shows password validation error for empty password", async () => {
    renderPage();
    const submitButton = screen.getByText("Save new password");
    await userEvent.click(submitButton);
    expect(screen.getByText("Enter a new password")).toBeInTheDocument();
  });

  it("shows validation error for password < 8 characters", async () => {
    renderPage();
    const input = screen.getByPlaceholderText("Enter a new password");
    await userEvent.type(input, "short");
    await userEvent.click(screen.getByText("Set a new password")); // Click elsewhere to blur
    await userEvent.click(screen.getByText("Save new password"));
    expect(screen.getByText("Use at least 8 characters")).toBeInTheDocument();
  });

  it("displays strength meter when password is entered", async () => {
    renderPage();
    const input = screen.getByPlaceholderText("Enter a new password");
    await userEvent.type(input, "ValidPassword123");
    // Strength meter renders bars and strength text
    expect(screen.getByText(/This is a solid password/)).toBeInTheDocument();
  });

  it("allows show/hide password toggle", async () => {
    renderPage();
    const input = screen.getByPlaceholderText("Enter a new password") as HTMLInputElement;
    const toggleButton = screen.getByText("Show");

    expect(input.type).toBe("password");
    await userEvent.click(toggleButton);
    expect(input.type).toBe("text");
    await userEvent.click(screen.getByText("Hide"));
    expect(input.type).toBe("password");
  });

  it("submits form with valid password >= 8 characters", async () => {
    mockCompleteMutation.mutateAsync.mockResolvedValueOnce(undefined);

    renderPage("test-token-123");

    const input = screen.getByPlaceholderText("Enter a new password");
    const submitButton = screen.getByText("Save new password");

    await userEvent.type(input, "ValidPassword123");
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockCompleteMutation.mutateAsync).toHaveBeenCalledWith({
        token: "test-token-123",
        password: "ValidPassword123",
      });
    });
  });


  it("shows expired link message on 410 error", async () => {
    mockCompleteMutation.mutateAsync.mockRejectedValueOnce({
      status: 410,
      message: "Token expired",
    });

    renderPage();

    const input = screen.getByPlaceholderText("Enter a new password");
    await userEvent.type(input, "ValidPassword123");
    await userEvent.click(screen.getByText("Save new password"));

    await waitFor(() => {
      expect(screen.getByText("This link has expired")).toBeInTheDocument();
    });
  });

  it("shows error message on rate limit (429)", async () => {
    mockCompleteMutation.mutateAsync.mockRejectedValueOnce({
      status: 429,
      message: "Too many attempts",
    });

    renderPage();

    const input = screen.getByPlaceholderText("Enter a new password");
    await userEvent.type(input, "ValidPassword123");
    await userEvent.click(screen.getByText("Save new password"));

    await waitFor(() => {
      expect(screen.getByText("Too many attempts. Try again in 15 minutes.")).toBeInTheDocument();
    });
  });

  it("shows generic error message on other errors", async () => {
    mockCompleteMutation.mutateAsync.mockRejectedValueOnce({
      status: 500,
      message: "Internal error",
    });

    renderPage();

    const input = screen.getByPlaceholderText("Enter a new password");
    await userEvent.type(input, "ValidPassword123");
    await userEvent.click(screen.getByText("Save new password"));

    await waitFor(() => {
      expect(screen.getByText("Something went wrong. Please try again.")).toBeInTheDocument();
    });
  });

  it("displays expired link view with 'Send a new link' button on 410", async () => {
    mockCompleteMutation.mutateAsync.mockRejectedValueOnce({
      status: 410,
      message: "Token expired",
    });

    renderPage();

    const input = screen.getByPlaceholderText("Enter a new password");
    await userEvent.type(input, "ValidPassword123");
    await userEvent.click(screen.getByText("Save new password"));

    await waitFor(() => {
      expect(screen.getByText("Send a new link")).toBeInTheDocument();
    });
  });
});
