import { NextRequest, NextResponse } from "next/server";
import { auth, requireUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { transactions, transactionItems, accounts, categories } from "../../../../../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";
import { isValidDate } from "@/lib/validate";

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

  // Validasi format tanggal jika disertakan
  if (date !== undefined && !isValidDate(date))
    return NextResponse.json({ error: "Format tanggal tidak valid (gunakan YYYY-MM-DD)" }, { status: 400 });

  // Validasi kepemilikan kategori jika disertakan
  if (categoryId !== undefined && categoryId !== null) {
    const [category] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)))
      .limit(1);

    if (!category)
      return NextResponse.json({ error: "Kategori tidak ditemukan" }, { status: 404 });
  }

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

  // Update balance + delete dalam satu DB transaction (atomic)
  await db.transaction(async (trx) => {
    const balanceDelta = tx.type === "income" ? -Number(tx.amount) : Number(tx.amount);
    await trx
      .update(accounts)
      .set({ balance: sql`balance + ${balanceDelta}` })
      .where(eq(accounts.id, tx.accountId));

    await trx.delete(transactions).where(eq(transactions.id, tx.id));
  });

  return NextResponse.json({ success: true });
}
