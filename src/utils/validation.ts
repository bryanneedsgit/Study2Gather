export function validateEmail(email: string): string | null {
  const t = email.trim();
  if (!t) return "Email is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) return "Enter a valid email address.";
  return null;
}

export function validateAgeInput(raw: string): { value?: number; error?: string } {
  const t = raw.trim();
  if (!t) return { error: "Age is required." };
  const n = Number(t);
  if (!Number.isFinite(n)) return { error: "Enter a valid number." };
  const age = Math.floor(n);
  if (age < 16) return { error: "You must be at least 16." };
  if (age > 99) return { error: "Please enter a valid age." };
  return { value: age };
}

export function validateRequired(label: string, value: string): string | null {
  if (!value.trim()) return `${label} is required.`;
  return null;
}
