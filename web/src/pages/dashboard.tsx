import type { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { useState } from "react";

type Props = { userId: string };

export default function Dashboard({ userId }: Props) {
  const r = useRouter();
  const [loading, setLoading] = useState(false);

  async function onLogout() {
    setLoading(true);
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    setLoading(false);
    r.push("/signin");
  }

  return (
    <div style={{ maxWidth: 720, margin: "60px auto", padding: 16, fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>Dashboard</h1>
      <p style={{ color: "#666" }}>Logged in as: {userId}</p>

      <button
        onClick={onLogout}
        disabled={loading}
        style={{ marginTop: 20, padding: 12, borderRadius: 12, border: "1px solid #ddd", cursor: "pointer" }}
      >
        {loading ? "Logging out..." : "Logout"}
      </button>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const cookie = ctx.req.headers.cookie || "";
  const api = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL!;

  // 1) Try /auth/me with cookies
  const meRes = await fetch(`${api}/auth/me`, {
    method: "GET",
    headers: { cookie },
  });

  if (meRes.status !== 401) {
    if (!meRes.ok) return { redirect: { destination: "/signin", permanent: false } };
    const data = await meRes.json();
    return { props: { userId: data.userId } };
  }

  // 2) If 401, try refresh once
  const refreshRes = await fetch(`${api}/auth/refresh`, {
    method: "POST",
    headers: { cookie },
  });

  if (!refreshRes.ok) {
    return { redirect: { destination: "/signin", permanent: false } };
  }

  // Forward cookie updates back to browser (important)
  const setCookie = refreshRes.headers.get("set-cookie");
  if (setCookie) {
    ctx.res.setHeader("set-cookie", setCookie);
  }

  // 3) Retry /me after refresh
  const meRes2 = await fetch(`${api}/auth/me`, {
    method: "GET",
    headers: { cookie: ctx.req.headers.cookie || "" },
  });

  if (!meRes2.ok) return { redirect: { destination: "/signin", permanent: false } };

  const data2 = await meRes2.json();
  return { props: { userId: data2.userId } };
};
