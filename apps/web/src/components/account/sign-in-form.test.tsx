import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SignInForm } from "./sign-in-form";
import { useSignIn } from "@/hooks/use-auth";
import { useAccountOverlay } from "@/lib/account/provider";

vi.mock("@/hooks/use-auth");
vi.mock("@/lib/account/provider");

describe("SignInForm", () => {
  const mockSignInMutation = {
    mutateAsync: vi.fn(),
    isPending: false,
  };

  const mockAccountOverlay = {
    switchView: vi.fn(),
    setEmail: vi.fn(),
    state: { activeView: "sign-in" },
    dispatch: vi.fn(),
    triggerRef: { current: null },
    closeOverlay: vi.fn(),
    openOverlay: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useSignIn).mockReturnValue(mockSignInMutation as any);
    vi.mocked(useAccountOverlay).mockReturnValue(mockAccountOverlay as any);
  });

  describe("Rendering", () => {
    it("renders sign-in form with email and password fields", () => {
      render(<SignInForm />);
      expect(screen.getByLabelText("Email")).toBeInTheDocument();
      expect(screen.getByLabelText("Password")).toBeInTheDocument();
    });

    it("renders 'Keep me signed in' checkbox checked by default", () => {
      render(<SignInForm />);
      const checkbox = screen.getByLabelText("Keep me signed in") as HTMLInputElement;
      expect(checkbox.checked).toBe(true);
    });

    it("renders show/hide password button", () => {
      render(<SignInForm />);
      expect(screen.getByLabelText("Show password")).toBeInTheDocument();
    });

    it("renders sign in button", () => {
      render(<SignInForm />);
      expect(screen.getByText("Sign in")).toBeInTheDocument();
    });

    it("renders 'Forgot password?' link", () => {
      render(<SignInForm />);
      expect(screen.getByText("Forgot password?")).toBeInTheDocument();
    });

    it("renders 'Create an account' link", () => {
      render(<SignInForm />);
      expect(screen.getByText("Create an account")).toBeInTheDocument();
    });
  });

  describe("Validation", () => {
    it("shows error for invalid email on blur", async () => {
      const user = userEvent.setup();
      render(<SignInForm />);

      const emailInput = screen.getByLabelText("Email");
      await user.type(emailInput, "invalid-email");
      await user.click(emailInput);
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.getByText("Enter a valid email")).toBeInTheDocument();
      });
    });

    it("shows error for empty password on blur", async () => {
      const user = userEvent.setup();
      render(<SignInForm />);

      const passwordInput = screen.getByLabelText("Password");
      await user.click(passwordInput);
      fireEvent.blur(passwordInput);

      await waitFor(() => {
        expect(screen.getByText("Enter your password")).toBeInTheDocument();
      });
    });

    it("clears error when field is edited after validation", async () => {
      const user = userEvent.setup();
      render(<SignInForm />);

      const emailInput = screen.getByLabelText("Email") as HTMLInputElement;
      await user.type(emailInput, "invalid");
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.getByText("Enter a valid email")).toBeInTheDocument();
      });

      await user.clear(emailInput);
      await user.type(emailInput, "valid@email.com");

      await waitFor(() => {
        expect(screen.queryByText("Enter a valid email")).not.toBeInTheDocument();
      });
    });
  });

  describe("Show/Hide password", () => {
    it("toggles password visibility", async () => {
      const user = userEvent.setup();
      render(<SignInForm />);

      const passwordInput = screen.getByLabelText("Password") as HTMLInputElement;
      expect(passwordInput.type).toBe("password");

      const showButton = screen.getByLabelText("Show password");
      await user.click(showButton);

      expect(passwordInput.type).toBe("text");

      const hideButton = screen.getByLabelText("Hide password");
      await user.click(hideButton);

      expect(passwordInput.type).toBe("password");
    });
  });

  describe("Keep signed in", () => {
    it("toggles 'Keep me signed in' checkbox", async () => {
      const user = userEvent.setup();
      render(<SignInForm />);

      const checkbox = screen.getByLabelText("Keep me signed in") as HTMLInputElement;
      expect(checkbox.checked).toBe(true);

      await user.click(checkbox);
      expect(checkbox.checked).toBe(false);

      await user.click(checkbox);
      expect(checkbox.checked).toBe(true);
    });
  });

  describe("Form submission", () => {
    it("calls signIn mutation with correct data on successful validation", async () => {
      const user = userEvent.setup();
      mockSignInMutation.mutateAsync.mockResolvedValueOnce({
        customer: { id: "123", fullName: "Test User", firstName: "Test", email: "test@example.com" },
      });

      render(<SignInForm />);

      const emailInput = screen.getByLabelText("Email");
      const passwordInput = screen.getByLabelText("Password");

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");

      const submitButton = screen.getByText("Sign in");
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSignInMutation.mutateAsync).toHaveBeenCalledWith({
          email: "test@example.com",
          password: "password123",
          keepSignedIn: true,
        });
      });
    });

    it("handles 401 error (invalid credentials)", async () => {
      const user = userEvent.setup();
      mockSignInMutation.mutateAsync.mockRejectedValueOnce({ status: 401 });

      render(<SignInForm />);

      const emailInput = screen.getByLabelText("Email");
      const passwordInput = screen.getByLabelText("Password");

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "wrongpassword");

      const submitButton = screen.getByText("Sign in");
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Email or password is incorrect.")).toBeInTheDocument();
      });
    });

    it("handles 429 error (lockout)", async () => {
      const user = userEvent.setup();
      mockSignInMutation.mutateAsync.mockRejectedValueOnce({ status: 429 });

      render(<SignInForm />);

      const emailInput = screen.getByLabelText("Email");
      const passwordInput = screen.getByLabelText("Password");

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");

      const submitButton = screen.getByText("Sign in");
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Too many attempts. Try again in 15 minutes.")).toBeInTheDocument();
      });
    });

    it("prevents submission when validation fails", async () => {
      const user = userEvent.setup();
      render(<SignInForm />);

      const submitButton = screen.getByText("Sign in");
      await user.click(submitButton);

      expect(mockSignInMutation.mutateAsync).not.toHaveBeenCalled();
    });
  });

  describe("Navigation", () => {
    it("calls switchView('create') when clicking 'Create an account'", async () => {
      const user = userEvent.setup();
      render(<SignInForm />);

      const createLink = screen.getByText("Create an account");
      await user.click(createLink);

      expect(mockAccountOverlay.switchView).toHaveBeenCalledWith("create");
    });

    it("calls switchView('reset-request') when clicking 'Forgot password?'", async () => {
      const user = userEvent.setup();
      render(<SignInForm />);

      const forgotLink = screen.getByText("Forgot password?");
      await user.click(forgotLink);

      expect(mockAccountOverlay.switchView).toHaveBeenCalledWith("reset-request");
    });
  });
});
