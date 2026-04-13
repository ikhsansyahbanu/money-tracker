"use client";
import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Terjadi kesalahan");
        return;
      }
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: "80px auto", padding: "0 1rem" }}>
      <h1 style={{ fontSize: 22, fontWeight: 500, marginBottom: "0.25rem" }}>Lupa Password</h1>
      <p style={{ fontSize: 13, color: "#888", marginBottom: "1.5rem" }}>
        Ingat password?{" "}
        <Link href="/login" style={{ color: "#111" }}>Masuk</Link>
      </p>

      {sent ? (
        <div
          style={{
            background: "#EAF7F2",
            border: "1px solid #A3DFCA",
            borderRadius: 10,
            padding: "1rem 1.25rem",
            fontSize: 14,
            color: "#0F6E56",
          }}
        >
          <p style={{ margin: 0, fontWeight: 600 }}>Link reset dikirim!</p>
          <p style={{ margin: "6px 0 0", fontSize: 13 }}>
            Jika email <strong>{email}</strong> terdaftar, kamu akan menerima link reset password.
            Cek juga folder spam.
          </p>
        </div>
      ) : (
        <>
          {error && (
            <p style={{ color: "#993C1D", fontSize: 13, background: "#FAECE7", padding: "8px 12px", borderRadius: 8, marginBottom: 12 }}>
              {error}
            </p>
          )}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@kamu.com"
                style={{ width: "100%", boxSizing: "border-box" }}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !email}
              style={{
                width: "100%",
                padding: "10px",
                background: loading || !email ? "#888" : "#111",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                cursor: loading || !email ? "not-allowed" : "pointer",
                fontSize: 14,
              }}
            >
              {loading ? "Mengirim..." : "Kirim Link Reset"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
