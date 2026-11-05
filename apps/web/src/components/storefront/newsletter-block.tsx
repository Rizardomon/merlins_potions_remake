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
      className="max-w-[1280px] mx-auto w-full px-4 sm:px-8 pb-16"
    >
      <div className="bg-[var(--text)] text-[var(--bg)] rounded-[28px] p-[clamp(32px,5vw,64px)] grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-8 items-center">
        <div className="flex flex-col gap-3">
          <h2 className="font-display font-normal text-[clamp(36px,4vw,52px)] leading-none">
            Sign up for our <em className="italic text-[var(--accent-soft)]">newsletter</em>
          </h2>
          <p className="text-base text-[#cfc8d6]">
            Exclusive discounts, new brews and seasonal restocks.
          </p>
        </div>

        {submitted ? (
          <p
            role="status"
            aria-live="polite"
            className="text-[17px] text-[var(--bg)]"
          >
            You&apos;re on the list. Watch your inbox for owl post.
          </p>
        ) : (
          <form
            onSubmit={handleSubmit}
            noValidate
            className="flex flex-wrap gap-2.5"
          >
            <div className="flex-[1_1_220px]">
              <label htmlFor="newsletter-email" className="sr-only">
                Email address
              </label>
              <input
                id="newsletter-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched(true)}
                placeholder="Enter your email"
                aria-invalid={invalid}
                aria-describedby={invalid ? "newsletter-email-error" : undefined}
                className="w-full h-[52px] px-[22px] rounded-full border border-[var(--text-2)] bg-[#2a2432] text-[15px] text-[var(--bg)] placeholder:text-[var(--text-3)] outline-none focus:ring-2 focus:ring-[var(--accent-soft)]"
              />
              {invalid && (
                <p
                  id="newsletter-email-error"
                  role="alert"
                  className="mt-1.5 pl-[22px] text-xs text-[#f3b4ae] text-left"
                >
                  Please enter a valid email address.
                </p>
              )}
            </div>
            <button
              type="submit"
              className="h-[52px] px-7 rounded-full bg-[var(--bg)] text-[var(--text)] text-[15px] font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-soft)] shrink-0"
            >
              Subscribe
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
