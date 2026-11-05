"use client";

import Image from "next/image";
import { useBag } from "@/lib/bag/provider";
import { DrawerBase } from "./drawer-base";

const FREE_SHIPPING_THRESHOLD_CENTS = 5000;

function formatUSD(cents: number): string {
  return `US$ ${(cents / 100).toFixed(2)}`;
}

export function BagDrawer() {
  const { state, dispatch, subtotalCents, freeShippingRemainingCents, bagOpen, closeBag } =
    useBag();

  const progressPct = Math.min(
    100,
    ((FREE_SHIPPING_THRESHOLD_CENTS - freeShippingRemainingCents) /
      FREE_SHIPPING_THRESHOLD_CENTS) *
      100
  );

  const shippingMessage =
    freeShippingRemainingCents <= 0
      ? "Your order ships free!"
      : `You're ${formatUSD(freeShippingRemainingCents)} away from free shipping`;

  return (
    <DrawerBase open={bagOpen} onClose={closeBag} aria-label="Shopping bag">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
        <h2 className="font-display font-semibold text-lg text-[var(--text)]">Your bag</h2>
        <button
          type="button"
          onClick={closeBag}
          aria-label="Close"
          className="text-[var(--text-2)] hover:text-[var(--text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] rounded p-1"
        >
          ✕
        </button>
      </div>

      {/* Shipping progress */}
      <div className="px-5 py-3 border-b border-[var(--border)]">
        <p
          id="shipping-progress-label"
          className="text-xs text-[var(--text-2)] mb-1.5"
        >
          {shippingMessage}
        </p>
        <div
          role="progressbar"
          aria-valuenow={Math.round(progressPct)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-labelledby="shipping-progress-label"
          className="h-1.5 rounded-full bg-[var(--border)] overflow-hidden"
        >
          <div
            className="h-full rounded-full bg-[var(--accent)] transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Lines */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {state.lines.length === 0 ? (
          <p className="text-sm text-[var(--text-2)] text-center mt-8">
            Your bag is empty — the cauldron awaits.
          </p>
        ) : (
          <ul className="flex flex-col gap-4">
            {state.lines.map((line) => {
              const lineTotal = line.product.priceCents * line.quantity;
              return (
                <li
                  key={line.product.id}
                  className="flex items-start gap-3"
                >
                  {/* Image */}
                  <div
                    className="w-14 h-14 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: line.product.tint }}
                  >
                    <Image
                      src={`/products/${line.product.image}`}
                      alt={line.product.name}
                      width={44}
                      height={44}
                      className="object-contain"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text)] truncate">
                      {line.product.name}
                    </p>
                    <p className="text-sm font-semibold text-[var(--accent)] mt-0.5">
                      {formatUSD(lineTotal)}
                    </p>

                    {/* Stepper + Remove */}
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        type="button"
                        aria-label={`Decrease quantity of ${line.product.name}`}
                        onClick={() =>
                          dispatch({
                            type: "setQuantity",
                            payload: {
                              productId: line.product.id,
                              quantity: line.quantity - 1,
                            },
                          })
                        }
                        className="w-6 h-6 flex items-center justify-center rounded border border-[var(--border)] text-[var(--text-2)] hover:border-[var(--accent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                      >
                        −
                      </button>
                      <span
                        aria-live="polite"
                        aria-label={`Quantity: ${line.quantity}`}
                        className="text-sm w-5 text-center text-[var(--text)]"
                      >
                        {line.quantity}
                      </span>
                      <button
                        type="button"
                        aria-label={`Increase quantity of ${line.product.name}`}
                        onClick={() =>
                          dispatch({
                            type: "setQuantity",
                            payload: {
                              productId: line.product.id,
                              quantity: line.quantity + 1,
                            },
                          })
                        }
                        className="w-6 h-6 flex items-center justify-center rounded border border-[var(--border)] text-[var(--text-2)] hover:border-[var(--accent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                      >
                        +
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          dispatch({
                            type: "remove",
                            payload: { productId: line.product.id },
                          })
                        }
                        aria-label={`Remove ${line.product.name} from bag`}
                        className="ml-auto text-xs text-[var(--text-3)] hover:text-red-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] rounded"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Footer */}
      {state.lines.length > 0 && (
        <div className="px-5 py-4 border-t border-[var(--border)] flex flex-col gap-3">
          <div className="flex justify-between text-sm font-semibold text-[var(--text)]">
            <span>Subtotal</span>
            <span>{formatUSD(subtotalCents)}</span>
          </div>
          <button
            type="button"
            className="w-full py-2.5 rounded-md bg-[var(--accent)] text-white font-medium text-sm hover:bg-[var(--accent-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] transition-colors"
          >
            Checkout
          </button>
        </div>
      )}
    </DrawerBase>
  );
}
