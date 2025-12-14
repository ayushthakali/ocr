import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const { from, to } = await req.json();
    const queryString = new URLSearchParams();

    if (from) queryString.append("start_date", from);
    if (to) queryString.append("end_date", to);

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
      `http://localhost:8000/search-documents?${queryString.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Active-Company": selectedCompany,
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Failed to filter documents" },
      { status: 500 }
    );
  }
}
