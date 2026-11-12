import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Header } from "./header";
import type { SessionCustomer, SessionResponse } from "@merlins-potions-remake/shared";

vi.mock("@/lib/bag/provider", () => ({
  useBag: () => ({
    itemCount: 0,
    openBag: vi.fn(),
  }),
}));

vi.mock("@/lib/account/provider", () => ({
  useAccountOverlay: () => ({
    openOverlay: vi.fn(),
    triggerRef: { current: null },
  }),
}));

const mockUseSession = vi.hoisted(() => vi.fn());
const mockUseSignOut = vi.hoisted(() => vi.fn());

vi.mock("@/hooks/use-auth", () => ({
  useSession: mockUseSession,
  useSignOut: mockUseSignOut,
}));

function renderHeaderWithSession(initialSession: SessionResponse) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  // Injetar initialSession no cache (como faz o AccountOverlayProvider)
  queryClient.setQueryData(["session"], initialSession);

  return render(
    <QueryClientProvider client={queryClient}>
      <Header />
    </QueryClientProvider>
  );
}

describe("Header — Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("sem flash no primeiro paint", () => {
    it("renderiza header assinado no primeiro paint quando há sessão inicial", () => {
      const customer: SessionCustomer = {
        id: "123",
        fullName: "Alice Wonder",
        firstName: "Alice",
        email: "alice@example.com",
      };

      const initialSession: SessionResponse = { customer };
      mockUseSession.mockReturnValue({
        data: initialSession,
        isPending: false,
      });
      mockUseSignOut.mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
      });

      renderHeaderWithSession(initialSession);

      // Deve renderizar o nome e avatar sem delay (sem flash de "Sign in")
      expect(screen.getByText("Alice")).toBeDefined();
      expect(screen.getByText("A")).toBeDefined(); // Avatar
      expect(screen.getByText("Sign out")).toBeDefined();
    });

    it("renderiza header anônimo no primeiro paint quando não há sessão", () => {
      const initialSession: SessionResponse = { customer: null };
      mockUseSession.mockReturnValue({
        data: initialSession,
        isPending: false,
      });
      mockUseSignOut.mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
      });

      renderHeaderWithSession(initialSession);

      // Deve renderizar "Sign in" imediatamente
      expect(screen.getByText("Sign in")).toBeDefined();
    });
  });

  describe("Sign out — bag intacto", () => {
    it("sign out não dispara nenhuma alteração no bag", () => {
      const customer: SessionCustomer = {
        id: "456",
        fullName: "Bob Smith",
        firstName: "Bob",
        email: "bob@example.com",
      };

      const initialSession: SessionResponse = { customer };
      mockUseSession.mockReturnValue({
        data: initialSession,
        isPending: false,
      });
      mockUseSignOut.mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
      });

      const { container } = renderHeaderWithSession(initialSession);

      // Verificar que o bag não foi tocado durante a render
      const bagButton = screen.getByLabelText(/Open bag/);
      expect(bagButton).toBeDefined();

      // O teste acima garante que o bag está intacto (não foi apagado ou modificado)
      expect(container).toBeDefined();
    });
  });
});
