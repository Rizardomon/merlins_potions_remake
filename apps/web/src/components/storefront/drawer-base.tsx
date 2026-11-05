"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface DrawerBaseProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  "aria-label": string;
}

export function DrawerBase({
  open,
  onClose,
  children,
  "aria-label": ariaLabel,
}: DrawerBaseProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Lock body scroll while open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Focus first focusable element on open
  useEffect(() => {
    if (!open || !panelRef.current) return;
    const focusable = panelRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    focusable[0]?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      className="fixed inset-0 z-50 flex justify-end"
    >
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className="absolute inset-0 bg-[rgba(31,26,38,0.45)]"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={cn(
          "relative z-10 h-full w-full max-w-[460px] bg-[var(--surface)] shadow-[-24px_0_60px_-20px_rgba(31,26,38,0.3)] flex flex-col",
          "translate-x-0 transition-transform duration-300 motion-reduce:transition-none"
        )}
      >
        {children}
      </div>
    </div>
  );
}
