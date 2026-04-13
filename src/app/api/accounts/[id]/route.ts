import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { accounts } from "../../../../../drizzle/schema";
import { eq, and } from "drizzle-orm";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, type } = await req.json();

  const [updated] = await db
    .update(accounts)
    .set({ name, type })
    .where(
      and(eq(accounts.id, params.id), eq(accounts.userId, session.user.id))
    )
    .returning();

  if (!updated)
    return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });

  return NextResponse.json(updated);
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [deleted] = await db
    .delete(accounts)
    .where(
      and(eq(accounts.id, params.id), eq(accounts.userId, session.user.id))
    )
    .returning();

  if (!deleted)
    return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });

  return NextResponse.json({ success: true });
}
