import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "../../../../../drizzle/schema";
import { eq } from "drizzle-orm";
import { isRateLimited, getIp } from "@/lib/rateLimit";
import crypto from "crypto";
import { pool } from "@/lib/db";

export async function POST(req: NextRequest) {
  // Rate limiting: maks 3 request per IP per 10 menit
  const ip = getIp(req);
  if (isRateLimited(`forgot:${ip}`, 3, 10 * 60_000))
    return NextResponse.json(
      { error: "Terlalu banyak percobaan. Coba lagi beberapa menit." },
      { status: 429 }
    );

  const { email } = await req.json();
  if (!email || typeof email !== "string")
    return NextResponse.json({ error: "Email wajib diisi" }, { status: 400 });

  // Selalu return 200 agar tidak bisa dipakai untuk menebak email terdaftar
  const [user] = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(eq(users.email, email.toLowerCase().trim()))
    .limit(1);

  if (!user) {
    return NextResponse.json({ message: "Jika email terdaftar, link reset akan dikirim." });
  }

  // Hapus token lama milik user ini
  await pool.query(
    `DELETE FROM password_reset_tokens WHERE user_id = $1`,
    [user.id]
  );

  // Buat token baru (64 hex chars)
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 jam

  await pool.query(
    `INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)`,
    [user.id, token, expiresAt]
  );

  const resetUrl = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/reset-password?token=${token}`;

  // Kirim email jika SMTP dikonfigurasi, atau log ke console untuk development
  await sendResetEmail({ to: email, name: user.name ?? "Pengguna", resetUrl });

  return NextResponse.json({ message: "Jika email terdaftar, link reset akan dikirim." });
}

async function sendResetEmail({
  to,
  name,
  resetUrl,
}: {
  to: string;
  name: string;
  resetUrl: string;
}) {
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT ?? "587");
  const smtpFrom = process.env.SMTP_FROM ?? smtpUser;

  if (!smtpUser || !smtpPass || !smtpHost) {
    // Development: log ke console jika SMTP belum dikonfigurasi
    console.log(`\n[RESET PASSWORD LINK]\nTo: ${to}\nLink: ${resetUrl}\n`);
    return;
  }

  // Kirim via nodemailer jika tersedia, atau fallback ke console
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const nodemailer = require("nodemailer");
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass },
    });

    await transporter.sendMail({
      from: `"Money Tracker" <${smtpFrom}>`,
      to,
      subject: "Reset Password Money Tracker",
      html: `
        <p>Halo ${name},</p>
        <p>Klik link berikut untuk mereset password kamu (berlaku 1 jam):</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>Jika kamu tidak meminta reset password, abaikan email ini.</p>
      `,
    });
  } catch {
    console.log(`\n[RESET PASSWORD LINK — SMTP gagal]\nTo: ${to}\nLink: ${resetUrl}\n`);
  }
}
