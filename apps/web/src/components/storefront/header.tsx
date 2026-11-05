"use client";

import { useBag } from "@/lib/bag/provider";

export function Header() {
  const { itemCount, openBag } = useBag();

  return (
    <header className="max-w-[1280px] mx-auto px-4 sm:px-8 py-5 flex flex-wrap items-center gap-x-8 gap-y-5">
      {/* Brand */}
      <a
        href="/"
        aria-label="Merlin's Potions — home"
        className="font-display text-[30px] leading-none text-[var(--text)] whitespace-nowrap hover:text-[var(--text)]"
      >
        Merlin&apos;s <em className="italic text-[var(--accent)]">Potions</em>
      </a>

      {/* Search */}
      <label
        htmlFor="search-stock"
        className="flex-[1_1_260px] max-w-[520px] flex items-center gap-2.5 h-[46px] px-[18px] rounded-full bg-[var(--surface)] border border-[var(--border)] focus-within:ring-2 focus-within:ring-[var(--ring)]"
      >
        <span className="sr-only">Search products</span>
        <SearchIcon />
        <input
          id="search-stock"
          type="search"
          placeholder="Search our stock"
          className="flex-1 min-w-0 border-0 outline-none bg-transparent text-[15px] text-[var(--text)] placeholder:text-[var(--text-3)]"
        />
      </label>

      <div className="ml-auto flex items-center gap-5">
        {/* Sign in — visual only */}
        <button
          type="button"
          aria-label="Sign in"
          className="text-[15px] font-medium text-[var(--text-2)] hover:text-[var(--accent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] rounded"
        >
          Sign in
        </button>

        {/* Bag */}
        <button
          type="button"
          onClick={openBag}
          aria-label={`Open bag, ${itemCount} item${itemCount !== 1 ? "s" : ""}`}
          className="flex items-center gap-2.5 h-[46px] pl-[18px] pr-2 rounded-full border border-[var(--text)] bg-[var(--text)] text-[var(--bg)] text-[15px] font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        >
          <BagIcon />
          Bag
          <span
            aria-hidden="true"
            className="min-w-[30px] h-[30px] px-2 rounded-full bg-[var(--bg)] text-[var(--text)] flex items-center justify-center font-mono text-[13px]"
          >
            {itemCount}
          </span>
        </button>
      </div>
    </header>
  );
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--text-3)" strokeWidth="1.6">
      <circle cx="7" cy="7" r="5" />
      <line x1="11" y1="11" x2="15" y2="15" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="2" y="5" width="12" height="10" rx="2" />
      <path d="M5 5V4a3 3 0 0 1 6 0v1" />
    </svg>
  );
}
