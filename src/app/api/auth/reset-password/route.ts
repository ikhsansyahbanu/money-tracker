import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { db } from "@/lib/db";
import { users } from "../../../../../drizzle/schema";
import { eq } from "drizzle-orm";
import { isRateLimited, getIp } from "@/lib/rateLimit";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  // Rate limiting: maks 5 percobaan per IP per 15 menit
  const ip = getIp(req);
  if (isRateLimited(`reset:${ip}`, 5, 15 * 60_000))
    return NextResponse.json(
      { error: "Terlalu banyak percobaan. Coba lagi beberapa menit." },
      { status: 429 }
    );

  const { token, password } = await req.json();

  if (!token || typeof token !== "string")
    return NextResponse.json({ error: "Token tidak valid" }, { status: 400 });

  if (!password || typeof password !== "string" || password.length < 8)
    return NextResponse.json({ error: "Password minimal 8 karakter" }, { status: 400 });

  // Cari token yang valid dan belum dipakai
  const { rows } = await pool.query<{ id: string; user_id: string; expires_at: Date; used: boolean }>(
    `SELECT id, user_id, expires_at, used
     FROM password_reset_tokens
     WHERE token = $1
     LIMIT 1`,
    [token]
  );

  const resetToken = rows[0];

  if (!resetToken || resetToken.used || new Date() > resetToken.expires_at)
    return NextResponse.json({ error: "Token tidak valid atau sudah kedaluwarsa" }, { status: 400 });

  // Hash password baru
  const passwordHash = await bcrypt.hash(password, 12);

  // Update password + tandai token sudah dipakai (dalam satu transaksi)
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `UPDATE users SET password_hash = $1 WHERE id = $2`,
      [passwordHash, resetToken.user_id]
    );
    await client.query(
      `UPDATE password_reset_tokens SET used = TRUE WHERE id = $1`,
      [resetToken.id]
    );
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  return NextResponse.json({ message: "Password berhasil direset. Silakan login." });
}
