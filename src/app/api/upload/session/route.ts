import { NextRequest, NextResponse } from "next/server";
import { createUploadSession } from "@/lib/upload";

export async function POST() {
  try {
    const session = await createUploadSession();
    return NextResponse.json({ token: session.token });
  } catch {
    return NextResponse.json(
      { error: "Failed to create upload session" },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
