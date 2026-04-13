import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { transactions, categories } from "../../../../../drizzle/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month =
    searchParams.get("month") ?? new Date().toISOString().slice(0, 7);
  const [year, m] = month.split("-");
  const from = `${year}-${m}-01`;
  const to = `${year}-${m}-31`;

  const data = await db
    .select({
      categoryId: categories.id,
      categoryName: categories.name,
      categoryIcon: categories.icon,
      categoryColor: categories.color,
      total: sql<number>`SUM(${transactions.amount})`,
    })
    .from(transactions)
    .innerJoin(categories, eq(transactions.categoryId, categories.id))
    .where(
      and(
        eq(transactions.userId, session.user.id),
        eq(transactions.type, "expense"),
        gte(transactions.date, from),
        lte(transactions.date, to)
      )
    )
    .groupBy(
      categories.id,
      categories.name,
      categories.icon,
      categories.color
    )
    .orderBy(sql`SUM(${transactions.amount}) DESC`);

  const grandTotal = data.reduce((s, r) => s + Number(r.total), 0);

  const result = data.map((row) => ({
    ...row,
    total: Number(row.total),
    percentage:
      grandTotal > 0
        ? Math.round((Number(row.total) / grandTotal) * 100)
        : 0,
  }));

  return NextResponse.json({ data: result, grandTotal });
}
