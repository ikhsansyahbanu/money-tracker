import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f0" }}>
      <nav
        style={{
          background: "#fff",
          borderBottom: "0.5px solid #e5e5e0",
          padding: "0 1.5rem",
          display: "flex",
          alignItems: "center",
          height: 56,
          gap: 24,
        }}
      >
        <span style={{ fontWeight: 500, fontSize: 15, marginRight: 16 }}>
          Money Tracker
        </span>
        <Link href="/" style={{ fontSize: 13, color: "#888", textDecoration: "none" }}>
          Dashboard
        </Link>
        <Link href="/transactions" style={{ fontSize: 13, color: "#888", textDecoration: "none" }}>
          Transaksi
        </Link>
        <Link href="/accounts" style={{ fontSize: 13, color: "#888", textDecoration: "none" }}>
          Akun
        </Link>
        <Link href="/categories" style={{ fontSize: 13, color: "#888", textDecoration: "none" }}>
          Kategori
        </Link>
        <Link href="/budget" style={{ fontSize: 13, color: "#888", textDecoration: "none" }}>
          Budget
        </Link>
        <span style={{ marginLeft: "auto", fontSize: 13, color: "#888" }}>
          {session.user?.name}
        </span>
      </nav>
      <main style={{ maxWidth: 960, margin: "0 auto", padding: "1.5rem 1rem" }}>
        {children}
      </main>
    </div>
  );
}
