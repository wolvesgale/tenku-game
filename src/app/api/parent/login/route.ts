import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parents } from "@/lib/db/schema";
import { verifyPassword, createToken } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "メールアドレスとパスワードを入力してください" }, { status: 400 });
    }

    const [parent] = await db
      .select()
      .from(parents)
      .where(eq(parents.email, email))
      .limit(1);

    if (!parent || !(await verifyPassword(password, parent.passwordHash))) {
      return NextResponse.json({ error: "メールアドレスまたはパスワードが違います" }, { status: 401 });
    }

    const token = await createToken({
      id: parent.id,
      nickname: parent.nickname,
      avatarId: 0,
      trustLevel: "L1",
      role: "parent",
    });

    cookies().set("tenku-parent-session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/parent/login]", err);
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
