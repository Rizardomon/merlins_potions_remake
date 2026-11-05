"use client";

const COMPANY_LINKS = [
  "Company",
  "Contact us",
  "Shipping",
  "Returns",
  "Careers",
] as const;

const SOCIAL_LINKS = ["Facebook", "X", "Pinterest", "Tumblr"] as const;

const linkClass =
  "text-sm text-[var(--text-2)] hover:text-[var(--accent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] rounded";

export function Footer() {
  return (
    <footer className="border-t border-[var(--border)]">
      <div className="max-w-[1280px] mx-auto p-4 sm:p-8 flex flex-wrap justify-between gap-5">
        <nav aria-label="Company links">
          <ul role="list" className="flex flex-wrap gap-6">
            {COMPANY_LINKS.map((link) => (
              <li key={link}>
                <a href="#" onClick={(e) => e.preventDefault()} className={linkClass}>
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Social media links">
          <ul role="list" className="flex flex-wrap gap-6">
            {SOCIAL_LINKS.map((link) => (
              <li key={link}>
                <a href="#" onClick={(e) => e.preventDefault()} className={linkClass}>
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <p className="font-mono text-xs text-[var(--text-3)]">© 2026 Merlin&apos;s Potions</p>
      </div>
    </footer>
  );
}
