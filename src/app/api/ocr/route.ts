import { NextRequest, NextResponse } from "next/server";
import { auth, requireUserId } from "@/lib/auth";

interface OcrItem {
  name: string;
  qty: number;
  price: number;
}

interface OcrResult {
  merchant: string | null;
  date: string | null;
  items: OcrItem[];
  total: number | null;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  requireUserId(session);

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file)
    return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });

  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    return NextResponse.json({ error: "Format file tidak didukung" }, { status: 400 });

  if (file.size > 10 * 1024 * 1024)
    return NextResponse.json({ error: "Ukuran file maksimal 10 MB" }, { status: 400 });

  const buffer = await file.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXTAUTH_URL ?? "http://localhost:3000",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              { type: "image_url", image_url: { url: `data:${file.type};base64,${base64}` } },
              {
                type: "text",
                text: `Kamu adalah pembaca struk belanja. Baca struk ini dan kembalikan HANYA JSON tanpa markdown, tanpa penjelasan apapun.

Format JSON:
{
  "merchant": "nama toko atau null",
  "date": "YYYY-MM-DD atau null",
  "items": [{ "name": "nama barang", "qty": 1, "price": 5000 }],
  "total": 50000
}

Aturan:
- price di items adalah harga SATUAN bukan total per baris
- qty minimal 1
- Jika tidak terbaca, isi null
- Angka tanpa pemisah ribuan
- Hanya kembalikan JSON`,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error("OpenRouter error:", await response.json());
      return NextResponse.json({ error: "Gagal memproses struk" }, { status: 502 });
    }

    const data = await response.json();
    const raw: string = data.choices?.[0]?.message?.content ?? "";

    // Ekstrak JSON: coba blok ```json ... ``` dulu, lalu fallback ke substring { ... }
    let jsonStr = raw.trim();
    const codeBlock = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlock) {
      jsonStr = codeBlock[1].trim();
    } else {
      const start = jsonStr.indexOf("{");
      const end = jsonStr.lastIndexOf("}");
      if (start !== -1 && end !== -1) jsonStr = jsonStr.slice(start, end + 1);
    }

    let parsed: OcrResult;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      return NextResponse.json({ error: "Format response AI tidak valid — coba foto ulang" }, { status: 502 });
    }

    // Validasi schema manual
    if (typeof parsed !== "object" || parsed === null)
      return NextResponse.json({ error: "Format response tidak valid" }, { status: 502 });

    if (!Array.isArray(parsed.items))
      return NextResponse.json({ error: "Format response tidak valid: items harus array" }, { status: 502 });

    const validItems: OcrItem[] = [];
    for (const item of parsed.items) {
      const name = typeof item.name === "string" ? item.name.trim() : null;
      const price = Number(item.price);
      const qty = Number(item.qty) >= 1 ? Math.round(Number(item.qty)) : 1;
      if (!name || !isFinite(price) || price < 0) continue; // lewati item tidak valid
      validItems.push({ name, qty, price });
    }

    const total = parsed.total !== null && parsed.total !== undefined && isFinite(Number(parsed.total))
      ? Math.abs(Number(parsed.total))
      : null;

    // Validasi format tanggal dari AI
    let date: string | null = null;
    if (typeof parsed.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(parsed.date)) {
      date = parsed.date;
    }

    return NextResponse.json({
      merchant: typeof parsed.merchant === "string" ? parsed.merchant.trim() || null : null,
      date,
      total,
      items: validItems,
    });
  } catch (err) {
    console.error("OCR parse error:", err);
    return NextResponse.json(
      { error: "Gagal membaca struk — coba foto ulang dengan pencahayaan lebih baik" },
      { status: 422 }
    );
  }
}
