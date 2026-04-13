import { NextRequest, NextResponse } from "next/server";
import { auth, requireUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { transactions, transactionItems, accounts } from "../../../../../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = requireUserId(session);

  const [tx] = await db
    .select()
    .from(transactions)
    .where(and(eq(transactions.id, params.id), eq(transactions.userId, userId)));

  if (!tx) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });

  const items = await db
    .select()
    .from(transactionItems)
    .where(eq(transactionItems.transactionId, tx.id));

  return NextResponse.json({ ...tx, items });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = requireUserId(session);

  const { categoryId, merchant, note, date } = await req.json();

  const [updated] = await db
    .update(transactions)
    .set({ categoryId, merchant, note, date })
    .where(and(eq(transactions.id, params.id), eq(transactions.userId, userId)))
    .returning();

  if (!updated) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = requireUserId(session);

  const [tx] = await db
    .select()
    .from(transactions)
    .where(and(eq(transactions.id, params.id), eq(transactions.userId, userId)));

  if (!tx) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });

  const balanceDelta = tx.type === "income" ? -Number(tx.amount) : Number(tx.amount);
  await db
    .update(accounts)
    .set({ balance: sql`balance + ${balanceDelta}` })
    .where(eq(accounts.id, tx.accountId));

  await db.delete(transactions).where(eq(transactions.id, tx.id));
  return NextResponse.json({ success: true });
}
