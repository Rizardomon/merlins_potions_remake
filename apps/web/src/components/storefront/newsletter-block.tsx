"use client";

import { useState } from "react";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export { isValidEmail };

export function NewsletterBlock() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [touched, setTouched] = useState(false);

  const invalid = touched && !isValidEmail(email);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!isValidEmail(email)) return;
    setSubmitted(true);
  }

  return (
    <section
      aria-label="Newsletter signup"
      className="bg-[var(--surface-3)] border-t border-[var(--border)] py-12 px-4 sm:px-6"
    >
      <div className="max-w-md mx-auto text-center">
        <h2 className="font-display text-2xl font-semibold text-[var(--text)] mb-2">
          Stay in the loop
        </h2>
        <p className="text-sm text-[var(--text-2)] mb-6">
          Owl-post updates on new potions and special offers.
        </p>

        {submitted ? (
          <p
            role="status"
            aria-live="polite"
            className="text-sm font-medium text-[var(--green)]"
          >
            You&apos;re on the list. Watch your inbox for owl post.
          </p>
        ) : (
          <form
            onSubmit={handleSubmit}
            noValidate
            className="flex flex-col sm:flex-row gap-2"
          >
            <div className="flex-1">
              <label htmlFor="newsletter-email" className="sr-only">
                Email address
              </label>
              <input
                id="newsletter-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched(true)}
                placeholder="your@email.com"
                aria-invalid={invalid}
                aria-describedby={invalid ? "newsletter-email-error" : undefined}
                className="w-full px-3 py-2 rounded-md border text-sm text-[var(--text)] bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-[var(--accent)] border-[var(--border)]"
              />
              {invalid && (
                <p
                  id="newsletter-email-error"
                  role="alert"
                  className="mt-1 text-xs text-[var(--red)] text-left"
                >
                  Please enter a valid email address.
                </p>
              )}
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] shrink-0"
            >
              Subscribe
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
