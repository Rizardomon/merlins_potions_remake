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
      className="fixed left-1/2 bottom-7 -translate-x-1/2 z-[70] flex items-center gap-3.5 rounded-full bg-[var(--text)] text-[var(--bg)] px-[22px] py-3.5 text-sm shadow-[0_18px_40px_-16px_rgba(31,26,38,0.5)]"
    >
      <span className="text-sm">
        {toastQuantity} × Potion added
      </span>
      <button
        type="button"
        onClick={() => {
          dismissToast();
          openBag();
        }}
        className="text-sm font-semibold text-[var(--accent-soft)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] rounded"
      >
        View bag
      </button>
    </div>
  );
}
