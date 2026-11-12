import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PasswordStrengthMeter, getPasswordStrength } from "./password-strength-meter";

describe("PasswordStrengthMeter", () => {
  describe("getPasswordStrength", () => {
    it("returns empty state for empty password", () => {
      const result = getPasswordStrength("");
      expect(result.strength).toBe("empty");
      expect(result.hint).toBe("Use 8+ characters with a number and a capital letter");
    });

    it("returns weak for short password", () => {
      const result = getPasswordStrength("short");
      expect(result.strength).toBe("weak");
    });

    it("returns weak for password without number", () => {
      const result = getPasswordStrength("Password");
      expect(result.strength).toBe("weak");
    });

    it("returns weak for password without uppercase", () => {
      const result = getPasswordStrength("password1");
      expect(result.strength).toBe("weak");
    });

    it("returns fair for password with 8+ chars and number+uppercase only", () => {
      const result = getPasswordStrength("PASSWORD1");
      expect(result.strength).toBe("fair");
      expect(result.hint).toBe("Add more variety to make it stronger");
    });

    it("returns good for password with number, uppercase, and lowercase", () => {
      const result = getPasswordStrength("Password1");
      expect(result.strength).toBe("good");
      expect(result.hint).toBe("This is a solid password");
    });

    it("returns strong for password with all requirements", () => {
      const result = getPasswordStrength("Password1a!");
      expect(result.strength).toBe("strong");
      expect(result.hint).toBe("Excellent choice");
    });
  });

  describe("Component rendering", () => {
    it("renders strength meter with empty password", () => {
      render(<PasswordStrengthMeter password="" />);
      expect(screen.getByText("Use 8+ characters with a number and a capital letter")).toBeInTheDocument();
    });

    it("renders 4 bars", () => {
      const { container } = render(<PasswordStrengthMeter password="test" />);
      const bars = container.querySelectorAll("[class*='h-1.5']");
      expect(bars.length).toBe(4);
    });

    it("shows different hints for different strengths", () => {
      const { rerender } = render(<PasswordStrengthMeter password="" />);
      expect(screen.getByText("Use 8+ characters with a number and a capital letter")).toBeInTheDocument();

      rerender(<PasswordStrengthMeter password="PASSWORD1" />);
      expect(screen.getByText("Add more variety to make it stronger")).toBeInTheDocument();

      rerender(<PasswordStrengthMeter password="Password1" />);
      expect(screen.getByText("This is a solid password")).toBeInTheDocument();
    });
  });
});
