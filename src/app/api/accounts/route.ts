import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { accounts } from "../../../../drizzle/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await db
    .select()
    .from(accounts)
    .where(eq(accounts.userId, session.user.id));

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, type, balance } = await req.json();

  if (!name || !type)
    return NextResponse.json(
      { error: "Name dan type wajib diisi" },
      { status: 400 }
    );

  if (!["cash", "bank", "ewallet"].includes(type))
    return NextResponse.json({ error: "Type tidak valid" }, { status: 400 });

  const [account] = await db
    .insert(accounts)
    .values({ userId: session.user.id, name, type, balance: balance ?? "0" })
    .returning();

  return NextResponse.json(account, { status: 201 });
}
