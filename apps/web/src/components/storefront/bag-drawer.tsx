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
      <div className="flex items-center justify-between px-7 py-6 border-b border-[var(--border)]">
        <h2 className="font-display font-normal text-[34px] leading-none text-[var(--text)]">Your bag</h2>
        <button
          type="button"
          onClick={closeBag}
          aria-label="Close"
          className="w-11 h-11 shrink-0 rounded-full border border-[var(--border)] bg-[var(--surface)] flex items-center justify-center text-[var(--text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        >
          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.6"><line x1="1" y1="1" x2="13" y2="13" /><line x1="13" y1="1" x2="1" y2="13" /></svg>
        </button>
      </div>

      {/* Shipping progress */}
      <div className="px-7 py-4 border-b border-[var(--border)]">
        <p
          id="shipping-progress-label"
          className="text-sm text-[var(--text-2)] mb-2.5"
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
      <div className="flex-1 overflow-y-auto px-7 py-2">
        {state.lines.length === 0 ? (
          <p className="text-[var(--text-2)] text-center my-12">
            Your bag is empty — the cauldron awaits.
          </p>
        ) : (
          <ul className="flex flex-col">
            {state.lines.map((line) => {
              const lineTotal = line.product.priceCents * line.quantity;
              return (
                <li
                  key={line.product.id}
                  className="flex items-center gap-4 py-4 border-b border-[var(--border)]"
                >
                  {/* Image */}
                  <div
                    className="w-[72px] h-[72px] rounded-[14px] flex items-center justify-center shrink-0"
                    style={{ backgroundColor: line.product.tint }}
                  >
                    <Image
                      src={line.product.image}
                      alt={line.product.name}
                      width={56}
                      height={56}
                      className="max-h-[78%] max-w-[78%] w-auto h-auto object-contain"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 flex flex-col gap-2">
                    <div className="flex justify-between gap-2">
                      <p className="font-display text-[22px] leading-[1.1] text-[var(--text)] truncate">
                        {line.product.name}
                      </p>
                      <p className="font-mono text-sm text-[var(--text)] whitespace-nowrap">
                        {formatUSD(lineTotal)}
                      </p>
                    </div>

                    {/* Stepper + Remove */}
                    <div className="flex items-center">
                      <div className="flex items-center h-[34px] border border-[var(--border)] rounded-full">
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
                        className="w-[34px] h-full flex items-center justify-center text-[var(--text)] rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                      >
                        −
                      </button>
                      <span
                        aria-live="polite"
                        aria-label={`Quantity: ${line.quantity}`}
                        className="min-w-[18px] text-center font-mono text-[13px] text-[var(--text)]"
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
                        className="w-[34px] h-full flex items-center justify-center text-[var(--text)] rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                      >
                        +
                      </button>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          dispatch({
                            type: "remove",
                            payload: { productId: line.product.id },
                          })
                        }
                        aria-label={`Remove ${line.product.name} from bag`}
                        className="ml-auto text-[13px] text-[var(--text-2)] underline hover:text-[var(--text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] rounded"
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
        <div className="px-7 py-5 border-t border-[var(--border)] flex flex-col gap-3.5">
          <div className="flex justify-between text-base text-[var(--text)]">
            <span>Subtotal</span>
            <span className="font-mono font-medium">{formatUSD(subtotalCents)}</span>
          </div>
          <button
            type="button"
            className="w-full h-[52px] rounded-full bg-[var(--accent)] text-[var(--surface)] font-semibold text-base hover:bg-[var(--accent-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] transition-colors"
          >
            Checkout
          </button>
        </div>
      )}
    </DrawerBase>
  );
}
