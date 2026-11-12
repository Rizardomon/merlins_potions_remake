import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useQuery } from "@tanstack/react-query";
import { AccountOverlayProvider, useAccountOverlay } from "./provider";
import { authQueryKeys } from "@/hooks/use-auth";
import type { SessionResponse } from "@merlins-potions-remake/shared";

function TestSessionComponent() {
  const { data } = useQuery({
    queryKey: authQueryKeys.session,
    queryFn: async () => ({ customer: null } as SessionResponse),
  });

  return <div>{data?.customer ? "Signed in" : "Anonymous"}</div>;
}

function TestOverlayComponent() {
  const { state, openOverlay, closeOverlay, switchView, setEmail } = useAccountOverlay();

  return (
    <div>
      <div data-testid="overlay-open">{state.overlayOpen ? "open" : "closed"}</div>
      <div data-testid="active-view">{state.activeView}</div>
      <div data-testid="email">{state.email}</div>
      <button onClick={openOverlay} data-testid="open-btn">
        Open
      </button>
      <button onClick={closeOverlay} data-testid="close-btn">
        Close
      </button>
      <button onClick={() => switchView("create")} data-testid="switch-view-btn">
        Switch
      </button>
      <button onClick={() => setEmail("test@example.com")} data-testid="set-email-btn">
        Set Email
      </button>
    </div>
  );
}

describe("AccountOverlayProvider", () => {
  describe("TanStack Query integration", () => {
    it("injects initialSession into TanStack Query", () => {
      const initialSession: SessionResponse = {
        customer: {
          id: "123",
          fullName: "John Doe",
          firstName: "John",
          email: "john@example.com",
        },
      };

      render(
        <AccountOverlayProvider initialSession={initialSession}>
          <TestSessionComponent />
        </AccountOverlayProvider>
      );

      expect(screen.getByText("Signed in")).toBeDefined();
    });

    it("injects null customer when no initial session is passed", () => {
      render(
        <AccountOverlayProvider initialSession={{ customer: null }}>
          <TestSessionComponent />
        </AccountOverlayProvider>
      );

      expect(screen.getByText("Anonymous")).toBeDefined();
    });
  });

  describe("Overlay state management", () => {
    it("initializes with overlay closed and sign-in view", () => {
      render(
        <AccountOverlayProvider initialSession={{ customer: null }}>
          <TestOverlayComponent />
        </AccountOverlayProvider>
      );

      expect(screen.getByTestId("overlay-open").textContent).toBe("closed");
      expect(screen.getByTestId("active-view").textContent).toBe("sign-in");
    });

    it("opens and closes overlay", () => {
      render(
        <AccountOverlayProvider initialSession={{ customer: null }}>
          <TestOverlayComponent />
        </AccountOverlayProvider>
      );

      const openBtn = screen.getByTestId("open-btn");
      fireEvent.click(openBtn);
      expect(screen.getByTestId("overlay-open").textContent).toBe("open");

      const closeBtn = screen.getByTestId("close-btn");
      fireEvent.click(closeBtn);
      expect(screen.getByTestId("overlay-open").textContent).toBe("closed");
    });

    it("switches view", () => {
      render(
        <AccountOverlayProvider initialSession={{ customer: null }}>
          <TestOverlayComponent />
        </AccountOverlayProvider>
      );

      expect(screen.getByTestId("active-view").textContent).toBe("sign-in");

      const switchBtn = screen.getByTestId("switch-view-btn");
      fireEvent.click(switchBtn);
      expect(screen.getByTestId("active-view").textContent).toBe("create");
    });

    it("sets email", () => {
      render(
        <AccountOverlayProvider initialSession={{ customer: null }}>
          <TestOverlayComponent />
        </AccountOverlayProvider>
      );

      expect(screen.getByTestId("email").textContent).toBe("");

      const setEmailBtn = screen.getByTestId("set-email-btn");
      fireEvent.click(setEmailBtn);
      expect(screen.getByTestId("email").textContent).toBe("test@example.com");
    });

    it("preserves email when switching views", () => {
      render(
        <AccountOverlayProvider initialSession={{ customer: null }}>
          <TestOverlayComponent />
        </AccountOverlayProvider>
      );

      fireEvent.click(screen.getByTestId("set-email-btn"));
      expect(screen.getByTestId("email").textContent).toBe("test@example.com");

      fireEvent.click(screen.getByTestId("switch-view-btn"));
      expect(screen.getByTestId("email").textContent).toBe("test@example.com");
    });
  });
});
