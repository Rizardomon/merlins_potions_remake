"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import type { SessionResponse } from "@merlins-potions-remake/shared";
import { authQueryKeys } from "@/hooks/use-auth";
import { accountReducer, initialState } from "./reducer";
import type { AccountAction, AccountState, AccountViewType } from "./types";

interface AccountContextValue {
  state: AccountState;
  dispatch: React.Dispatch<AccountAction>;
  triggerRef: React.RefObject<HTMLButtonElement>;
  openOverlay: () => void;
  closeOverlay: () => void;
  switchView: (view: AccountViewType) => void;
  setEmail: (email: string) => void;
}

const AccountContext = createContext<AccountContextValue | null>(null);

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

  const [state, dispatch] = useReducer(accountReducer, initialState);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const openOverlay = useCallback(() => {
    dispatch({ type: "open" });
  }, []);

  const closeOverlay = useCallback(() => {
    dispatch({ type: "close" });
  }, []);

  const switchView = useCallback((view: AccountViewType) => {
    dispatch({ type: "setView", payload: view });
  }, []);

  const setEmail = useCallback((email: string) => {
    dispatch({ type: "setEmail", payload: email });
  }, []);

  const value = useMemo<AccountContextValue>(
    () => ({
      state,
      dispatch,
      triggerRef,
      openOverlay,
      closeOverlay,
      switchView,
      setEmail,
    }),
    [state, openOverlay, closeOverlay, switchView, setEmail]
  );

  return (
    <AccountContext.Provider value={value}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </AccountContext.Provider>
  );
}

export function useAccountOverlay(): AccountContextValue {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error("useAccountOverlay must be used inside AccountOverlayProvider");
  return ctx;
}
