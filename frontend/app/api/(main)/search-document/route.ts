import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const queryString = new URLSearchParams();

    if (from) queryString.append("from", from);
    if (to) queryString.append("to", to);

    const response = await axios.get(
      `http://localhost:8000/search-documents?${queryString.toString()}`
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
