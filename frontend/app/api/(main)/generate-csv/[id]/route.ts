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
    const res = await axios.get(`http://localhost:8000/generate-excel/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Active-Company": selectedCompany,
      },
      responseType: "arraybuffer",
    });

    const fileBytes = res.data;

    const filenameHeader = res.headers["content-disposition"];
    let filename = "";
    if (filenameHeader) {
      const fileNameMatch = filenameHeader.match(/filename="(.+)"/);
      if (fileNameMatch) {
        filename = fileNameMatch[1];
      }
    }

    return new Response(fileBytes, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("Error fetching Excel from backend:", err);
    return NextResponse.json(
      { error: "Failed to generate Excel file" },
      { status: 500 }
    );
  }
}
