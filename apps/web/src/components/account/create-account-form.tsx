"use client";

import { useState } from "react";
import { useSignUp } from "@/hooks/use-auth";
import { useAccountOverlay } from "@/lib/account/provider";
import { SignUpRequestSchema } from "@merlins-potions-remake/shared";
import { PasswordStrengthMeter } from "./password-strength-meter";

interface CreateAccountFormErrors {
  fullName?: string;
  email?: string;
  password?: string;
  termsAccepted?: string;
  general?: string;
}

export function CreateAccountForm() {
  const { switchView, setEmail: setOverlayEmail } = useAccountOverlay();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [newsletterOptIn, setNewsletterOptIn] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [errors, setErrors] = useState<CreateAccountFormErrors>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  const signUpMutation = useSignUp();

  const validateField = (field: string, value: string | boolean): string | undefined => {
    if (field === "fullName") {
      const trimmedName = (value as string).trim();
      if (!trimmedName) return "Required";
    } else if (field === "email") {
      const trimmedEmail = (value as string).trim();
      if (!trimmedEmail) return "Enter your email";
      try {
        SignUpRequestSchema.pick({ email: true }).parse({ email: trimmedEmail });
      } catch {
        return "Enter a valid email";
      }
    } else if (field === "password") {
      const pwd = value as string;
      if (pwd.length < 8) return "Use at least 8 characters";
    } else if (field === "termsAccepted") {
      if (!value) return "Please accept the terms to continue";
    }
    return undefined;
  };

  const handleFieldBlur = (field: string) => {
    const newTouched = new Set(touchedFields);
    newTouched.add(field);
    setTouchedFields(newTouched);

    let value: string | boolean;
    switch (field) {
      case "fullName":
        value = fullName;
        break;
      case "email":
        value = email;
        break;
      case "password":
        value = password;
        break;
      case "termsAccepted":
        value = termsAccepted;
        break;
      default:
        return;
    }

    const error = validateField(field, value);
    setErrors(prev => ({
      ...prev,
      [field]: error,
      general: undefined,
    }));
  };

  const handleFieldChange = (field: string, value: string | boolean) => {
    if (field === "fullName") {
      setFullName(value as string);
    } else if (field === "email") {
      const emailValue = value as string;
      setEmail(emailValue);
      setOverlayEmail(emailValue);
    } else if (field === "password") {
      setPassword(value as string);
    } else if (field === "newsletterOptIn") {
      setNewsletterOptIn(value as boolean);
    } else if (field === "termsAccepted") {
      setTermsAccepted(value as boolean);
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

    const fullNameError = validateField("fullName", fullName);
    const emailError = validateField("email", email);
    const passwordError = validateField("password", password);
    const termsError = validateField("termsAccepted", termsAccepted);

    if (fullNameError || emailError || passwordError || termsError) {
      setErrors({
        fullName: fullNameError,
        email: emailError,
        password: passwordError,
        termsAccepted: termsError,
      });
      return;
    }

    try {
      await signUpMutation.mutateAsync({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        newsletterOptIn,
        termsAccepted: true,
      });

      setPassword("");
      switchView("confirmation");
    } catch (error) {
      const err = error as any;
      if (err?.status === 409) {
        setErrors({
          general: "An account with this email already exists.",
          email: "Email already in use",
        });
      } else if (err?.status === 429) {
        setErrors({ general: "Too many attempts. Try again in 15 minutes." });
      } else {
        setErrors({ general: "Something went wrong. Please try again." });
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl text-[#1F1A26] mb-2">Create your account</h2>
        <p className="text-sm text-[#6E6676]">It takes less time than brewing a Sleeping Draught.</p>
      </div>

      {errors.general && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700" role="alert">
          {errors.general}
          {errors.general.includes("already exists") && (
            <button
              type="button"
              onClick={() => switchView("sign-in")}
              className="block mt-2 text-[#4B2E83] hover:text-[#3B2268] font-medium underline"
            >
              Sign in instead
            </button>
          )}
        </div>
      )}

      {/* Full name field */}
      <div>
        <label htmlFor="create-fullname" className="block text-sm font-medium text-[#1F1A26] mb-2">
          Full name
        </label>
        <input
          id="create-fullname"
          type="text"
          value={fullName}
          onChange={(e) => handleFieldChange("fullName", e.target.value)}
          onBlur={() => handleFieldBlur("fullName")}
          className={`w-full px-4 py-2 border rounded-full text-[#1F1A26] bg-[#FFFFFF] placeholder-[#6E6676] focus:outline-none focus:ring-2 focus:ring-[#4B2E83] ${
            errors.fullName ? "border-red-500" : "border-[#E3DDD3]"
          }`}
          placeholder="Your full name"
          disabled={signUpMutation.isPending}
        />
        {errors.fullName && (
          <p className="text-xs text-red-600 mt-1">{errors.fullName}</p>
        )}
      </div>

      {/* Email field */}
      <div>
        <label htmlFor="create-email" className="block text-sm font-medium text-[#1F1A26] mb-2">
          Email
        </label>
        <input
          id="create-email"
          type="email"
          value={email}
          onChange={(e) => handleFieldChange("email", e.target.value)}
          onBlur={() => handleFieldBlur("email")}
          className={`w-full px-4 py-2 border rounded-full text-[#1F1A26] bg-[#FFFFFF] placeholder-[#6E6676] focus:outline-none focus:ring-2 focus:ring-[#4B2E83] ${
            errors.email ? "border-red-500" : "border-[#E3DDD3]"
          }`}
          placeholder="your@email.com"
          disabled={signUpMutation.isPending}
        />
        {errors.email && !errors.general && (
          <p className="text-xs text-red-600 mt-1">{errors.email}</p>
        )}
      </div>

      {/* Password field */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="create-password" className="block text-sm font-medium text-[#1F1A26]">
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
          id="create-password"
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => handleFieldChange("password", e.target.value)}
          onBlur={() => handleFieldBlur("password")}
          className={`w-full px-4 py-2 border rounded-full text-[#1F1A26] bg-[#FFFFFF] placeholder-[#6E6676] focus:outline-none focus:ring-2 focus:ring-[#4B2E83] ${
            errors.password ? "border-red-500" : "border-[#E3DDD3]"
          }`}
          placeholder="Create a strong password"
          disabled={signUpMutation.isPending}
        />
        {errors.password && (
          <p className="text-xs text-red-600 mt-1">{errors.password}</p>
        )}

        {/* Strength meter */}
        <div className="mt-3">
          <PasswordStrengthMeter password={password} />
        </div>
      </div>

      {/* Newsletter opt-in */}
      <div className="flex items-center gap-3">
        <input
          id="newsletter-opt-in"
          type="checkbox"
          checked={newsletterOptIn}
          onChange={(e) => handleFieldChange("newsletterOptIn", e.target.checked)}
          className="w-4 h-4 cursor-pointer accent-[#4B2E83]"
          disabled={signUpMutation.isPending}
        />
        <label htmlFor="newsletter-opt-in" className="text-sm text-[#1F1A26] cursor-pointer">
          Send me new brews and members-only offers
        </label>
      </div>

      {/* Terms acceptance */}
      <div className="flex items-start gap-3">
        <input
          id="terms-accepted"
          type="checkbox"
          checked={termsAccepted}
          onChange={(e) => handleFieldChange("termsAccepted", e.target.checked)}
          onBlur={() => handleFieldBlur("termsAccepted")}
          className="w-4 h-4 cursor-pointer accent-[#4B2E83] mt-0.5"
          disabled={signUpMutation.isPending}
        />
        <div>
          <label htmlFor="terms-accepted" className="text-sm text-[#1F1A26] cursor-pointer block">
            I agree to the{" "}
            <a
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#4B2E83] hover:text-[#3B2268] underline font-medium"
            >
              terms
            </a>
            {" "}and{" "}
            <a
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#4B2E83] hover:text-[#3B2268] underline font-medium"
            >
              privacy policy
            </a>
          </label>
          {errors.termsAccepted && (
            <p className="text-xs text-red-600 mt-1">{errors.termsAccepted}</p>
          )}
        </div>
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={signUpMutation.isPending}
        className="w-full bg-[#4B2E83] hover:bg-[#3B2268] disabled:opacity-60 text-[#FBF9F5] font-medium py-3 rounded-full transition-colors"
      >
        {signUpMutation.isPending ? "Creating account…" : "Create account"}
      </button>

      {/* Sign in link */}
      <p className="text-center text-sm text-[#6E6676]">
        Already have an account?{" "}
        <button
          type="button"
          onClick={() => {
            setEmail("");
            switchView("sign-in");
          }}
          className="text-[#4B2E83] hover:text-[#3B2268] font-medium underline"
        >
          Sign in
        </button>
      </p>
    </form>
  );
}
