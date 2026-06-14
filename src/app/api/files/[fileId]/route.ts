import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import { getUploadedFile, getFilePath } from "@/lib/upload";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> },
) {
  try {
    const { fileId } = await params;
    const file = await getUploadedFile(fileId);

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const filePath = getFilePath(file.storedName);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const buffer = fs.readFileSync(filePath);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": file.mimeType,
        "Cache-Control": "private, max-age=3600",
        "Content-Disposition": `inline; filename="${file.originalName}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to serve file" }, { status: 500 });
  }
}
