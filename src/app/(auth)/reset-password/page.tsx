"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) setError("Token tidak valid. Minta link reset baru.");
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Konfirmasi password tidak cocok");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Terjadi kesalahan");
        return;
      }
      setDone(true);
      setTimeout(() => router.push("/login"), 2500);
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
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
        <p style={{ margin: 0, fontWeight: 600 }}>Password berhasil direset!</p>
        <p style={{ margin: "6px 0 0", fontSize: 13 }}>Mengarahkan ke halaman login...</p>
      </div>
    );
  }

  return (
    <>
      {error && (
        <p style={{ color: "#993C1D", fontSize: 13, background: "#FAECE7", padding: "8px 12px", borderRadius: 8, marginBottom: 12 }}>
          {error}
        </p>
      )}
      {token && (
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>
              Password Baru
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 8 karakter"
              style={{ width: "100%", boxSizing: "border-box" }}
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>
              Konfirmasi Password
            </label>
            <input
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Ulangi password baru"
              style={{ width: "100%", boxSizing: "border-box" }}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !password || !confirm}
            style={{
              width: "100%",
              padding: "10px",
              background: loading || !password || !confirm ? "#888" : "#111",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor: loading || !password || !confirm ? "not-allowed" : "pointer",
              fontSize: 14,
            }}
          >
            {loading ? "Menyimpan..." : "Reset Password"}
          </button>
        </form>
      )}
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div style={{ maxWidth: 400, margin: "80px auto", padding: "0 1rem" }}>
      <h1 style={{ fontSize: 22, fontWeight: 500, marginBottom: "0.25rem" }}>Reset Password</h1>
      <p style={{ fontSize: 13, color: "#888", marginBottom: "1.5rem" }}>
        Masukkan password baru kamu.{" "}
        <Link href="/login" style={{ color: "#111" }}>Kembali ke login</Link>
      </p>
      <Suspense fallback={<p style={{ fontSize: 13, color: "#888" }}>Memuat...</p>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
