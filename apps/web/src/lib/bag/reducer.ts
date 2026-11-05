import type { BagState, BagAction, BagLine } from "./types";

const MIN_QTY = 1;
const MAX_QTY = 20;

function clamp(value: number): number {
  return Math.max(MIN_QTY, Math.min(MAX_QTY, value));
}

export const initialState: BagState = {
  lines: [],
  hydrated: false,
};

export function bagReducer(state: BagState, action: BagAction): BagState {
  switch (action.type) {
    case "add": {
      const { product, quantity = 1 } = action.payload;
      const existing = state.lines.find((l) => l.product.id === product.id);
      if (existing) {
        return {
          ...state,
          lines: state.lines.map((l) =>
            l.product.id === product.id
              ? { ...l, quantity: clamp(l.quantity + quantity) }
              : l
          ),
        };
      }
      const newLine: BagLine = { product, quantity: clamp(quantity) };
      return { ...state, lines: [...state.lines, newLine] };
    }

    case "setQuantity": {
      const { productId, quantity } = action.payload;
      if (quantity <= 0) {
        return { ...state, lines: state.lines.filter((l) => l.product.id !== productId) };
      }
      return {
        ...state,
        lines: state.lines.map((l) =>
          l.product.id === productId ? { ...l, quantity: clamp(quantity) } : l
        ),
      };
    }

    case "remove":
      return {
        ...state,
        lines: state.lines.filter((l) => l.product.id !== action.payload.productId),
      };

    case "clear":
      return { ...state, lines: [] };

    case "hydrate":
      return { lines: action.payload.lines, hydrated: true };

    default:
      return state;
  }
}
