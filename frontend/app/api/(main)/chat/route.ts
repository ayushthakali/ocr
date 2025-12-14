import { NextResponse } from "next/server";
import axios from "axios";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const { query, selectedCompany } = await req.json();

    const cookieStore = await cookies();
    const token = cookieStore.get("authToken")?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: "Not Authenticated. Token expired or invalid." },
        { status: 401 }
      );
    }

    const res = await axios.post(
      "http://localhost:8000/chat",
      { query },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Active-Company": selectedCompany,
          "Content-Type": "application/json",
        },
      }
    );

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
