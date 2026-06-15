import { NextResponse } from "next/server";
import { createUploadSession } from "@/lib/upload";

export async function POST() {
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
