import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CreateAccountForm } from "./create-account-form";
import { useSignUp } from "@/hooks/use-auth";
import { useAccountOverlay } from "@/lib/account/provider";

vi.mock("@/hooks/use-auth");
vi.mock("@/lib/account/provider");

describe("CreateAccountForm", () => {
  const mockSignUpMutation = {
    mutateAsync: vi.fn(),
    isPending: false,
  };

  const mockAccountOverlay = {
    switchView: vi.fn(),
    setEmail: vi.fn(),
    state: { activeView: "create" },
    dispatch: vi.fn(),
    triggerRef: { current: null },
    closeOverlay: vi.fn(),
    openOverlay: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useSignUp).mockReturnValue(mockSignUpMutation as any);
    vi.mocked(useAccountOverlay).mockReturnValue(mockAccountOverlay as any);
  });

  describe("Rendering", () => {
    it("renders create account form with all required fields", () => {
      render(<CreateAccountForm />);
      expect(screen.getByLabelText("Full name")).toBeInTheDocument();
      expect(screen.getByLabelText("Email")).toBeInTheDocument();
      expect(screen.getByLabelText("Password")).toBeInTheDocument();
    });

    it("renders strength meter", () => {
      render(<CreateAccountForm />);
      expect(screen.getByText("Use 8+ characters with a number and a capital letter")).toBeInTheDocument();
    });

    it("renders newsletter opt-in checkbox unchecked by default", () => {
      render(<CreateAccountForm />);
      const checkbox = screen.getByLabelText("Send me new brews and members-only offers") as HTMLInputElement;
      expect(checkbox.checked).toBe(false);
    });

    it("renders terms acceptance checkbox", () => {
      render(<CreateAccountForm />);
      const termsCheckbox = screen.getByLabelText(/I agree to the terms/i);
      expect(termsCheckbox).toBeInTheDocument();
    });

    it("renders create account button", () => {
      render(<CreateAccountForm />);
      expect(screen.getByText("Create account")).toBeInTheDocument();
    });

    it("renders terms and privacy policy links", () => {
      render(<CreateAccountForm />);
      const termsLink = screen.getByText("terms");
      const privacyLink = screen.getByText("privacy policy");
      expect(termsLink).toBeInTheDocument();
      expect(privacyLink).toBeInTheDocument();
      expect(termsLink.closest("a")).toHaveAttribute("href", "/terms");
      expect(privacyLink.closest("a")).toHaveAttribute("href", "/privacy");
    });
  });

  describe("Validation", () => {
    it("shows error for required full name", async () => {
      const user = userEvent.setup();
      render(<CreateAccountForm />);

      const nameInput = screen.getByLabelText("Full name");
      await user.click(nameInput);
      fireEvent.blur(nameInput);

      await waitFor(() => {
        expect(screen.getByText("Required")).toBeInTheDocument();
      });
    });

    it("shows error for invalid email", async () => {
      const user = userEvent.setup();
      render(<CreateAccountForm />);

      const emailInput = screen.getByLabelText("Email");
      await user.type(emailInput, "invalid-email");
      await user.click(emailInput);
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.getByText("Enter a valid email")).toBeInTheDocument();
      });
    });

    it("shows error for password less than 8 characters", async () => {
      const user = userEvent.setup();
      render(<CreateAccountForm />);

      const passwordInput = screen.getByLabelText("Password");
      await user.type(passwordInput, "short");
      await user.click(passwordInput);
      fireEvent.blur(passwordInput);

      await waitFor(() => {
        expect(screen.getByText("Use at least 8 characters")).toBeInTheDocument();
      });
    });

    it("shows error when terms not accepted on form submission", async () => {
      const user = userEvent.setup();
      render(<CreateAccountForm />);

      const nameInput = screen.getByLabelText("Full name");
      const emailInput = screen.getByLabelText("Email");
      const passwordInput = screen.getByLabelText("Password");

      await user.type(nameInput, "Test User");
      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "ValidPassword123!");

      const submitButton = screen.getByText("Create account");
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Please accept the terms to continue")).toBeInTheDocument();
      });
    });

    it("clears field error when field is edited", async () => {
      const user = userEvent.setup();
      render(<CreateAccountForm />);

      const passwordInput = screen.getByLabelText("Password") as HTMLInputElement;
      await user.type(passwordInput, "short");
      fireEvent.blur(passwordInput);

      await waitFor(() => {
        expect(screen.getByText("Use at least 8 characters")).toBeInTheDocument();
      });

      await user.clear(passwordInput);
      await user.type(passwordInput, "LongPassword123!");

      await waitFor(() => {
        expect(screen.queryByText("Use at least 8 characters")).not.toBeInTheDocument();
      });
    });
  });

  describe("Show/Hide password", () => {
    it("toggles password visibility", async () => {
      const user = userEvent.setup();
      render(<CreateAccountForm />);

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

  describe("Newsletter opt-in", () => {
    it("toggles newsletter opt-in checkbox", async () => {
      const user = userEvent.setup();
      render(<CreateAccountForm />);

      const checkbox = screen.getByLabelText("Send me new brews and members-only offers") as HTMLInputElement;
      expect(checkbox.checked).toBe(false);

      await user.click(checkbox);
      expect(checkbox.checked).toBe(true);

      await user.click(checkbox);
      expect(checkbox.checked).toBe(false);
    });
  });

  describe("Terms acceptance", () => {
    it("requires terms acceptance before submission", async () => {
      const user = userEvent.setup();
      render(<CreateAccountForm />);

      const nameInput = screen.getByLabelText("Full name");
      const emailInput = screen.getByLabelText("Email");
      const passwordInput = screen.getByLabelText("Password");

      await user.type(nameInput, "Test User");
      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "ValidPassword123!");

      const submitButton = screen.getByText("Create account");
      await user.click(submitButton);

      expect(mockSignUpMutation.mutateAsync).not.toHaveBeenCalled();
      expect(screen.getByText("Please accept the terms to continue")).toBeInTheDocument();
    });
  });

  describe("Form submission", () => {
    it("calls signUp mutation with correct data on successful validation", async () => {
      const user = userEvent.setup();
      mockSignUpMutation.mutateAsync.mockResolvedValueOnce({
        customer: {
          id: "123",
          fullName: "Test User",
          firstName: "Test",
          email: "test@example.com",
        },
      });

      render(<CreateAccountForm />);

      const nameInput = screen.getByLabelText("Full name");
      const emailInput = screen.getByLabelText("Email");
      const passwordInput = screen.getByLabelText("Password");
      const termsCheckbox = screen.getByLabelText(/I agree to the terms/i);

      await user.type(nameInput, "Test User");
      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "ValidPassword123!");
      await user.click(termsCheckbox);

      const submitButton = screen.getByText("Create account");
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSignUpMutation.mutateAsync).toHaveBeenCalledWith({
          fullName: "Test User",
          email: "test@example.com",
          password: "ValidPassword123!",
          newsletterOptIn: false,
          termsAccepted: true,
        });
      });
    });

    it("handles 409 error (email already exists)", async () => {
      const user = userEvent.setup();
      mockSignUpMutation.mutateAsync.mockRejectedValueOnce({ status: 409 });

      render(<CreateAccountForm />);

      const nameInput = screen.getByLabelText("Full name");
      const emailInput = screen.getByLabelText("Email");
      const passwordInput = screen.getByLabelText("Password");
      const termsCheckbox = screen.getByLabelText(/I agree to the terms/i);

      await user.type(nameInput, "Test User");
      await user.type(emailInput, "existing@example.com");
      await user.type(passwordInput, "ValidPassword123!");
      await user.click(termsCheckbox);

      const submitButton = screen.getByText("Create account");
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("An account with this email already exists.")).toBeInTheDocument();
        expect(screen.getByText("Sign in instead")).toBeInTheDocument();
      });
    });

    it("prevents submission when validation fails", async () => {
      const user = userEvent.setup();
      render(<CreateAccountForm />);

      const submitButton = screen.getByText("Create account");
      await user.click(submitButton);

      expect(mockSignUpMutation.mutateAsync).not.toHaveBeenCalled();
    });

    it("includes newsletter opt-in when checked", async () => {
      const user = userEvent.setup();
      mockSignUpMutation.mutateAsync.mockResolvedValueOnce({
        customer: {
          id: "123",
          fullName: "Test User",
          firstName: "Test",
          email: "test@example.com",
        },
      });

      render(<CreateAccountForm />);

      const nameInput = screen.getByLabelText("Full name");
      const emailInput = screen.getByLabelText("Email");
      const passwordInput = screen.getByLabelText("Password");
      const newsletterCheckbox = screen.getByLabelText("Send me new brews and members-only offers");
      const termsCheckbox = screen.getByLabelText(/I agree to the terms/i);

      await user.type(nameInput, "Test User");
      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "ValidPassword123!");
      await user.click(newsletterCheckbox);
      await user.click(termsCheckbox);

      const submitButton = screen.getByText("Create account");
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSignUpMutation.mutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            newsletterOptIn: true,
          })
        );
      });
    });
  });

  describe("Navigation", () => {
    it("calls switchView('sign-in') when clicking 'Sign in' link", async () => {
      const user = userEvent.setup();
      render(<CreateAccountForm />);

      const signInLink = screen.getByText("Sign in");
      await user.click(signInLink);

      expect(mockAccountOverlay.switchView).toHaveBeenCalledWith("sign-in");
    });
  });
});
