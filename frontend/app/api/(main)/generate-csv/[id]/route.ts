import { NextResponse } from "next/server";
import axios from "axios";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const res = await axios.get(`http://localhost:8000/generate-csv/${id}`, {
      headers: {
        "Content-Type": "application/json",
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
