import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // ✅ Get FormData from request
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // ✅ Create new FormData for backend
    const backendFormData = new FormData();
    backendFormData.append("file", file);
    backendFormData.append(
      "company_id",
      "bd0518d1-91ac-478e-8bde-a4f63946d345"
    );

    // ✅ Send to FastAPI backend
    const response = await fetch("http://127.0.0.1:8000/process-image", {
      method: "POST",
      body: backendFormData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.detail || `Backend returned ${response.status}`
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json(
      {
        error: "Upload failed",
        detail: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
