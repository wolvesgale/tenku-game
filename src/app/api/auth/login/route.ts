import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { verifyPassword, setSession } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const { nickname, password } = await req.json();

    if (!nickname || !password) {
      return NextResponse.json(
        { error: "ニックネームとパスワードを入力してください" },
        { status: 400 }
      );
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.nickname, nickname))
      .limit(1);

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.json(
        { error: "ニックネームまたはパスワードが違います" },
        { status: 401 }
      );
    }

    if (user.status !== "active") {
      return NextResponse.json(
        { error: "このアカウントは現在利用できません" },
        { status: 403 }
      );
    }

    await setSession({
      id: user.id,
      nickname: user.nickname,
      avatarId: user.avatarId,
      trustLevel: user.trustLevel,
      role: "user",
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/auth/login]", err);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
