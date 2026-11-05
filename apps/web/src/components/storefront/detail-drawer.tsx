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
    dispatch({ type: "add", payload: { product: potion, quantity } });
    setQuantity(1);
    onClose();
  }

  if (!potion) return null;

  const total = potion.priceCents * quantity;
  const potionNo = `Potion · No. ${String(potion.number).padStart(2, "0")}`;

  return (
    <DrawerBase open={open} onClose={handleClose} aria-label="Product detail">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
      {/* Hero */}
      <div
        className="relative h-[340px] flex items-center justify-center"
        style={{ backgroundColor: potion.tint }}
      >
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close"
          className="absolute top-4 right-4 w-11 h-11 rounded-full border-0 bg-[var(--surface)] flex items-center justify-center text-[var(--text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        >
          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.6"><line x1="1" y1="1" x2="13" y2="13" /><line x1="13" y1="1" x2="1" y2="13" /></svg>
        </button>
        <Image
          src={potion.image}
          alt={potion.name}
          width={260}
          height={260}
          className="max-h-[78%] max-w-[60%] w-auto h-auto object-contain drop-shadow-[0_18px_20px_rgba(31,26,38,0.2)]"
        />
      </div>

      <div className="p-8 flex flex-col gap-7">
        {/* Name + price */}
        <div className="flex flex-col gap-2">
          <span className="font-mono text-xs uppercase tracking-[0.08em] text-[var(--text-3)]">
            {potionNo}
          </span>
          <h2 className="font-display font-normal text-5xl leading-none text-[var(--text)]">
            {potion.name}
          </h2>
          <span className="font-mono text-lg font-medium text-[var(--text)]">
            {formatUSD(potion.priceCents)}
          </span>
        </div>

        {/* Use / Effect */}
        <div className="flex flex-col gap-2">
          <h3 className="font-mono text-xs font-normal uppercase tracking-[0.08em] text-[var(--text-3)]">
            Use / Effect
          </h3>
          <p className="text-[17px] leading-[1.55] text-[var(--text)]">{potion.effect}</p>
        </div>

        {/* Ingredients */}
        <div className="flex flex-col gap-3">
          <h3 className="font-mono text-xs font-normal uppercase tracking-[0.08em] text-[var(--text-3)]">
            Ingredients
          </h3>
          <ul className="flex flex-wrap gap-2" aria-label="Ingredients">
            {potion.ingredients.map((ing) => (
              <li
                key={ing}
                className="px-3.5 py-1.5 rounded-full text-sm bg-[var(--bg)] text-[var(--text)] border border-[var(--border)]"
              >
                {ing}
              </li>
            ))}
          </ul>
        </div>
      </div>
      </div>

      {/* Footer: stepper + add to bag */}
      <div className="px-8 py-5 border-t border-[var(--border)] flex items-center gap-3">
        {/* Quantity stepper */}
        <span className="sr-only">Quantity</span>
        <div className="flex items-center h-[52px] border border-[var(--border)] rounded-full bg-[var(--bg)]">
            <button
              type="button"
              onClick={handleDecrement}
              aria-label="Decrease quantity"
              disabled={quantity <= MIN_QTY}
              className="w-12 h-full flex items-center justify-center text-xl text-[var(--text)] rounded-full disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            >
              −
            </button>
            <span
              aria-live="polite"
              aria-label={`Quantity: ${quantity}`}
              className="min-w-6 text-center font-mono text-[15px] text-[var(--text)]"
            >
              {quantity}
            </span>
            <button
              type="button"
              onClick={handleIncrement}
              aria-label="Increase quantity"
              disabled={quantity >= MAX_QTY}
              className="w-12 h-full flex items-center justify-center text-xl text-[var(--text)] rounded-full disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            >
              +
            </button>
          </div>

        {/* Add to bag */}
        <button
          type="button"
          onClick={handleAddToBag}
          className="flex-1 h-[52px] rounded-full bg-[var(--accent)] text-[var(--surface)] font-semibold text-base hover:bg-[var(--accent-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] transition-colors"
        >
          Add to bag · {formatUSD(total)}
        </button>
      </div>
    </DrawerBase>
  );
}
