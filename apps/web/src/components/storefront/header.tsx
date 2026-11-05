"use client";

import { useBag } from "@/lib/bag/provider";

export function Header() {
  const { itemCount } = useBag();

  return (
    <header className="bg-[var(--surface)] border-b border-[var(--border)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-4 h-16 flex-wrap">
        {/* Brand */}
        <a
          href="/"
          aria-label="Merlin's Potions — home"
          className="font-display text-xl font-semibold text-[var(--text)] shrink-0 mr-auto sm:mr-0"
        >
          Merlin&apos;s <em className="not-italic text-[var(--accent)]">Potions</em>
        </a>

        {/* Search */}
        <div className="flex-1 min-w-[180px] max-w-sm order-last sm:order-none w-full sm:w-auto">
          <label htmlFor="search-stock" className="sr-only">
            Search products
          </label>
          <input
            id="search-stock"
            type="search"
            placeholder="Search our stock"
            className="w-full px-3 py-1.5 rounded-md border border-[var(--border)] bg-[var(--surface-2)] text-sm text-[var(--text)] placeholder:text-[var(--text-3)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-[var(--accent)]"
          />
        </div>

        {/* Sign in — visual only */}
        <button
          type="button"
          aria-label="Sign in"
          className="text-sm font-medium text-[var(--text-2)] hover:text-[var(--text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] rounded px-2 py-1 shrink-0"
        >
          Sign in
        </button>

        {/* Bag */}
        <button
          type="button"
          aria-label={`Open bag, ${itemCount} item${itemCount !== 1 ? "s" : ""}`}
          className="relative flex items-center gap-1.5 text-sm font-medium text-[var(--text)] bg-[var(--accent)] text-white px-3 py-1.5 rounded-md hover:bg-[var(--accent-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] shrink-0"
        >
          <BagIcon />
          Bag
          {itemCount > 0 && (
            <span
              aria-hidden="true"
              className="ml-1 bg-white text-[var(--accent)] text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center leading-none"
            >
              {itemCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}

function BagIcon() {
  return (
    <svg
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}
