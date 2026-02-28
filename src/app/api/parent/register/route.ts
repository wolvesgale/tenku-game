import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parents } from "@/lib/db/schema";
import { hashPassword } from "@/lib/auth";
import { createToken } from "@/lib/auth";
import { generateId } from "@/lib/utils";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const schema = z.object({
  email:    z.string().email(),
  password: z.string().min(8),
  nickname: z.string().min(1).max(50),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "入力内容が正しくありません" }, { status: 400 });
    }

    const { email, password, nickname } = parsed.data;

    // メール重複確認
    const [existing] = await db
      .select({ id: parents.id })
      .from(parents)
      .where(eq(parents.email, email))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: "このメールアドレスはすでに登録されています" },
        { status: 409 }
      );
    }

    const id = generateId();
    const passwordHash = await hashPassword(password);

    await db.insert(parents).values({ id, email, passwordHash, nickname });

    // 保護者セッション作成（別クッキー）
    const token = await createToken({ id, nickname, avatarId: 0, trustLevel: "L1", role: "parent" });
    cookies().set("tenku-parent-session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30日
      path: "/",
    });

    return NextResponse.json({ ok: true, id });
  } catch (err) {
    console.error("[POST /api/parent/register]", err);
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
