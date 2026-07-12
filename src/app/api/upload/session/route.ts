import { NextRequest, NextResponse } from "next/server";
import { createUploadSession } from "@/lib/upload";
import { enforceRateLimit } from "@/lib/security/rate-limit";

export async function POST(request: NextRequest) {
  const rateLimited = enforceRateLimit(
    request,
    "upload-session",
    40,
    60 * 60 * 1000,
  );
  if (rateLimited) return rateLimited;

  try {
    const session = await createUploadSession();
    return NextResponse.json({ token: session.token });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to create upload session";
    console.error("[upload/session]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
