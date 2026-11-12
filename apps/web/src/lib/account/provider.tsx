"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useMemo } from "react";
import type { SessionResponse } from "@merlins-potions-remake/shared";
import { authQueryKeys } from "@/hooks/use-auth";

interface AccountOverlayProviderProps {
  children: ReactNode;
  initialSession?: SessionResponse | null;
}

export function AccountOverlayProvider({
  children,
  initialSession,
}: AccountOverlayProviderProps) {
  const queryClient = useMemo(() => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 1000 * 60 * 5,
        },
      },
    });

    // Injetar initialSession no cache para evitar flash
    if (initialSession) {
      client.setQueryData(authQueryKeys.session, initialSession);
    }

    return client;
  }, [initialSession]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
