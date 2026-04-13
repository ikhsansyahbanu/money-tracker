"use client";
import { useEffect, useState } from "react";
import Modal from "@/components/Modal";
import { formatRupiah } from "@/lib/format";

type Account = {
  id: string;
  name: string;
  type: "cash" | "bank" | "ewallet";
  balance: string;
};

const typeLabel: Record<string, string> = {
  cash: "Tunai",
  bank: "Bank",
  ewallet: "E-Wallet",
};

const typeColor: Record<string, string> = {
  cash: "#1D9E75",
  bank: "#185FA5",
  ewallet: "#534AB7",
};

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editing, setEditing] = useState<Account | null>(null);
  const [form, setForm] = useState({ name: "", type: "cash", balance: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/accounts");
    const data = await res.json();
    setAccounts(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openAdd() {
    setForm({ name: "", type: "cash", balance: "" });
    setError("");
    setModal("add");
  }

  function openEdit(acc: Account) {
    setEditing(acc);
    setForm({ name: acc.name, type: acc.type, balance: String(Number(acc.balance)) });
    setError("");
    setModal("edit");
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const body: Record<string, unknown> = { name: form.name, type: form.type };
      if (modal === "add") body.balance = form.balance ? Number(form.balance) : 0;

      const res = await fetch(
        modal === "edit" ? `/api/accounts/${editing!.id}` : "/api/accounts",
        {
          method: modal === "edit" ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Gagal menyimpan");
        return;
      }
      setModal(null);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus akun ini?")) return;
    await fetch(`/api/accounts/${id}`, { method: "DELETE" });
    await load();
  }

  const totalBalance = accounts.reduce((s, a) => s + Number(a.balance), 0);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Akun</h1>
          <p style={{ fontSize: 13, color: "#888", margin: "4px 0 0" }}>
            Total saldo: <strong>{formatRupiah(totalBalance)}</strong>
          </p>
        </div>
        <button
          onClick={openAdd}
          style={{ background: "#111", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, cursor: "pointer" }}
        >
          + Tambah Akun
        </button>
      </div>

      {loading ? (
        <p style={{ fontSize: 13, color: "#888" }}>Memuat...</p>
      ) : accounts.length === 0 ? (
        <p style={{ fontSize: 13, color: "#888" }}>Belum ada akun. Tambahkan akun pertama kamu.</p>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {accounts.map((acc) => (
            <div
              key={acc.id}
              style={{
                background: "#fff",
                borderRadius: 10,
                padding: "1rem 1.25rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span
                  style={{
                    background: typeColor[acc.type] + "18",
                    color: typeColor[acc.type],
                    fontSize: 11,
                    fontWeight: 600,
                    borderRadius: 6,
                    padding: "2px 8px",
                  }}
                >
                  {typeLabel[acc.type]}
                </span>
                <div>
                  <p style={{ margin: 0, fontWeight: 500, fontSize: 14 }}>{acc.name}</p>
                  <p style={{ margin: 0, fontSize: 13, color: "#555" }}>
                    {formatRupiah(Number(acc.balance))}
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => openEdit(acc)}
                  style={{ fontSize: 12, background: "none", border: "1px solid #e5e5e0", borderRadius: 6, padding: "4px 10px", cursor: "pointer" }}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(acc.id)}
                  style={{ fontSize: 12, background: "none", border: "1px solid #f3c5bb", borderRadius: 6, padding: "4px 10px", cursor: "pointer", color: "#993C1D" }}
                >
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modal !== null} onClose={() => setModal(null)} title={modal === "add" ? "Tambah Akun" : "Edit Akun"}>
        {error && (
          <p style={{ color: "#993C1D", fontSize: 13, background: "#FAECE7", padding: "8px 12px", borderRadius: 8, marginBottom: 12 }}>
            {error}
          </p>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>Nama Akun</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Contoh: BCA, GoPay"
              style={{ width: "100%", boxSizing: "border-box" }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>Tipe</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              style={{ width: "100%", boxSizing: "border-box", padding: "6px 8px", borderRadius: 6, border: "1px solid #e5e5e0" }}
            >
              <option value="cash">Tunai</option>
              <option value="bank">Bank</option>
              <option value="ewallet">E-Wallet</option>
            </select>
          </div>
          {modal === "add" && (
            <div>
              <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>Saldo Awal (opsional)</label>
              <input
                type="number"
                min={0}
                value={form.balance}
                onChange={(e) => setForm({ ...form, balance: e.target.value })}
                placeholder="0"
                style={{ width: "100%", boxSizing: "border-box" }}
              />
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !form.name}
            style={{
              background: saving || !form.name ? "#888" : "#111",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "10px",
              fontSize: 14,
              cursor: saving || !form.name ? "not-allowed" : "pointer",
              marginTop: 4,
            }}
          >
            {saving ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
