import { NextRequest, NextResponse } from "next/server";
import { auth, requireUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { categories } from "../../../../drizzle/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = requireUserId(session);

  const data = await db.select().from(categories).where(eq(categories.userId, userId));
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = requireUserId(session);

  const { name, type, icon, color } = await req.json();

  if (!name || !type)
    return NextResponse.json({ error: "Name dan type wajib diisi" }, { status: 400 });

  if (!["income", "expense"].includes(type))
    return NextResponse.json({ error: "Type tidak valid" }, { status: 400 });

  const [category] = await db
    .insert(categories)
    .values({ userId, name, type, icon, color })
    .returning();

  return NextResponse.json(category, { status: 201 });
}
