import axios from "axios";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
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

    const response = await axios.post(
      "http://localhost:8000/api/sheets/disconnect",
      null,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Active-Company": selectedCompany,
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (error) {
    console.error("Failed to disconnect the sheet.", error);
    return NextResponse.json(
      { error: "Failed to disconnect the sheet." },
      { status: 500 }
    );
  }
}
