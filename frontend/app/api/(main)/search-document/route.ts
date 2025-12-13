import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function POST(req: NextRequest) {
  try {
    const { from, to } = await req.json();
    const queryString = new URLSearchParams();

    if (from) queryString.append("start_date", from);
    if (to) queryString.append("end_date", to);

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
