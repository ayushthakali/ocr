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

    // Get selected company from headers
    const selectedCompany = req.headers.get("X-Active-Company") || "";
    const companyName = req.headers.get("X-Company-Name") || "";

    const response = await axios.post(
      "http://localhost:8000/api/sheets/create_new_sheet",
      null,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Active-Company": selectedCompany,
          "X-Company-Name": companyName,  
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (error) {
    console.error("Failed to create new sheet.", error);
    return NextResponse.json(
      { error: "Failed to create new sheet." },
      { status: 500 }
    );
  }
}
