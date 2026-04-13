"use client";
import { useEffect, useState } from "react";
import Modal from "@/components/Modal";
import { formatRupiah, formatMonth, currentMonth } from "@/lib/format";

type BudgetRow = {
  budgetId: string;
  categoryId: string;
  categoryName: string;
  categoryIcon: string | null;
  categoryColor: string | null;
  budgetAmount: number;
  spent: number;
  percentage: number;
  isOverBudget: boolean;
};

type Category = {
  id: string;
  name: string;
  type: string;
  icon: string | null;
  color: string | null;
};

export default function BudgetPage() {
  const [month, setMonth] = useState(currentMonth());
  const [budgets, setBudgets] = useState<BudgetRow[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ categoryId: "", amount: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/budgets?month=${month}`);
    setBudgets(await res.json());
    setLoading(false);
  }

  async function loadCategories() {
    const res = await fetch("/api/categories");
    const all: Category[] = await res.json();
    setCategories(all.filter((c) => c.type === "expense"));
  }

  useEffect(() => { load(); }, [month]);
  useEffect(() => { loadCategories(); }, []);

  function openModal() {
    setForm({ categoryId: "", amount: "" });
    setError("");
    setModal(true);
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const [year, m] = month.split("-");
      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: form.categoryId,
          amount: Number(form.amount),
          month: Number(m),
          year: Number(year),
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Gagal menyimpan");
        return;
      }
      setModal(false);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus budget ini?")) return;
    await fetch(`/api/budgets/${id}`, { method: "DELETE" });
    await load();
  }

  const totalBudget = budgets.reduce((s, b) => s + b.budgetAmount, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Budget</h1>
          <p style={{ fontSize: 13, color: "#888", margin: "4px 0 0" }}>
            {formatMonth(month)}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            style={{ fontSize: 13, padding: "6px 8px", borderRadius: 6, border: "1px solid #e5e5e0" }}
          />
          <button
            onClick={openModal}
            style={{ background: "#111", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, cursor: "pointer" }}
          >
            + Set Budget
          </button>
        </div>
      </div>

      {totalBudget > 0 && (
        <div style={{ background: "#fff", borderRadius: 10, padding: "1rem 1.25rem", marginBottom: "1.25rem", display: "flex", gap: 32 }}>
          <div>
            <p style={{ margin: 0, fontSize: 12, color: "#888" }}>Total Budget</p>
            <p style={{ margin: 0, fontWeight: 600, fontSize: 16 }}>{formatRupiah(totalBudget)}</p>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 12, color: "#888" }}>Terpakai</p>
            <p style={{ margin: 0, fontWeight: 600, fontSize: 16, color: totalSpent > totalBudget ? "#993C1D" : "#1D9E75" }}>
              {formatRupiah(totalSpent)}
            </p>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 12, color: "#888" }}>Sisa</p>
            <p style={{ margin: 0, fontWeight: 600, fontSize: 16 }}>{formatRupiah(Math.max(0, totalBudget - totalSpent))}</p>
          </div>
        </div>
      )}

      {loading ? (
        <p style={{ fontSize: 13, color: "#888" }}>Memuat...</p>
      ) : budgets.length === 0 ? (
        <p style={{ fontSize: 13, color: "#888" }}>Belum ada budget untuk bulan ini.</p>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {budgets.map((b) => (
            <div key={b.budgetId} style={{ background: "#fff", borderRadius: 10, padding: "1rem 1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: (b.categoryColor ?? "#888780") + "22",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 16,
                    }}
                  >
                    {b.categoryIcon ?? "📦"}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 500, fontSize: 14 }}>{b.categoryName}</p>
                    <p style={{ margin: 0, fontSize: 12, color: "#888" }}>
                      {formatRupiah(b.spent)} / {formatRupiah(b.budgetAmount)}
                    </p>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: b.isOverBudget ? "#993C1D" : "#1D9E75",
                    }}
                  >
                    {b.percentage}%
                  </span>
                  <button
                    onClick={() => handleDelete(b.budgetId)}
                    style={{ fontSize: 12, background: "none", border: "1px solid #f3c5bb", borderRadius: 6, padding: "3px 8px", cursor: "pointer", color: "#993C1D" }}
                  >
                    Hapus
                  </button>
                </div>
              </div>
              <div style={{ background: "#f5f5f0", borderRadius: 6, height: 6, overflow: "hidden" }}>
                <div
                  style={{
                    width: `${b.percentage}%`,
                    height: "100%",
                    background: b.isOverBudget ? "#993C1D" : (b.categoryColor ?? "#1D9E75"),
                    borderRadius: 6,
                    transition: "width 0.3s",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Set Budget Kategori">
        {error && (
          <p style={{ color: "#993C1D", fontSize: 13, background: "#FAECE7", padding: "8px 12px", borderRadius: 8, marginBottom: 12 }}>
            {error}
          </p>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>Kategori</label>
            <select
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              style={{ width: "100%", boxSizing: "border-box", padding: "6px 8px", borderRadius: 6, border: "1px solid #e5e5e0" }}
            >
              <option value="">Pilih kategori...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>Batas Budget (Rp)</label>
            <input
              type="number"
              min={1}
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="Contoh: 500000"
              style={{ width: "100%", boxSizing: "border-box" }}
            />
          </div>
          <button
            onClick={handleSave}
            disabled={saving || !form.categoryId || !form.amount}
            style={{
              background: saving || !form.categoryId || !form.amount ? "#888" : "#111",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "10px",
              fontSize: 14,
              cursor: saving || !form.categoryId || !form.amount ? "not-allowed" : "pointer",
              marginTop: 4,
            }}
          >
            {saving ? "Menyimpan..." : "Simpan Budget"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
