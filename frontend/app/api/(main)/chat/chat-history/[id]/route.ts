import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import ChatHistory from "@/models/Chat";
import Company from "@/models/Company";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
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

    const chatHistory = await ChatHistory.findOne({
      _id: id,
      company_id: selectedCompany,
    });

    if (!chatHistory) {
      return NextResponse.json(
        { error: "Chat history not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(chatHistory, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch chat history." },
      { status: 500 }
    );
  }
}
