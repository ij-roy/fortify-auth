export function validateEmail(email: string) {
  const e = email.trim().toLowerCase();
  if (!e) return "Email is required";
  if (e.length > 254) return "Email is too long";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+\.[^\s@]+$/.test(e) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
    return "Enter a valid email";
  return null;
}

export function validatePassword(pw: string) {
  if (!pw) return "Password is required";
  if (pw.length < 8) return "Minimum 8 characters";
  if (pw.length > 72) return "Maximum 72 characters";
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return "Use letters + numbers";
  return null;
}

export function validateName(name: string) {
  const n = name.trim();
  if (!n) return "Name is required";
  if (n.length < 2) return "Too short";
  if (n.length > 60) return "Too long";
  return null;
}
