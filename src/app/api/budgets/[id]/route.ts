import { NextRequest, NextResponse } from "next/server";
import { auth, requireUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { budgets } from "../../../../../drizzle/schema";
import { eq, and } from "drizzle-orm";

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = requireUserId(session);

  const [deleted] = await db
    .delete(budgets)
    .where(and(eq(budgets.id, params.id), eq(budgets.userId, userId)))
    .returning();

  if (!deleted) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
  return NextResponse.json({ success: true });
}
