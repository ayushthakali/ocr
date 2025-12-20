import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import ChatHistory from "@/models/Chat";
import Company from "@/models/Company";

export async function GET(request: Request) {
  try {
    await connectDB();
    const selectedCompany = request.headers.get("X-Active-Company");
    if (!selectedCompany) {
      return NextResponse.json(
        { error: "Active company not found." },
        { status: 400 }
      );
    }

    const company = await Company.findById(selectedCompany);
    if (!company) {
      return NextResponse.json(
        { error: "Company doesn't exist." },
        { status: 404 }
      );
    }

    const chatHistories = await ChatHistory.find({
      company_id: selectedCompany,
    })
      .sort({ updatedAt: -1 }) // -1 = descending (newest first)
      .limit(6)
      .lean(); // Returns plain JS objects (faster)

    return NextResponse.json(chatHistories, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch chat histories." },
      { status: 500 }
    );
  }
}


