import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Header } from "./header";
import type { SessionCustomer } from "@merlins-potions-remake/shared";

vi.mock("@/lib/bag/provider", () => ({
  useBag: () => ({
    itemCount: 2,
    openBag: vi.fn(),
  }),
}));

const mockUseSession = vi.hoisted(() => vi.fn());
const mockUseSignOut = vi.hoisted(() => vi.fn());

vi.mock("@/hooks/use-auth", () => ({
  useSession: mockUseSession,
  useSignOut: mockUseSignOut,
}));

function renderWithQueryClient(component: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>{component}</QueryClientProvider>
  );
}

describe("Header", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("anônimo", () => {
    it("renderiza botão Sign in", () => {
      mockUseSession.mockReturnValue({
        data: { customer: null },
        isPending: false,
      });
      mockUseSignOut.mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
      });

      renderWithQueryClient(<Header />);

      expect(screen.getByText("Sign in")).toBeDefined();
      expect(screen.queryByText("Sign out")).toBeNull();
    });
  });

  describe("assinado", () => {
    it("renderiza inicial + primeiro nome + Sign out", () => {
      const customer: SessionCustomer = {
        id: "123",
        fullName: "John Doe",
        firstName: "John",
        email: "john@example.com",
      };

      mockUseSession.mockReturnValue({
        data: { customer },
        isPending: false,
      });
      mockUseSignOut.mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
      });

      renderWithQueryClient(<Header />);

      expect(screen.getByText("John")).toBeDefined();
      expect(screen.getByText("J")).toBeDefined(); // Avatar initial
      expect(screen.getByText("Sign out")).toBeDefined();
      expect(screen.queryByText("Sign in")).toBeNull();
    });
  });

  describe("Sign out", () => {
    it("dispara useSignOut", () => {
      const customer: SessionCustomer = {
        id: "123",
        fullName: "John Doe",
        firstName: "John",
        email: "john@example.com",
      };

      const mutateAsync = vi.fn().mockResolvedValue(undefined);
      mockUseSession.mockReturnValue({
        data: { customer },
        isPending: false,
      });
      mockUseSignOut.mockReturnValue({
        mutateAsync,
        isPending: false,
      });

      renderWithQueryClient(<Header />);

      const signOutButton = screen.getByText("Sign out");
      expect(signOutButton).toBeDefined();
    });

    it("desabilita botão Sign out enquanto a mutação está em andamento", () => {
      const customer: SessionCustomer = {
        id: "123",
        fullName: "John Doe",
        firstName: "John",
        email: "john@example.com",
      };

      mockUseSession.mockReturnValue({
        data: { customer },
        isPending: false,
      });
      mockUseSignOut.mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: true,
      });

      renderWithQueryClient(<Header />);

      const signOutButton = screen.getByRole("button", { name: /sign out/i });
      expect((signOutButton as HTMLButtonElement).disabled).toBe(true);
    });
  });

  describe("loading", () => {
    it("não renderiza auth section enquanto carrega", () => {
      mockUseSession.mockReturnValue({
        data: undefined,
        isPending: true,
      });
      mockUseSignOut.mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
      });

      renderWithQueryClient(<Header />);

      expect(screen.queryByText("Sign in")).toBeNull();
      expect(screen.queryByText("Sign out")).toBeNull();
    });
  });
});
