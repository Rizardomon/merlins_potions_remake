import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CheckInboxView } from "./check-inbox";

const mockSwitchView = vi.fn();

vi.mock("@/lib/account/provider", () => ({
  useAccountOverlay: vi.fn(() => ({
    email: "test@example.com",
    switchView: mockSwitchView,
  })),
}));

describe("CheckInboxView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders check inbox view with email", () => {
    render(<CheckInboxView />);
    expect(screen.getByText("Check your inbox")).toBeInTheDocument();
    expect(screen.getByText("test@example.com")).toBeInTheDocument();
  });

  it("displays 30 minute expiry information", () => {
    render(<CheckInboxView />);
    expect(screen.getByText(/Link valid for/, { exact: false })).toBeInTheDocument();
    expect(screen.getByText(/30 minutes/, { exact: false })).toBeInTheDocument();
  });

  it("has back to sign-in button", async () => {
    render(<CheckInboxView />);
    const backButton = screen.getByText("Back to sign in");
    await userEvent.click(backButton);
    expect(mockSwitchView).toHaveBeenCalledWith("sign-in");
  });

  it("has try again link that switches to reset-request", async () => {
    render(<CheckInboxView />);
    const tryAgainLink = screen.getByText("Try again");
    await userEvent.click(tryAgainLink);
    expect(mockSwitchView).toHaveBeenCalledWith("reset-request");
  });

  it("displays spam folder hint", () => {
    render(<CheckInboxView />);
    expect(screen.getByText(/spam folder/i)).toBeInTheDocument();
  });
});
