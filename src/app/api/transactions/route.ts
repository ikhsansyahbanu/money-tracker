import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  transactions,
  transactionItems,
  accounts,
} from "../../../../drizzle/schema";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month"); // format: 2026-04
  const accountId = searchParams.get("accountId");
  const categoryId = searchParams.get("categoryId");
  const type = searchParams.get("type"); // income | expense

  const conditions = [eq(transactions.userId, session.user.id)];

  if (month) {
    const [year, m] = month.split("-");
    const from = `${year}-${m}-01`;
    const to = `${year}-${m}-31`;
    conditions.push(gte(transactions.date, from));
    conditions.push(lte(transactions.date, to));
  }

  if (accountId) conditions.push(eq(transactions.accountId, accountId));
  if (categoryId) conditions.push(eq(transactions.categoryId, categoryId));
  if (type) conditions.push(eq(transactions.type, type));

  const data = await db
    .select()
    .from(transactions)
    .where(and(...conditions))
    .orderBy(desc(transactions.date), desc(transactions.createdAt));

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const {
    accountId,
    categoryId,
    type,
    amount,
    merchant,
    note,
    date,
    items,
  } = await req.json();

  if (!accountId || !type || !amount || !date)
    return NextResponse.json(
      { error: "Field wajib tidak lengkap" },
      { status: 400 }
    );

  if (!["income", "expense"].includes(type))
    return NextResponse.json({ error: "Type tidak valid" }, { status: 400 });

  const [tx] = await db
    .insert(transactions)
    .values({
      userId: session.user.id,
      accountId,
      categoryId,
      type,
      amount: String(amount),
      merchant,
      note,
      date,
    })
    .returning();

  if (items && items.length > 0) {
    await db.insert(transactionItems).values(
      items.map((item: { name: string; qty: number; price: number }) => ({
        transactionId: tx.id,
        name: item.name,
        qty: item.qty,
        price: String(item.price),
      }))
    );
  }

  const balanceDelta = type === "income" ? amount : -amount;
  await db
    .update(accounts)
    .set({ balance: sql`balance + ${balanceDelta}` })
    .where(eq(accounts.id, accountId));

  return NextResponse.json(tx, { status: 201 });
}
