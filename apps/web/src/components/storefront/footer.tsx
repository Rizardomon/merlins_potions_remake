const COMPANY_LINKS = [
  "Company",
  "Contact us",
  "Shipping",
  "Returns",
  "Careers",
] as const;

const SOCIAL_LINKS = ["Facebook", "X", "Pinterest", "Tumblr"] as const;

export function Footer() {
  return (
    <footer className="bg-[var(--text)] text-[var(--bg)] py-10 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row gap-8 justify-between">
        {/* Brand + copyright */}
        <div className="shrink-0">
          <p className="font-display text-lg font-semibold mb-1">
            Merlin&apos;s <em className="not-italic text-[var(--accent-soft)]">Potions</em>
          </p>
          <p className="text-sm opacity-50">© 2026 Merlin&apos;s Potions</p>
        </div>

        {/* Company links */}
        <nav aria-label="Company links">
          <ul role="list" className="flex flex-col gap-2">
            {COMPANY_LINKS.map((link) => (
              <li key={link}>
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="text-sm opacity-70 hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-soft)] rounded"
                >
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Social links */}
        <nav aria-label="Social media links">
          <ul role="list" className="flex flex-col gap-2">
            {SOCIAL_LINKS.map((link) => (
              <li key={link}>
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="text-sm opacity-70 hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-soft)] rounded"
                >
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
