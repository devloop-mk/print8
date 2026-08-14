import { NextRequest, NextResponse } from "next/server";
import { createUploadSession } from "@/lib/upload";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { requireTurnstileOrReject } from "@/lib/security/turnstile";

export async function POST(request: NextRequest) {
  const rateLimited = enforceRateLimit(
    request,
    "upload-session",
    40,
    60 * 60 * 1000,
  );
  if (rateLimited) return rateLimited;

  try {
    let turnstileToken: string | undefined;
    try {
      const body = await request.json();
      if (body && typeof body.turnstileToken === "string") {
        turnstileToken = body.turnstileToken;
      }
    } catch {
      // empty body is allowed when Turnstile is disabled
    }

    const turnstile = await requireTurnstileOrReject(
      turnstileToken,
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
    );
    if (!turnstile.ok) {
      return NextResponse.json(
        { error: turnstile.message },
        { status: turnstile.status },
      );
    }

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
