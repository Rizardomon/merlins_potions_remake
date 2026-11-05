"use client";

import { useState } from "react";
import Image from "next/image";
import type { Potion } from "@merlins-potions-remake/shared";
import { useBag } from "@/lib/bag/provider";
import { DrawerBase } from "./drawer-base";

const MIN_QTY = 1;
const MAX_QTY = 20;

function formatUSD(cents: number): string {
  return `US$ ${(cents / 100).toFixed(2)}`;
}

interface DetailDrawerProps {
  open: boolean;
  onClose: () => void;
  potion: Potion | null;
}

export function DetailDrawer({ open, onClose, potion }: DetailDrawerProps) {
  const { dispatch } = useBag();
  const [quantity, setQuantity] = useState(1);

  function handleClose() {
    setQuantity(1);
    onClose();
  }

  function handleDecrement() {
    setQuantity((q) => Math.max(MIN_QTY, q - 1));
  }

  function handleIncrement() {
    setQuantity((q) => Math.min(MAX_QTY, q + 1));
  }

  function handleAddToBag() {
    if (!potion) return;
    dispatch({ type: "add", payload: { potion, quantity } });
    setQuantity(1);
    onClose();
  }

  if (!potion) return null;

  const total = potion.priceCents * quantity;
  const potionNo = `Potion · No. ${String(potion.number).padStart(2, "0")}`;

  return (
    <DrawerBase open={open} onClose={handleClose} aria-label="Product detail">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
        <span className="text-xs font-mono text-[var(--text-3)]">{potionNo}</span>
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close"
          className="text-[var(--text-2)] hover:text-[var(--text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] rounded p-1"
        >
          ✕
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-5">
        {/* Image */}
        <div
          className="w-full rounded-xl flex items-center justify-center py-10"
          style={{ backgroundColor: potion.tint }}
        >
          <Image
            src={`/products/${potion.image}`}
            alt={potion.name}
            width={160}
            height={160}
            className="object-contain drop-shadow-xl"
          />
        </div>

        {/* Name + price */}
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-display font-bold text-xl text-[var(--text)] leading-tight">
            {potion.name}
          </h2>
          <span className="text-lg font-semibold text-[var(--accent)] shrink-0">
            {formatUSD(potion.priceCents)}
          </span>
        </div>

        {/* Use / Effect */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-3)] mb-1">
            Use / Effect
          </h3>
          <p className="text-sm text-[var(--text-2)] leading-relaxed">{potion.effect}</p>
        </div>

        {/* Ingredients */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-3)] mb-2">
            Ingredients
          </h3>
          <ul className="flex flex-wrap gap-2" aria-label="Ingredients">
            {potion.ingredients.map((ing) => (
              <li
                key={ing}
                className="px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--surface-2)] text-[var(--text-2)] border border-[var(--border)]"
              >
                {ing}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Footer: stepper + add to bag */}
      <div className="px-5 py-4 border-t border-[var(--border)] flex flex-col gap-3">
        {/* Quantity stepper */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-[var(--text-2)]">Quantity</span>
          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={handleDecrement}
              aria-label="Decrease quantity"
              disabled={quantity <= MIN_QTY}
              className="w-8 h-8 flex items-center justify-center rounded border border-[var(--border)] text-[var(--text-2)] hover:border-[var(--accent)] disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            >
              −
            </button>
            <span
              aria-live="polite"
              aria-label={`Quantity: ${quantity}`}
              className="w-8 text-center text-sm font-medium text-[var(--text)]"
            >
              {quantity}
            </span>
            <button
              type="button"
              onClick={handleIncrement}
              aria-label="Increase quantity"
              disabled={quantity >= MAX_QTY}
              className="w-8 h-8 flex items-center justify-center rounded border border-[var(--border)] text-[var(--text-2)] hover:border-[var(--accent)] disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            >
              +
            </button>
          </div>
        </div>

        {/* Add to bag */}
        <button
          type="button"
          onClick={handleAddToBag}
          className="w-full py-3 rounded-md bg-[var(--accent)] text-white font-semibold text-sm hover:bg-[var(--accent-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] transition-colors"
        >
          Add to bag · {formatUSD(total)}
        </button>
      </div>
    </DrawerBase>
  );
}
