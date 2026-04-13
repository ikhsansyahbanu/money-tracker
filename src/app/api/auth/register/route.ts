import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users, categories } from "../../../../../drizzle/schema";
import { eq } from "drizzle-orm";
import { isRateLimited, getIp } from "@/lib/rateLimit";

const defaultCategories = [
  { name: "Gaji", type: "income", icon: "💼", color: "#1D9E75" },
  { name: "Freelance", type: "income", icon: "💻", color: "#0F6E56" },
  { name: "Makanan & minuman", type: "expense", icon: "🍽", color: "#D85A30" },
  { name: "Transportasi", type: "expense", icon: "🚗", color: "#BA7517" },
  { name: "Belanja", type: "expense", icon: "🛒", color: "#534AB7" },
  { name: "Tagihan", type: "expense", icon: "⚡", color: "#185FA5" },
  { name: "Kesehatan", type: "expense", icon: "🏥", color: "#E24B4A" },
  { name: "Hiburan", type: "expense", icon: "🎮", color: "#D4537E" },
  { name: "Lainnya", type: "expense", icon: "📦", color: "#888780" },
];

export async function POST(req: NextRequest) {
  // Rate limiting: maks 5 registrasi per IP per 10 menit
  const ip = getIp(req);
  if (isRateLimited(`register:${ip}`, 5, 10 * 60_000))
    return NextResponse.json(
      { error: "Terlalu banyak percobaan. Coba lagi beberapa menit." },
      { status: 429 }
    );

  const { name, email, password } = await req.json();

  if (!name || !email || !password)
    return NextResponse.json(
      { error: "Semua field wajib diisi" },
      { status: 400 }
    );

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing.length > 0)
    return NextResponse.json(
      { error: "Email sudah terdaftar" },
      { status: 409 }
    );

  const passwordHash = await bcrypt.hash(password, 12);

  const [user] = await db
    .insert(users)
    .values({ name, email, passwordHash })
    .returning();

  // Seed kategori default
  await db.insert(categories).values(
    defaultCategories.map((c) => ({ ...c, userId: user.id }))
  );

  return NextResponse.json(
    { id: user.id, name: user.name, email: user.email },
    { status: 201 }
  );
}
