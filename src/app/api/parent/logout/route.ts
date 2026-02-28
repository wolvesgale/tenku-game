import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  cookies().delete("tenku-parent-session");
  return NextResponse.redirect(new URL("/parent/login", req.url));
}
