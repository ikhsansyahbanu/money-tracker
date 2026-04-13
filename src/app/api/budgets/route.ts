import { NextRequest, NextResponse } from "next/server";
import { auth, requireUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { budgets, categories } from "../../../../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = requireUserId(session);

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month") ?? new Date().toISOString().slice(0, 7);
  const [year, m] = month.split("-");

  const data = await db
    .select({
      budgetId: budgets.id,
      categoryId: budgets.categoryId,
      categoryName: categories.name,
      categoryIcon: categories.icon,
      categoryColor: categories.color,
      budgetAmount: budgets.amount,
      spent: sql<number>`
        COALESCE((
          SELECT SUM(amount) FROM transactions t
          WHERE t.category_id = ${budgets.categoryId}
            AND t.user_id = ${userId}
            AND t.type = 'expense'
            AND t.date >= ${`${year}-${m}-01`}
            AND t.date <= ${`${year}-${m}-31`}
        ), 0)
      `,
    })
    .from(budgets)
    .innerJoin(categories, eq(budgets.categoryId, categories.id))
    .where(
      and(
        eq(budgets.userId, userId),
        eq(budgets.month, parseInt(m)),
        eq(budgets.year, parseInt(year))
      )
    );

  return NextResponse.json(
    data.map((row) => ({
      ...row,
      budgetAmount: Number(row.budgetAmount),
      spent: Number(row.spent),
      percentage: Math.min(Math.round((Number(row.spent) / Number(row.budgetAmount)) * 100), 100),
      isOverBudget: Number(row.spent) > Number(row.budgetAmount),
    }))
  );
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = requireUserId(session);

  const { categoryId, amount, month, year } = await req.json();

  if (!categoryId || !amount || !month || !year)
    return NextResponse.json({ error: "Field wajib tidak lengkap" }, { status: 400 });

  const existing = await db
    .select()
    .from(budgets)
    .where(
      and(
        eq(budgets.userId, userId),
        eq(budgets.categoryId, categoryId),
        eq(budgets.month, month),
        eq(budgets.year, year)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    const [updated] = await db
      .update(budgets)
      .set({ amount: String(amount) })
      .where(eq(budgets.id, existing[0].id))
      .returning();
    return NextResponse.json(updated);
  }

  const [budget] = await db
    .insert(budgets)
    .values({ userId, categoryId, amount: String(amount), month, year })
    .returning();

  return NextResponse.json(budget, { status: 201 });
}
