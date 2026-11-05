import type { BagState } from "./types";

const FREE_SHIPPING_THRESHOLD_CENTS = 5000;

export function selectItemCount(state: BagState): number {
  return state.lines.reduce((sum, l) => sum + l.quantity, 0);
}

export function selectSubtotalCents(state: BagState): number {
  return state.lines.reduce((sum, l) => sum + l.product.priceCents * l.quantity, 0);
}

export function selectFreeShippingRemainingCents(state: BagState): number {
  return Math.max(0, FREE_SHIPPING_THRESHOLD_CENTS - selectSubtotalCents(state));
}
