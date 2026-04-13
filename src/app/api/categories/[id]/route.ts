import { NextRequest, NextResponse } from "next/server";
import { auth, requireUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { categories } from "../../../../../drizzle/schema";
import { eq, and } from "drizzle-orm";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = requireUserId(session);

  const { name, icon, color } = await req.json();

  const [updated] = await db
    .update(categories)
    .set({ name, icon, color })
    .where(and(eq(categories.id, params.id), eq(categories.userId, userId)))
    .returning();

  if (!updated) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = requireUserId(session);

  const [deleted] = await db
    .delete(categories)
    .where(and(eq(categories.id, params.id), eq(categories.userId, userId)))
    .returning();

  if (!deleted) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
  return NextResponse.json({ success: true });
}
