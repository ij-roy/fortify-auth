const API_URL = process.env.NEXT_PUBLIC_API_URL!;

type ApiOptions = RequestInit & {
  retry?: boolean;
};

export async function apiFetch(path: string, options: ApiOptions = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    credentials: "include",
  });

  // If access expired, try refresh once, then retry original request
  if (res.status === 401 && options.retry !== false) {
    const refreshed = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });

    if (refreshed.ok) {
      return apiFetch(path, { ...options, retry: false });
    }
  }

  return res;
}

export async function getMe() {
  const res = await apiFetch("/auth/me", { method: "GET" });
  if (!res.ok) return null;
  return res.json();
}

export async function signIn(email: string, password: string) {
  return apiFetch("/auth/signin", {
    method: "POST",
    body: JSON.stringify({ email, password }),
    retry: false,
  });
}

export async function signUp(name: string, email: string, password: string) {
  return apiFetch("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
    retry: false,
  });
}

export async function logout() {
  return apiFetch("/auth/logout", { method: "POST", retry: false });
}
