import { NextResponse } from "next/server";
import axios from "axios";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const res = await axios.post("http://localhost:8000/chat", body, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    return NextResponse.json(res.data.response);
  } catch (err) {
    console.error("API error: ", err);
    return NextResponse.json(
      {
        success: false,
        error: "Server error",
      },
      { status: 500 }
    );
  }
}
