import { NextResponse } from "next/server";
import axios from "axios";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    // Get FormData from request
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Get selected company from headers
    const selectedCompany = req.headers.get("X-Active-Company") || "";
    const companyName = req.headers.get("X-Company-Name") || "";

    // Create new FormData for backend
    const backendFormData = new FormData();
    backendFormData.append("file", file);
    backendFormData.append("company_id", selectedCompany);

    const cookieStore = await cookies();
    const token = cookieStore.get("authToken")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Not Authenticated. Token expired or invalid." },
        { status: 401 }
      );
    }

    // Send to FastAPI backend using Axios
    const response = await axios.post(
      "http://127.0.0.1:8000/process-image",
      backendFormData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Active-Company": selectedCompany,
          "X-Company-Name": companyName,
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (err: any) {
    console.error("Upload error:", err);

    return NextResponse.json(
      {
        error: "Upload failed",
        detail: err.response?.data?.detail || err.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
