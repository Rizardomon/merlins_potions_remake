"use client";

import { useState, useEffect } from "react";
import { useSignIn } from "@/hooks/use-auth";
import { useAccountOverlay } from "@/lib/account/provider";
import { SignInRequestSchema } from "@merlins-potions-remake/shared";

interface SignInFormErrors {
  email?: string;
  password?: string;
  general?: string;
}

export function SignInForm() {
  const { switchView, setEmail: setOverlayEmail } = useAccountOverlay();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [errors, setErrors] = useState<SignInFormErrors>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  const signInMutation = useSignIn();

  const validateField = (field: string, value: string): string | undefined => {
    if (field === "email") {
      const trimmedEmail = value.trim();
      if (!trimmedEmail) return "Enter your email";
      try {
        SignInRequestSchema.pick({ email: true }).parse({ email: trimmedEmail });
      } catch {
        return "Enter a valid email";
      }
    } else if (field === "password") {
      if (!value) return "Enter your password";
    }
    return undefined;
  };

  const handleFieldBlur = (field: string) => {
    const newTouched = new Set(touchedFields);
    newTouched.add(field);
    setTouchedFields(newTouched);

    const error = validateField(field, field === "email" ? email : password);
    setErrors(prev => ({
      ...prev,
      [field]: error,
      general: undefined,
    }));
  };

  const handleFieldChange = (field: string, value: string) => {
    if (field === "email") {
      setEmail(value);
      setOverlayEmail(value);
    } else if (field === "password") {
      setPassword(value);
    }

    if (touchedFields.has(field)) {
      const error = validateField(field, value);
      setErrors(prev => ({
        ...prev,
        [field]: error,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailError = validateField("email", email);
    const passwordError = validateField("password", password);

    if (emailError || passwordError) {
      setErrors({
        email: emailError,
        password: passwordError,
      });
      return;
    }

    try {
      await signInMutation.mutateAsync({
        email: email.trim().toLowerCase(),
        password,
        keepSignedIn,
      });

      setPassword("");
      switchView("confirmation");
    } catch (error) {
      const err = error as any;
      if (err?.status === 429) {
        setErrors({ general: "Too many attempts. Try again in 15 minutes." });
      } else if (err?.status === 401) {
        setErrors({ general: "Email or password is incorrect." });
      } else {
        setErrors({ general: "Something went wrong. Please try again." });
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl text-[#1F1A26] mb-2">Welcome back</h2>
        <p className="text-sm text-[#6E6676]">Sign in to pick up where you left off.</p>
      </div>

      {errors.general && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700" role="alert">
          {errors.general}
        </div>
      )}

      {/* Email field */}
      <div>
        <label htmlFor="sign-in-email" className="block text-sm font-medium text-[#1F1A26] mb-2">
          Email
        </label>
        <input
          id="sign-in-email"
          type="email"
          value={email}
          onChange={(e) => handleFieldChange("email", e.target.value)}
          onBlur={() => handleFieldBlur("email")}
          className={`w-full px-4 py-2 border rounded-full text-[#1F1A26] bg-[#FFFFFF] placeholder-[#6E6676] focus:outline-none focus:ring-2 focus:ring-[#4B2E83] ${
            errors.email ? "border-red-500" : "border-[#E3DDD3]"
          }`}
          placeholder="your@email.com"
          disabled={signInMutation.isPending}
        />
        {errors.email && (
          <p className="text-xs text-red-600 mt-1">{errors.email}</p>
        )}
      </div>

      {/* Password field */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="sign-in-password" className="block text-sm font-medium text-[#1F1A26]">
            Password
          </label>
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-xs text-[#4B2E83] hover:text-[#3B2268] font-medium"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
        <input
          id="sign-in-password"
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => handleFieldChange("password", e.target.value)}
          onBlur={() => handleFieldBlur("password")}
          className={`w-full px-4 py-2 border rounded-full text-[#1F1A26] bg-[#FFFFFF] placeholder-[#6E6676] focus:outline-none focus:ring-2 focus:ring-[#4B2E83] ${
            errors.password ? "border-red-500" : "border-[#E3DDD3]"
          }`}
          placeholder="Enter your password"
          disabled={signInMutation.isPending}
        />
        {errors.password && (
          <p className="text-xs text-red-600 mt-1">{errors.password}</p>
        )}
      </div>

      {/* Forgot password link */}
      <div className="text-right">
        <button
          type="button"
          onClick={() => switchView("reset-request")}
          className="text-xs text-[#4B2E83] hover:text-[#3B2268] font-medium underline"
        >
          Forgot password?
        </button>
      </div>

      {/* Keep signed in checkbox */}
      <div className="flex items-center gap-3">
        <input
          id="keep-signed-in"
          type="checkbox"
          checked={keepSignedIn}
          onChange={(e) => setKeepSignedIn(e.target.checked)}
          className="w-4 h-4 cursor-pointer accent-[#4B2E83]"
          disabled={signInMutation.isPending}
        />
        <label htmlFor="keep-signed-in" className="text-sm text-[#1F1A26] cursor-pointer">
          Keep me signed in
        </label>
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={signInMutation.isPending}
        className="w-full bg-[#4B2E83] hover:bg-[#3B2268] disabled:opacity-60 text-[#FBF9F5] font-medium py-3 rounded-full transition-colors"
      >
        {signInMutation.isPending ? "Signing in…" : "Sign in"}
      </button>

      {/* Sign up link */}
      <p className="text-center text-sm text-[#6E6676]">
        New here?{" "}
        <button
          type="button"
          onClick={() => {
            setEmail("");
            switchView("create");
          }}
          className="text-[#4B2E83] hover:text-[#3B2268] font-medium underline"
        >
          Create an account
        </button>
      </p>
    </form>
  );
}
