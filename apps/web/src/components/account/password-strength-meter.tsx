"use client";

export type PasswordStrength = "empty" | "weak" | "fair" | "good" | "strong";

function getPasswordStrength(password: string): {
  strength: PasswordStrength;
  hint: string;
} {
  if (!password) {
    return {
      strength: "empty",
      hint: "Use 8+ characters with a number and a capital letter",
    };
  }

  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  // Require minimum length for any strength above weak
  if (!hasMinLength) {
    return {
      strength: "weak",
      hint: "Use 8+ characters with a number and a capital letter",
    };
  }

  // Count how many of the character requirements are met
  // Required: number AND uppercase
  const meetsBasicRequirements = hasNumber && hasUppercase;

  if (!meetsBasicRequirements) {
    return {
      strength: "weak",
      hint: "Use 8+ characters with a number and a capital letter",
    };
  }

  // Count additional character variety
  const characterRequirements = [hasNumber, hasUppercase, hasLowercase, hasSpecialChar].filter(Boolean).length;

  if (characterRequirements === 2) {
    return {
      strength: "fair",
      hint: "Add more variety to make it stronger",
    };
  }
  if (characterRequirements === 3) {
    return {
      strength: "good",
      hint: "This is a solid password",
    };
  }

  return {
    strength: "strong",
    hint: "Excellent choice",
  };
}

interface PasswordStrengthMeterProps {
  password: string;
}

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const { strength, hint } = getPasswordStrength(password);

  const bars = [0, 1, 2, 3];
  const strengthLevels = ["empty", "weak", "fair", "good", "strong"];
  const strengthIndex = strengthLevels.indexOf(strength);

  const getBarColor = (barIndex: number) => {
    if (strengthIndex <= barIndex) return "bg-[#E3DDD3]";
    if (strength === "weak") return "bg-red-500";
    if (strength === "fair") return "bg-yellow-500";
    if (strength === "good") return "bg-blue-500";
    if (strength === "strong") return "bg-green-500";
    return "bg-[#E3DDD3]";
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-1.5">
        {bars.map((bar) => (
          <div
            key={bar}
            className={`flex-1 h-1.5 rounded-full transition-colors ${getBarColor(bar)}`}
          />
        ))}
      </div>
      <p className="text-xs text-[#6E6676]">{hint}</p>
    </div>
  );
}

export { getPasswordStrength };
