import { NextRequest, NextResponse } from "next/server";
import { auth, requireUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { transactions, categories, accounts } from "../../../../../drizzle/schema";
import { eq, and, gte, lte, desc, ilike, or } from "drizzle-orm";

function escapeCsv(val: string | null | undefined): string {
  if (val == null) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = requireUserId(session);

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");
  const accountId = searchParams.get("accountId");
  const categoryId = searchParams.get("categoryId");
  const type = searchParams.get("type");
  const search = searchParams.get("search")?.trim() ?? "";

  const conditions = [eq(transactions.userId, userId)];

  if (month) {
    const [year, m] = month.split("-");
    conditions.push(gte(transactions.date, `${year}-${m}-01`));
    conditions.push(lte(transactions.date, `${year}-${m}-31`));
  }
  if (accountId) conditions.push(eq(transactions.accountId, accountId));
  if (categoryId) conditions.push(eq(transactions.categoryId, categoryId));
  if (type) conditions.push(eq(transactions.type, type));
  if (search) {
    conditions.push(
      or(
        ilike(transactions.merchant, `%${search}%`),
        ilike(transactions.note, `%${search}%`)
      )!
    );
  }

  const rows = await db
    .select({
      date: transactions.date,
      type: transactions.type,
      amount: transactions.amount,
      merchant: transactions.merchant,
      note: transactions.note,
      categoryName: categories.name,
      accountName: accounts.name,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .leftJoin(accounts, eq(transactions.accountId, accounts.id))
    .where(and(...conditions))
    .orderBy(desc(transactions.date));

  const header = ["Tanggal", "Tipe", "Jumlah", "Akun", "Kategori", "Merchant", "Catatan"];
  const lines = [
    header.join(","),
    ...rows.map((r) =>
      [
        escapeCsv(r.date),
        escapeCsv(r.type === "income" ? "Pemasukan" : "Pengeluaran"),
        escapeCsv(r.amount),
        escapeCsv(r.accountName),
        escapeCsv(r.categoryName),
        escapeCsv(r.merchant),
        escapeCsv(r.note),
      ].join(",")
    ),
  ];

  const filename = month ? `transaksi-${month}.csv` : "transaksi.csv";

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
