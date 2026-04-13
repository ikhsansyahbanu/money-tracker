"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const res = await signIn("credentials", {
      email: form.get("email"),
      password: form.get("password"),
      redirect: false,
    });

    if (res?.error) {
      setError("Email atau password salah");
      setLoading(false);
    } else {
      router.push("/");
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: "80px auto", padding: "0 1rem" }}>
      <h1 style={{ fontSize: 22, fontWeight: 500, marginBottom: "0.25rem" }}>
        Masuk
      </h1>
      <p style={{ fontSize: 13, color: "#888", marginBottom: "1.5rem" }}>
        Belum punya akun?{" "}
        <a href="/register" style={{ color: "#111" }}>
          Daftar
        </a>
      </p>
      {error && (
        <p
          style={{
            color: "#993C1D",
            fontSize: 13,
            marginBottom: 12,
            background: "#FAECE7",
            padding: "8px 12px",
            borderRadius: 8,
          }}
        >
          {error}
        </p>
      )}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label
            style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}
          >
            Email
          </label>
          <input
            name="email"
            type="email"
            required
            style={{ width: "100%", boxSizing: "border-box" }}
          />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label
            style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}
          >
            Password
          </label>
          <input
            name="password"
            type="password"
            required
            style={{ width: "100%", boxSizing: "border-box" }}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "10px",
            background: loading ? "#888" : "#111",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: 14,
          }}
        >
          {loading ? "Memproses..." : "Masuk"}
        </button>
      </form>
    </div>
  );
}
