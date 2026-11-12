"use client";

import { useState } from "react";
import { useRequestPasswordReset } from "@/hooks/use-auth";
import { useAccountOverlay } from "@/lib/account/provider";
import { SignInRequestSchema } from "@merlins-potions-remake/shared";

interface ResetRequestFormErrors {
  email?: string;
  general?: string;
}

export function ResetRequestForm() {
  const { switchView, setEmail: setOverlayEmail } = useAccountOverlay();
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<ResetRequestFormErrors>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  const resetMutation = useRequestPasswordReset();

  const validateEmail = (value: string): string | undefined => {
    const trimmedEmail = value.trim();
    if (!trimmedEmail) return "Enter your email";
    try {
      SignInRequestSchema.pick({ email: true }).parse({ email: trimmedEmail });
    } catch {
      return "Enter a valid email";
    }
    return undefined;
  };

  const handleFieldBlur = () => {
    const newTouched = new Set(touchedFields);
    newTouched.add("email");
    setTouchedFields(newTouched);

    const error = validateEmail(email);
    setErrors(prev => ({
      ...prev,
      email: error,
      general: undefined,
    }));
  };

  const handleFieldChange = (value: string) => {
    setEmail(value);
    setOverlayEmail(value);

    if (touchedFields.has("email")) {
      const error = validateEmail(value);
      setErrors(prev => ({
        ...prev,
        email: error,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailError = validateEmail(email);
    if (emailError) {
      setErrors({ email: emailError });
      return;
    }

    try {
      await resetMutation.mutateAsync({
        email: email.trim().toLowerCase(),
      });

      // Sucesso — switch para check-inbox
      switchView("check-inbox");
    } catch (error) {
      const err = error as any;
      if (err?.status === 429) {
        setErrors({ general: "Too many attempts. Try again in 15 minutes." });
      } else {
        setErrors({ general: "Something went wrong. Please try again." });
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl text-[#1F1A26] mb-2">Reset your password</h2>
        <p className="text-sm text-[#6E6676]">Enter your email to receive a password reset link.</p>
      </div>

      {errors.general && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700" role="alert">
          {errors.general}
        </div>
      )}

      {/* Email field */}
      <div>
        <label htmlFor="reset-email" className="block text-sm font-medium text-[#1F1A26] mb-2">
          Email
        </label>
        <input
          id="reset-email"
          type="email"
          value={email}
          onChange={(e) => handleFieldChange(e.target.value)}
          onBlur={handleFieldBlur}
          className={`w-full px-4 py-2 border rounded-full text-[#1F1A26] bg-[#FFFFFF] placeholder-[#6E6676] focus:outline-none focus:ring-2 focus:ring-[#4B2E83] ${
            errors.email ? "border-red-500" : "border-[#E3DDD3]"
          }`}
          placeholder="your@email.com"
          disabled={resetMutation.isPending}
        />
        {errors.email && (
          <p className="text-xs text-red-600 mt-1">{errors.email}</p>
        )}
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={resetMutation.isPending}
        className="w-full bg-[#4B2E83] hover:bg-[#3B2268] disabled:opacity-60 text-[#FBF9F5] font-medium py-3 rounded-full transition-colors"
      >
        {resetMutation.isPending ? "Sending…" : "Send reset link"}
      </button>

      {/* Back to sign-in link */}
      <p className="text-center text-sm text-[#6E6676]">
        <button
          type="button"
          onClick={() => {
            setEmail("");
            switchView("sign-in");
          }}
          className="text-[#4B2E83] hover:text-[#3B2268] font-medium underline"
        >
          Back to sign in
        </button>
      </p>
    </form>
  );
}
