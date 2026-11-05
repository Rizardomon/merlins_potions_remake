"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { bagReducer, initialState } from "./reducer";
import { loadFromStorage, rehydrateLines, saveToStorage } from "./storage";
import {
  selectFreeShippingRemainingCents,
  selectItemCount,
  selectSubtotalCents,
} from "./selectors";
import type { BagAction, BagState } from "./types";
import type { Potion } from "@merlins-potions-remake/shared";

interface BagContextValue {
  state: BagState;
  dispatch: React.Dispatch<BagAction>;
  itemCount: number;
  subtotalCents: number;
  freeShippingRemainingCents: number;
  bagOpen: boolean;
  openBag: () => void;
  closeBag: () => void;
  toastVisible: boolean;
  toastQuantity: number;
  dismissToast: () => void;
}

const BagContext = createContext<BagContextValue | null>(null);

interface BagProviderProps {
  children: ReactNode;
  catalog: Potion[];
}

export function BagProvider({ children, catalog }: BagProviderProps) {
  const [state, dispatch] = useReducer(bagReducer, initialState);
  const [bagOpen, setBagOpen] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastQuantity, setToastQuantity] = useState(0);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hydrate once client-side — avoids SSR/localStorage mismatch
  // catalog is captured from the closure at mount time (expected to be stable)
  useEffect(() => {
    const persisted = loadFromStorage();
    const lines = persisted ? rehydrateLines(persisted, catalog) : [];
    dispatch({ type: "hydrate", payload: { lines } });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist after every state change post-hydration
  useEffect(() => {
    if (!state.hydrated) return;
    saveToStorage(state.lines);
  }, [state.lines, state.hydrated]);

  const enhancedDispatch = useCallback(
    (action: BagAction) => {
      dispatch(action);
      if (action.type === "add") {
        const qty = action.payload.quantity ?? 1;
        setToastQuantity(qty);
        setToastVisible(true);
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        toastTimerRef.current = setTimeout(() => setToastVisible(false), 2500);
      }
    },
    []
  );

  const openBag = useCallback(() => {
    setBagOpen(true);
    setToastVisible(false);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
  }, []);

  const closeBag = useCallback(() => setBagOpen(false), []);
  const dismissToast = useCallback(() => {
    setToastVisible(false);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
  }, []);

  const itemCount = useMemo(() => selectItemCount(state), [state]);
  const subtotalCents = useMemo(() => selectSubtotalCents(state), [state]);
  const freeShippingRemainingCents = useMemo(
    () => selectFreeShippingRemainingCents(state),
    [state]
  );

  const value = useMemo<BagContextValue>(
    () => ({
      state,
      dispatch: enhancedDispatch,
      itemCount,
      subtotalCents,
      freeShippingRemainingCents,
      bagOpen,
      openBag,
      closeBag,
      toastVisible,
      toastQuantity,
      dismissToast,
    }),
    [
      state,
      enhancedDispatch,
      itemCount,
      subtotalCents,
      freeShippingRemainingCents,
      bagOpen,
      openBag,
      closeBag,
      toastVisible,
      toastQuantity,
      dismissToast,
    ]
  );

  return <BagContext.Provider value={value}>{children}</BagContext.Provider>;
}

export function useBag(): BagContextValue {
  const ctx = useContext(BagContext);
  if (!ctx) throw new Error("useBag must be used inside BagProvider");
  return ctx;
}
