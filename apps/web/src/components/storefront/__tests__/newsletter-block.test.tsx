import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { isValidEmail, NewsletterBlock } from "../newsletter-block";

describe("isValidEmail", () => {
  it("accepts valid email", () => {
    expect(isValidEmail("user@example.com")).toBe(true);
    expect(isValidEmail("a+b@sub.domain.io")).toBe(true);
  });

  it("rejects invalid email", () => {
    expect(isValidEmail("notanemail")).toBe(false);
    expect(isValidEmail("missing@")).toBe(false);
    expect(isValidEmail("@nodomain.com")).toBe(false);
    expect(isValidEmail("")).toBe(false);
  });
});

describe("NewsletterBlock", () => {
  it("renders email input and subscribe button", () => {
    render(<NewsletterBlock />);
    expect(screen.getByLabelText(/email address/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /subscribe/i })).toBeDefined();
  });

  it("shows confirmation on valid submit", async () => {
    render(<NewsletterBlock />);
    const input = screen.getByLabelText(/email address/i);
    fireEvent.change(input, { target: { value: "witch@cauldron.com" } });
    fireEvent.submit(input.closest("form")!);
    expect(
      await screen.findByText(/you're on the list/i)
    ).toBeDefined();
  });

  it("does not confirm on invalid email", () => {
    render(<NewsletterBlock />);
    const input = screen.getByLabelText(/email address/i);
    fireEvent.change(input, { target: { value: "bademail" } });
    fireEvent.blur(input);
    expect(screen.queryByText(/you're on the list/i)).toBeNull();
    expect(screen.getByRole("alert")).toBeDefined();
  });

  it("shows error on submit with invalid email", () => {
    render(<NewsletterBlock />);
    const form = document.querySelector("form")!;
    fireEvent.submit(form);
    expect(screen.getByRole("alert")).toBeDefined();
    expect(screen.queryByText(/you're on the list/i)).toBeNull();
  });
});
