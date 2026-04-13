import { NextRequest, NextResponse } from "next/server";
import { auth, requireUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { transactions, transactionItems, accounts, categories } from "../../../../drizzle/schema";
import { eq, and, gte, lte, desc, sql, count, ilike, or } from "drizzle-orm";
import { isPositiveAmount, isPositiveInt, isValidDate } from "@/lib/validate";

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
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "30"), 100);
  const offset = parseInt(searchParams.get("offset") ?? "0");

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

  const [data, [{ total }]] = await Promise.all([
    db
      .select()
      .from(transactions)
      .where(and(...conditions))
      .orderBy(desc(transactions.date), desc(transactions.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ total: count() })
      .from(transactions)
      .where(and(...conditions)),
  ]);

  return NextResponse.json({ data, total, limit, offset });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = requireUserId(session);

  const { accountId, categoryId, type, amount, merchant, note, date, items } = await req.json();

  // Validasi field wajib
  if (!accountId || !type || !amount || !date)
    return NextResponse.json({ error: "Field wajib tidak lengkap" }, { status: 400 });

  if (!["income", "expense"].includes(type))
    return NextResponse.json({ error: "Type tidak valid" }, { status: 400 });

  // Validasi numerik
  if (!isPositiveAmount(amount))
    return NextResponse.json({ error: "Amount harus berupa angka positif" }, { status: 400 });

  // Validasi tanggal
  if (!isValidDate(date))
    return NextResponse.json({ error: "Format tanggal tidak valid (gunakan YYYY-MM-DD)" }, { status: 400 });

  // Validasi kepemilikan akun
  const [account] = await db
    .select({ id: accounts.id })
    .from(accounts)
    .where(and(eq(accounts.id, accountId), eq(accounts.userId, userId)))
    .limit(1);

  if (!account)
    return NextResponse.json({ error: "Akun tidak ditemukan" }, { status: 404 });

  // Validasi kepemilikan kategori (jika ada)
  if (categoryId) {
    const [category] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)))
      .limit(1);

    if (!category)
      return NextResponse.json({ error: "Kategori tidak ditemukan" }, { status: 404 });
  }

  // Validasi items
  if (items && items.length > 0) {
    for (const item of items) {
      if (!item.name || typeof item.name !== "string")
        return NextResponse.json({ error: "Nama item tidak valid" }, { status: 400 });
      if (!isPositiveAmount(item.price))
        return NextResponse.json({ error: `Harga item "${item.name}" harus berupa angka positif` }, { status: 400 });
      if (item.qty !== undefined && !isPositiveInt(item.qty))
        return NextResponse.json({ error: `Qty item "${item.name}" harus berupa bilangan bulat positif` }, { status: 400 });
    }
  }

  // Semua operasi dalam satu DB transaction (atomic)
  const tx = await db.transaction(async (trx) => {
    const [newTx] = await trx
      .insert(transactions)
      .values({ userId, accountId, categoryId, type, amount: String(amount), merchant, note, date })
      .returning();

    if (items && items.length > 0) {
      await trx.insert(transactionItems).values(
        items.map((item: { name: string; qty: number; price: number }) => ({
          transactionId: newTx.id,
          name: item.name,
          qty: item.qty ?? 1,
          price: String(item.price),
        }))
      );
    }

    const balanceDelta = type === "income" ? amount : -amount;
    await trx
      .update(accounts)
      .set({ balance: sql`balance + ${balanceDelta}` })
      .where(eq(accounts.id, accountId));

    return newTx;
  });

  return NextResponse.json(tx, { status: 201 });
}
