"use client";
import { useEffect, useState, useRef } from "react";
import Modal from "@/components/Modal";
import { formatRupiah, formatMonth, currentMonth } from "@/lib/format";

type Transaction = {
  id: string;
  type: "income" | "expense";
  amount: string;
  merchant: string | null;
  note: string | null;
  date: string;
  categoryId: string | null;
  accountId: string;
};

type Account = { id: string; name: string; type: string };
type Category = { id: string; name: string; type: string; icon: string | null };

const LIMIT = 30;

export default function TransactionsPage() {
  const [month, setMonth] = useState(currentMonth());
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterAccountId, setFilterAccountId] = useState("");
  const [filterCategoryId, setFilterCategoryId] = useState("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    accountId: "",
    categoryId: "",
    type: "expense",
    amount: "",
    merchant: "",
    note: "",
    date: new Date().toISOString().slice(0, 10),
  });
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function buildQuery(off = 0, q = search) {
    const params = new URLSearchParams({ month, limit: String(LIMIT), offset: String(off) });
    if (q) params.set("search", q);
    if (filterType) params.set("type", filterType);
    if (filterAccountId) params.set("accountId", filterAccountId);
    if (filterCategoryId) params.set("categoryId", filterCategoryId);
    return `/api/transactions?${params}`;
  }

  async function load(off = 0, q = search) {
    setLoading(true);
    const res = await fetch(buildQuery(off, q));
    const json = await res.json();
    setTransactions(json.data);
    setTotal(json.total);
    setOffset(off);
    setLoading(false);
  }

  async function loadMeta() {
    const [accRes, catRes] = await Promise.all([
      fetch("/api/accounts"),
      fetch("/api/categories"),
    ]);
    setAccounts(await accRes.json());
    setCategories(await catRes.json());
  }

  useEffect(() => { load(0); }, [month, filterType, filterAccountId, filterCategoryId]);
  useEffect(() => { loadMeta(); }, []);

  function handleSearchChange(val: string) {
    setSearch(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => load(0, val), 400);
  }

  function exportCsv() {
    const params = new URLSearchParams({ month, limit: "9999", offset: "0" });
    if (search) params.set("search", search);
    if (filterType) params.set("type", filterType);
    if (filterAccountId) params.set("accountId", filterAccountId);
    if (filterCategoryId) params.set("categoryId", filterCategoryId);
    window.location.href = `/api/transactions/export?${params}`;
  }

  function openAdd() {
    setForm({
      accountId: accounts[0]?.id ?? "",
      categoryId: "",
      type: "expense",
      amount: "",
      merchant: "",
      note: "",
      date: new Date().toISOString().slice(0, 10),
    });
    setError("");
    setModal("add");
  }

  function openEdit(tx: Transaction) {
    setEditing(tx);
    setForm({
      accountId: tx.accountId,
      categoryId: tx.categoryId ?? "",
      type: tx.type,
      amount: String(Number(tx.amount)),
      merchant: tx.merchant ?? "",
      note: tx.note ?? "",
      date: tx.date,
    });
    setError("");
    setModal("edit");
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const body =
        modal === "edit"
          ? { categoryId: form.categoryId || null, merchant: form.merchant || null, note: form.note || null, date: form.date }
          : {
              accountId: form.accountId,
              categoryId: form.categoryId || null,
              type: form.type,
              amount: Number(form.amount),
              merchant: form.merchant || null,
              note: form.note || null,
              date: form.date,
            };

      const res = await fetch(
        modal === "edit" ? `/api/transactions/${editing!.id}` : "/api/transactions",
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
      await load(offset);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus transaksi ini?")) return;
    await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    await load(offset);
  }

  const filteredCategories = categories.filter((c) => c.type === form.type);
  const catMap = Object.fromEntries(categories.map((c) => [c.id, c]));
  const accMap = Object.fromEntries(accounts.map((a) => [a.id, a]));
  const hasFilter = search || filterType || filterAccountId || filterCategoryId;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Transaksi</h1>
          <p style={{ fontSize: 13, color: "#888", margin: "4px 0 0" }}>{formatMonth(month)}</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="month"
            value={month}
            onChange={(e) => { setMonth(e.target.value); }}
            style={{ fontSize: 13, padding: "6px 8px", borderRadius: 6, border: "1px solid #e5e5e0" }}
          />
          <button
            onClick={exportCsv}
            style={{ background: "#fff", color: "#555", border: "1px solid #e5e5e0", borderRadius: 8, padding: "8px 14px", fontSize: 13, cursor: "pointer" }}
          >
            Export CSV
          </button>
          <button
            onClick={openAdd}
            style={{ background: "#111", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, cursor: "pointer" }}
          >
            + Tambah
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ display: "flex", gap: 8, marginBottom: "1.25rem", flexWrap: "wrap" }}>
        <input
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Cari merchant atau catatan..."
          style={{ flex: "1 1 200px", minWidth: 180, padding: "6px 10px", borderRadius: 6, border: "1px solid #e5e5e0", fontSize: 13 }}
        />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid #e5e5e0", fontSize: 13 }}
        >
          <option value="">Semua tipe</option>
          <option value="expense">Pengeluaran</option>
          <option value="income">Pemasukan</option>
        </select>
        <select
          value={filterAccountId}
          onChange={(e) => setFilterAccountId(e.target.value)}
          style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid #e5e5e0", fontSize: 13 }}
        >
          <option value="">Semua akun</option>
          {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <select
          value={filterCategoryId}
          onChange={(e) => setFilterCategoryId(e.target.value)}
          style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid #e5e5e0", fontSize: 13 }}
        >
          <option value="">Semua kategori</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </select>
        {hasFilter && (
          <button
            onClick={() => { setSearch(""); setFilterType(""); setFilterAccountId(""); setFilterCategoryId(""); }}
            style={{ fontSize: 12, padding: "6px 12px", borderRadius: 6, border: "1px solid #e5e5e0", cursor: "pointer", background: "#fff", color: "#555" }}
          >
            Reset filter
          </button>
        )}
      </div>

      {loading ? (
        <p style={{ fontSize: 13, color: "#888" }}>Memuat...</p>
      ) : transactions.length === 0 ? (
        <p style={{ fontSize: 13, color: "#888" }}>
          {hasFilter ? "Tidak ada transaksi yang sesuai filter." : "Tidak ada transaksi bulan ini."}
        </p>
      ) : (
        <>
          <div style={{ display: "grid", gap: 8 }}>
            {transactions.map((tx) => {
              const cat = tx.categoryId ? catMap[tx.categoryId] : null;
              const acc = accMap[tx.accountId];
              return (
                <div
                  key={tx.id}
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
                        background: tx.type === "income" ? "#1D9E7522" : "#D85A3022",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 17,
                      }}
                    >
                      {cat?.icon ?? (tx.type === "income" ? "💰" : "💸")}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontWeight: 500, fontSize: 14 }}>
                        {tx.merchant ?? cat?.name ?? (tx.type === "income" ? "Pemasukan" : "Pengeluaran")}
                      </p>
                      <p style={{ margin: 0, fontSize: 12, color: "#888" }}>
                        {tx.date} · {acc?.name ?? ""}
                        {cat ? ` · ${cat.name}` : ""}
                        {tx.note ? ` · ${tx.note}` : ""}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontWeight: 600, fontSize: 14, color: tx.type === "income" ? "#1D9E75" : "#993C1D" }}>
                      {tx.type === "income" ? "+" : "-"}{formatRupiah(Number(tx.amount))}
                    </span>
                    <button
                      onClick={() => openEdit(tx)}
                      style={{ fontSize: 12, background: "none", border: "1px solid #e5e5e0", borderRadius: 6, padding: "3px 8px", cursor: "pointer" }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(tx.id)}
                      style={{ fontSize: 12, background: "none", border: "1px solid #f3c5bb", borderRadius: 6, padding: "3px 8px", cursor: "pointer", color: "#993C1D" }}
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {total > LIMIT && (
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: "1.25rem" }}>
              <button
                onClick={() => load(Math.max(0, offset - LIMIT))}
                disabled={offset === 0}
                style={{ fontSize: 13, padding: "6px 14px", borderRadius: 6, border: "1px solid #e5e5e0", cursor: offset === 0 ? "not-allowed" : "pointer", background: "#fff" }}
              >
                ← Sebelumnya
              </button>
              <span style={{ fontSize: 13, color: "#888", alignSelf: "center" }}>
                {offset + 1}–{Math.min(offset + LIMIT, total)} dari {total}
              </span>
              <button
                onClick={() => load(offset + LIMIT)}
                disabled={offset + LIMIT >= total}
                style={{ fontSize: 13, padding: "6px 14px", borderRadius: 6, border: "1px solid #e5e5e0", cursor: offset + LIMIT >= total ? "not-allowed" : "pointer", background: "#fff" }}
              >
                Berikutnya →
              </button>
            </div>
          )}
        </>
      )}

      <Modal open={modal !== null} onClose={() => setModal(null)} title={modal === "add" ? "Tambah Transaksi" : "Edit Transaksi"}>
        {error && (
          <p style={{ color: "#993C1D", fontSize: 13, background: "#FAECE7", padding: "8px 12px", borderRadius: 8, marginBottom: 12 }}>
            {error}
          </p>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {modal === "add" && (
            <>
              <div>
                <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>Tipe</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {(["expense", "income"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm({ ...form, type: t, categoryId: "" })}
                      style={{
                        flex: 1,
                        padding: "7px",
                        borderRadius: 8,
                        border: "none",
                        cursor: "pointer",
                        background: form.type === t ? "#111" : "#f0f0eb",
                        color: form.type === t ? "#fff" : "#555",
                        fontWeight: form.type === t ? 600 : 400,
                        fontSize: 13,
                      }}
                    >
                      {t === "expense" ? "Pengeluaran" : "Pemasukan"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>Akun</label>
                <select
                  value={form.accountId}
                  onChange={(e) => setForm({ ...form, accountId: e.target.value })}
                  style={{ width: "100%", boxSizing: "border-box", padding: "6px 8px", borderRadius: 6, border: "1px solid #e5e5e0" }}
                >
                  {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>Jumlah (Rp)</label>
                <input
                  type="number"
                  min={1}
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="Contoh: 25000"
                  style={{ width: "100%", boxSizing: "border-box" }}
                />
              </div>
            </>
          )}
          <div>
            <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>Kategori (opsional)</label>
            <select
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              style={{ width: "100%", boxSizing: "border-box", padding: "6px 8px", borderRadius: 6, border: "1px solid #e5e5e0" }}
            >
              <option value="">Tanpa kategori</option>
              {filteredCategories.map((c) => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>Merchant / Nama (opsional)</label>
            <input
              value={form.merchant}
              onChange={(e) => setForm({ ...form, merchant: e.target.value })}
              placeholder="Contoh: Warung Makan Bu Sri"
              style={{ width: "100%", boxSizing: "border-box" }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>Catatan (opsional)</label>
            <input
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="Catatan tambahan..."
              style={{ width: "100%", boxSizing: "border-box" }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>Tanggal</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              style={{ width: "100%", boxSizing: "border-box" }}
            />
          </div>
          <button
            onClick={handleSave}
            disabled={saving || (modal === "add" && (!form.accountId || !form.amount))}
            style={{
              background: saving || (modal === "add" && (!form.accountId || !form.amount)) ? "#888" : "#111",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "10px",
              fontSize: 14,
              cursor: "pointer",
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
