import { NextResponse } from "next/server";
import axios from "axios";
import { cookies } from "next/headers";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("authToken")?.value;

  if (!token) {
    return NextResponse.json(
      { error: "Not Authenticated. Token expired or invalid." },
      { status: 401 }
    );
  }
  const selectedCompany = req.headers.get("X-Active-Company") || "";

  try {
    const res = await axios.get(`http://localhost:8000/generate-csv/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Active-Company": selectedCompany,
      },
    });

    return NextResponse.json(res.data);
  } catch (err) {
    console.error("Error generating CSV:", err);
    return NextResponse.json(
      { error: "API Error! Error generating csv files." },
      { status: 500 }
    );
  }
}
