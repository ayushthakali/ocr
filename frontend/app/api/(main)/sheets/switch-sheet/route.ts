import axios, { AxiosError } from "axios";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const body = await req.json();
    const token = cookieStore.get("authToken")?.value;
    if (!token) {
      return NextResponse.json(
        { error: "Not Authenticated. Token expired or invalid." },
        { status: 401 }
      );
    }

    const selectedCompany = req.headers.get("X-Active-Company") || "";

    const response = await axios.post(
      "http://localhost:8000/api/sheets/switch_sheet",
      body,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Active-Company": selectedCompany,
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (err) {
    const error = err as AxiosError<any>;
    return NextResponse.json(
      {
        error:
          error.response?.data?.detail ||
          error.response?.data?.error ||
          "Failed to switch sheets",
      },
      { status: error.response?.status || 500 }
    );
  }
}
