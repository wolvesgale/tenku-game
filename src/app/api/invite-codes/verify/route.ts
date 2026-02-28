import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { inviteCodes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json();

    if (!code || typeof code !== "string" || code.length !== 8) {
      return NextResponse.json(
        { error: "招待コードは8文字です" },
        { status: 400 }
      );
    }

    const [invite] = await db
      .select()
      .from(inviteCodes)
      .where(eq(inviteCodes.code, code.toUpperCase()))
      .limit(1);

    if (!invite) {
      return NextResponse.json({ error: "無効な招待コードです" }, { status: 400 });
    }
    if (invite.usedByUserId) {
      return NextResponse.json(
        { error: "この招待コードはすでに使用されています" },
        { status: 400 }
      );
    }
    if (new Date() > invite.expiresAt) {
      return NextResponse.json(
        { error: "招待コードの有効期限が切れています" },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/invite-codes/verify]", err);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
