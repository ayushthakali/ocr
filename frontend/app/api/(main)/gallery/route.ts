import { NextResponse } from "next/server";
import axios from "axios";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("authToken")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Not Authenticated. Token expired or invalid." },
        { status: 401 }
      );
    }
    const selectedCompany = request.headers.get("X-Active-Company") || "";

    const res = await axios.get("http://localhost:8000/search-documents", {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Active-Company": selectedCompany,
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
