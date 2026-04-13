"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { formatRupiah, formatMonth, currentMonth } from "@/lib/format";

type Summary = { income: number; expense: number; balance: number };
type Account = { id: string; name: string; type: string; balance: string };
type MonthlyRow = { month: string; income: number; expense: number; balance: number };

const typeLabel: Record<string, string> = { cash: "Tunai", bank: "Bank", ewallet: "E-Wallet" };

export default function DashboardPage() {
  const [month, setMonth] = useState(currentMonth());
  const [summary, setSummary] = useState<Summary | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [trend, setTrend] = useState<MonthlyRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [sumRes, accRes, trendRes] = await Promise.all([
        fetch(`/api/transactions/summary?month=${month}`),
        fetch("/api/accounts"),
        fetch("/api/reports/monthly?months=6"),
      ]);
      setSummary(await sumRes.json());
      setAccounts(await accRes.json());
      setTrend(await trendRes.json());
      setLoading(false);
    }
    load();
  }, [month]);

  const totalBalance = accounts.reduce((s, a) => s + Number(a.balance), 0);
  const maxVal = trend.reduce((m, r) => Math.max(m, r.income, r.expense), 1);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Dashboard</h1>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          style={{ fontSize: 13, padding: "6px 8px", borderRadius: 6, border: "1px solid #e5e5e0" }}
        />
      </div>

      {loading ? (
        <p style={{ fontSize: 13, color: "#888" }}>Memuat...</p>
      ) : (
        <>
          {/* Ringkasan bulan */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: "1.25rem" }}>
            {[
              { label: "Pemasukan", value: summary?.income ?? 0, color: "#1D9E75" },
              { label: "Pengeluaran", value: summary?.expense ?? 0, color: "#993C1D" },
              { label: "Selisih", value: summary?.balance ?? 0, color: (summary?.balance ?? 0) >= 0 ? "#185FA5" : "#993C1D" },
            ].map((item) => (
              <div key={item.label} style={{ background: "#fff", borderRadius: 10, padding: "1rem 1.25rem" }}>
                <p style={{ margin: 0, fontSize: 12, color: "#888" }}>{item.label}</p>
                <p style={{ margin: "4px 0 0", fontWeight: 700, fontSize: 18, color: item.color }}>
                  {formatRupiah(item.value)}
                </p>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: "#aaa" }}>{formatMonth(month)}</p>
              </div>
            ))}
          </div>

          {/* Tren 6 bulan */}
          {trend.length > 0 && (
            <div style={{ background: "#fff", borderRadius: 10, padding: "1.25rem", marginBottom: "1.25rem" }}>
              <p style={{ margin: "0 0 1rem", fontWeight: 600, fontSize: 14 }}>Tren 6 Bulan Terakhir</p>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 120 }}>
                {trend.map((row) => (
                  <div key={row.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <div style={{ width: "100%", display: "flex", gap: 2, alignItems: "flex-end", height: 90 }}>
                      <div
                        title={`Pemasukan: ${formatRupiah(row.income)}`}
                        style={{
                          flex: 1,
                          background: "#1D9E75",
                          borderRadius: "3px 3px 0 0",
                          height: `${Math.round((row.income / maxVal) * 90)}px`,
                          minHeight: row.income > 0 ? 3 : 0,
                        }}
                      />
                      <div
                        title={`Pengeluaran: ${formatRupiah(row.expense)}`}
                        style={{
                          flex: 1,
                          background: "#D85A30",
                          borderRadius: "3px 3px 0 0",
                          height: `${Math.round((row.expense / maxVal) * 90)}px`,
                          minHeight: row.expense > 0 ? 3 : 0,
                        }}
                      />
                    </div>
                    <span style={{ fontSize: 10, color: "#888", whiteSpace: "nowrap" }}>
                      {row.month.slice(5)}
                    </span>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                <span style={{ fontSize: 11, color: "#888", display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ display: "inline-block", width: 10, height: 10, background: "#1D9E75", borderRadius: 2 }} /> Pemasukan
                </span>
                <span style={{ fontSize: 11, color: "#888", display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ display: "inline-block", width: 10, height: 10, background: "#D85A30", borderRadius: 2 }} /> Pengeluaran
                </span>
              </div>
            </div>
          )}

          {/* Saldo akun */}
          <div style={{ background: "#fff", borderRadius: 10, padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.875rem" }}>
              <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>Saldo Akun</p>
              <span style={{ fontWeight: 700, fontSize: 14, color: "#185FA5" }}>{formatRupiah(totalBalance)}</span>
            </div>
            {accounts.length === 0 ? (
              <p style={{ fontSize: 13, color: "#888", margin: 0 }}>
                Belum ada akun.{" "}
                <Link href="/accounts" style={{ color: "#111" }}>Tambah akun</Link>
              </p>
            ) : (
              <div style={{ display: "grid", gap: 8 }}>
                {accounts.map((acc) => (
                  <div key={acc.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 11, color: "#888", background: "#f0f0eb", borderRadius: 4, padding: "1px 6px" }}>
                        {typeLabel[acc.type] ?? acc.type}
                      </span>
                      <span style={{ fontSize: 14 }}>{acc.name}</span>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{formatRupiah(Number(acc.balance))}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
