import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { transactions } from "../../../../../drizzle/schema";
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

  const [result] = await db
    .select({
      totalIncome: sql<number>`COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0)`,
      totalExpense: sql<number>`COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0)`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, session.user.id),
        gte(transactions.date, from),
        lte(transactions.date, to)
      )
    );

  return NextResponse.json({
    income: Number(result.totalIncome),
    expense: Number(result.totalExpense),
    balance: Number(result.totalIncome) - Number(result.totalExpense),
  });
}
