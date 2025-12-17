import axios from "axios";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("authToken")?.value;
    if (!token) {
      return NextResponse.json(
        { error: "Not Authenticated. Token expired or invalid." },
        { status: 401 }
      );
    }
    const selectedCompany = req.headers.get("X-Active-Company") || "";

    const response = await axios.get(
      "http://localhost:8000/api/sheets/status",
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Active-Company": selectedCompany,
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (error) {
    console.error("Failed to check sheets status:", error);
    return NextResponse.json(
      { error: "Failed to check sheets status." },
      { status: 500 }
    );
  }
}
