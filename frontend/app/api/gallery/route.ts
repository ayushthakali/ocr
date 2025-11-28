import { NextResponse } from "next/server";
import axios from "axios";

export async function GET() {
  try {
    const res = await axios.get("http://localhost:8000/search-documents", {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return NextResponse.json(res.data);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "API Error! Error fetching images." },
      { status: 500 }
    );
  }
}
