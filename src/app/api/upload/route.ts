import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "Tidak ada berkas yang dikirim." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Ensure public/uploads exists
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Clean filename: remove special characters except dot, dash, underscore
    const timestamp = Date.now();
    const cleanOriginalName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const savedFileName = `${timestamp}_${cleanOriginalName}`;
    const filePath = path.join(uploadsDir, savedFileName);

    // Save to disk
    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/${savedFileName}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: file.name,
      fileSize: (file.size / (1024 * 1024)).toFixed(1) + " MB",
      mimeType: file.type,
    });
  } catch (error) {
    console.error("Upload handler error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal menyimpan berkas ke server." },
      { status: 500 }
    );
  }
}
