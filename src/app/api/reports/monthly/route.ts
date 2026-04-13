import { NextRequest, NextResponse } from "next/server";
import { auth, requireUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { transactions } from "../../../../../drizzle/schema";
import { eq, and, gte, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = requireUserId(session);

  const { searchParams } = new URL(req.url);
  const months = parseInt(searchParams.get("months") ?? "6");

  const from = new Date();
  from.setMonth(from.getMonth() - (months - 1));
  const fromStr = `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, "0")}-01`;

  const data = await db
    .select({
      month: sql<string>`TO_CHAR(date, 'YYYY-MM')`,
      income: sql<number>`COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0)`,
      expense: sql<number>`COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0)`,
    })
    .from(transactions)
    .where(and(eq(transactions.userId, userId), gte(transactions.date, fromStr)))
    .groupBy(sql`TO_CHAR(date, 'YYYY-MM')`)
    .orderBy(sql`TO_CHAR(date, 'YYYY-MM') ASC`);

  return NextResponse.json(
    data.map((row) => ({
      month: row.month,
      income: Number(row.income),
      expense: Number(row.expense),
      balance: Number(row.income) - Number(row.expense),
    }))
  );
}
