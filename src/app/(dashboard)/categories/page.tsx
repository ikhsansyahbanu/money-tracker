"use client";
import { useEffect, useState } from "react";
import Modal from "@/components/Modal";

type Category = {
  id: string;
  name: string;
  type: "income" | "expense";
  icon: string | null;
  color: string | null;
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"expense" | "income">("expense");
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: "", type: "expense", icon: "", color: "#888780" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/categories");
    const data = await res.json();
    setCategories(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openAdd() {
    setForm({ name: "", type: tab, icon: "", color: "#888780" });
    setError("");
    setModal("add");
  }

  function openEdit(cat: Category) {
    setEditing(cat);
    setForm({ name: cat.name, type: cat.type, icon: cat.icon ?? "", color: cat.color ?? "#888780" });
    setError("");
    setModal("edit");
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(
        modal === "edit" ? `/api/categories/${editing!.id}` : "/api/categories",
        {
          method: modal === "edit" ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: form.name, type: form.type, icon: form.icon || null, color: form.color }),
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
    if (!confirm("Hapus kategori ini? Transaksi yang terkait tidak akan terhapus.")) return;
    await fetch(`/api/categories/${id}`, { method: "DELETE" });
    await load();
  }

  const filtered = categories.filter((c) => c.type === tab);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Kategori</h1>
        <button
          onClick={openAdd}
          style={{ background: "#111", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, cursor: "pointer" }}
        >
          + Tambah Kategori
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: "1.25rem" }}>
        {(["expense", "income"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              fontSize: 13,
              padding: "6px 16px",
              borderRadius: 20,
              border: "none",
              cursor: "pointer",
              background: tab === t ? "#111" : "#e5e5e0",
              color: tab === t ? "#fff" : "#555",
              fontWeight: tab === t ? 600 : 400,
            }}
          >
            {t === "expense" ? "Pengeluaran" : "Pemasukan"}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ fontSize: 13, color: "#888" }}>Memuat...</p>
      ) : filtered.length === 0 ? (
        <p style={{ fontSize: 13, color: "#888" }}>Belum ada kategori {tab === "expense" ? "pengeluaran" : "pemasukan"}.</p>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {filtered.map((cat) => (
            <div
              key={cat.id}
              style={{
                background: "#fff",
                borderRadius: 10,
                padding: "0.875rem 1.25rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: (cat.color ?? "#888780") + "22",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                  }}
                >
                  {cat.icon ?? "📦"}
                </div>
                <span style={{ fontWeight: 500, fontSize: 14 }}>{cat.name}</span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => openEdit(cat)}
                  style={{ fontSize: 12, background: "none", border: "1px solid #e5e5e0", borderRadius: 6, padding: "4px 10px", cursor: "pointer" }}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(cat.id)}
                  style={{ fontSize: 12, background: "none", border: "1px solid #f3c5bb", borderRadius: 6, padding: "4px 10px", cursor: "pointer", color: "#993C1D" }}
                >
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modal !== null} onClose={() => setModal(null)} title={modal === "add" ? "Tambah Kategori" : "Edit Kategori"}>
        {error && (
          <p style={{ color: "#993C1D", fontSize: 13, background: "#FAECE7", padding: "8px 12px", borderRadius: 8, marginBottom: 12 }}>
            {error}
          </p>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>Nama</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Contoh: Makan Siang"
              style={{ width: "100%", boxSizing: "border-box" }}
            />
          </div>
          {modal === "add" && (
            <div>
              <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>Tipe</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                style={{ width: "100%", boxSizing: "border-box", padding: "6px 8px", borderRadius: 6, border: "1px solid #e5e5e0" }}
              >
                <option value="expense">Pengeluaran</option>
                <option value="income">Pemasukan</option>
              </select>
            </div>
          )}
          <div>
            <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>Icon (emoji)</label>
            <input
              value={form.icon}
              onChange={(e) => setForm({ ...form, icon: e.target.value })}
              placeholder="Contoh: 🍔"
              style={{ width: "100%", boxSizing: "border-box" }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>Warna</label>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="color"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                style={{ width: 40, height: 36, padding: 2, borderRadius: 6, border: "1px solid #e5e5e0", cursor: "pointer" }}
              />
              <span style={{ fontSize: 13, color: "#555" }}>{form.color}</span>
            </div>
          </div>
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
