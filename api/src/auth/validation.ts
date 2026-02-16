export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  if (!email) return false;
  if (email.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPassword(pw: string): boolean {
  if (!pw) return false;
  if (pw.length < 8) return false;
  if (pw.length > 72) return false;
  const hasLetter = /[A-Za-z]/.test(pw);
  const hasNumber = /\d/.test(pw);
  return hasLetter && hasNumber;
}

export function isValidName(name: string): boolean {
  if (!name) return false;
  const n = name.trim();
  return n.length >= 2 && n.length <= 60;
}