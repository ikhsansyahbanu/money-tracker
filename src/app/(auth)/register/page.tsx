"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const name = form.get("name") as string;
    const email = form.get("email") as string;
    const password = form.get("password") as string;

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Gagal mendaftar");
      setLoading(false);
      return;
    }

    // Auto login setelah register
    await signIn("credentials", { email, password, redirect: false });
    router.push("/");
  }

  return (
    <div style={{ maxWidth: 400, margin: "80px auto", padding: "0 1rem" }}>
      <h1 style={{ fontSize: 22, fontWeight: 500, marginBottom: "0.25rem" }}>
        Daftar
      </h1>
      <p style={{ fontSize: 13, color: "#888", marginBottom: "1.5rem" }}>
        Sudah punya akun?{" "}
        <a href="/login" style={{ color: "#111" }}>
          Masuk
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
            Nama
          </label>
          <input
            name="name"
            type="text"
            required
            style={{ width: "100%", boxSizing: "border-box" }}
          />
        </div>
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
            minLength={8}
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
          {loading ? "Memproses..." : "Daftar"}
        </button>
      </form>
    </div>
  );
}
