import { useState } from "react";
import { useRouter } from "next/router";
import { signIn } from "../lib/api";
import { validateEmail, validatePassword } from "../lib/validate";

export default function SignInPage() {
  const r = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);

  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const emailErr = validateEmail(email);
  const passErr = validatePassword(password);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (emailErr || passErr) {
      setErr(emailErr || passErr);
      return;
    }

    setLoading(true);
    const res = await signIn(email.trim().toLowerCase(), password);
    setLoading(false);

    if (res.ok) {
      r.push("/dashboard");
    } else {
      setErr("Invalid email or password");
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "60px auto", padding: 16, fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>Sign in</h1>
      <p style={{ color: "#666", marginBottom: 20 }}>Welcome back.</p>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <div>
          <label>Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
            autoComplete="email"
          />
          {email && emailErr && <div style={{ color: "#c00", fontSize: 13 }}>{emailErr}</div>}
        </div>

        <div>
          <label>Password</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type={show ? "text" : "password"}
              style={{ flex: 1, padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
              autoComplete="current-password"
            />
            <button type="button" onClick={() => setShow(!show)} style={{ padding: "10px 12px", borderRadius: 10 }}>
              {show ? "Hide" : "Show"}
            </button>
          </div>
          {password && passErr && <div style={{ color: "#c00", fontSize: 13 }}>{passErr}</div>}
        </div>

        {err && <div style={{ color: "#c00" }}>{err}</div>}

        <button
          disabled={loading}
          type="submit"
          style={{
            padding: 12,
            borderRadius: 12,
            border: "none",
            background: "#111",
            color: "#fff",
            cursor: "pointer",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>

        <p style={{ fontSize: 14 }}>
          No account? <a href="/signup">Create one</a>
        </p>
      </form>
    </div>
  );
}