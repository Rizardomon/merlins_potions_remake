import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { AccountOverlayProvider } from "./provider";
import { authQueryKeys } from "@/hooks/use-auth";
import type { SessionResponse } from "@merlins-potions-remake/shared";

function TestComponent() {
  const { data } = useQuery({
    queryKey: authQueryKeys.session,
    queryFn: async () => ({ customer: null } as SessionResponse),
  });

  return <div>{data?.customer ? "Signed in" : "Anonymous"}</div>;
}

describe("AccountOverlayProvider", () => {
  it("injeta initialSession no TanStack Query", () => {
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
        <TestComponent />
      </AccountOverlayProvider>
    );

    expect(screen.getByText("Signed in")).toBeDefined();
  });

  it("injeta null customer quando nenhuma sessão inicial é passada", () => {
    render(
      <AccountOverlayProvider initialSession={{ customer: null }}>
        <TestComponent />
      </AccountOverlayProvider>
    );

    expect(screen.getByText("Anonymous")).toBeDefined();
  });

  it("compartilha o QueryClient com toda a árvore de componentes", () => {
    const initialSession: SessionResponse = {
      customer: {
        id: "123",
        fullName: "Jane Doe",
        firstName: "Jane",
        email: "jane@example.com",
      },
    };

    const { container } = render(
      <AccountOverlayProvider initialSession={initialSession}>
        <TestComponent />
      </AccountOverlayProvider>
    );

    expect(container).toBeDefined();
    expect(screen.getByText("Signed in")).toBeDefined();
  });
});
