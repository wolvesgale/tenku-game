import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reports } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { generateId } from "@/lib/utils";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  targetType: z.enum(["post", "dm_message", "user"]),
  targetId:   z.string().min(1),
  reason:     z.enum(["suspicious_invite", "inappropriate", "spam", "other"]),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "入力内容が正しくありません" },
        { status: 400 }
      );
    }

    const { targetType, targetId, reason } = parsed.data;
    const id = generateId();

    await db.insert(reports).values({
      id,
      reporterId: session.id,
      targetType,
      targetId,
      reason,
      status: "pending",
      // evidenceRef: TODO: S3へのエビデンス保存（仕様書 §4.5 SP-001）
    });

    return NextResponse.json({ ok: true, id });
  } catch (err) {
    console.error("[POST /api/reports]", err);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
