"use client";

import { useBag } from "@/lib/bag/provider";

export function AddToBagToast() {
  const { toastVisible, toastQuantity, openBag, dismissToast } = useBag();

  if (!toastVisible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-6 right-6 z-[60] flex items-center gap-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] shadow-lg px-4 py-3"
    >
      <span className="text-sm text-[var(--text)]">
        {toastQuantity} × Potion added
      </span>
      <button
        type="button"
        onClick={() => {
          dismissToast();
          openBag();
        }}
        className="text-sm font-medium text-[var(--accent)] hover:text-[var(--accent-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] rounded"
      >
        View bag
      </button>
    </div>
  );
}
