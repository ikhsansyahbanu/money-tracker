import { NextRequest, NextResponse } from "next/server";
import { auth, requireUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { budgets, categories, transactions } from "../../../../drizzle/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { isPositiveAmount, isValidMonth, isValidYear } from "@/lib/validate";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = requireUserId(session);

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month") ?? new Date().toISOString().slice(0, 7);
  const [year, m] = month.split("-");
  const dateFrom = `${year}-${m}-01`;
  const dateTo = `${year}-${m}-31`;

  // Single JOIN + GROUP BY — tidak ada subquery per baris
  const data = await db
    .select({
      budgetId: budgets.id,
      categoryId: budgets.categoryId,
      categoryName: categories.name,
      categoryIcon: categories.icon,
      categoryColor: categories.color,
      budgetAmount: budgets.amount,
      spent: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'expense'
        AND ${transactions.date} >= ${dateFrom}
        AND ${transactions.date} <= ${dateTo}
        THEN ${transactions.amount} ELSE 0 END), 0)`,
    })
    .from(budgets)
    .innerJoin(categories, eq(budgets.categoryId, categories.id))
    .leftJoin(
      transactions,
      and(
        eq(transactions.categoryId, budgets.categoryId),
        eq(transactions.userId, userId)
      )
    )
    .where(
      and(
        eq(budgets.userId, userId),
        eq(budgets.month, parseInt(m)),
        eq(budgets.year, parseInt(year))
      )
    )
    .groupBy(
      budgets.id,
      budgets.categoryId,
      budgets.amount,
      categories.name,
      categories.icon,
      categories.color
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

  if (!isPositiveAmount(amount))
    return NextResponse.json({ error: "Amount harus berupa angka positif" }, { status: 400 });

  if (!isValidMonth(month))
    return NextResponse.json({ error: "Month harus berupa angka antara 1–12" }, { status: 400 });

  if (!isValidYear(year))
    return NextResponse.json({ error: "Year harus berupa angka antara 2000–2100" }, { status: 400 });

  // Validasi kepemilikan kategori
  const [category] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)))
    .limit(1);

  if (!category)
    return NextResponse.json({ error: "Kategori tidak ditemukan" }, { status: 404 });

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
