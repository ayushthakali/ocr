import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import ChatHistory from "@/models/Chat";
import Company from "@/models/Company";
import mongoose from "mongoose";

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

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid chat ID format" },
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
    console.error("Error fetching chat history", err);
    return NextResponse.json(
      { error: "Failed to fetch chat history." },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid chat ID format" },
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

    //Find and verify ownership then delete
    const chatHistory = await ChatHistory.findOneAndDelete({
      _id: id,
      company_id: selectedCompany,
    });

    if (!chatHistory) {
      return NextResponse.json(
        { error: "Chat history not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ status: 200 });
  } catch (err) {
    console.error("Error deleting chat:", err);
    return NextResponse.json(
      { error: "Failed to delete chat." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const { title, messages } = await request.json();

    const selectedCompany = request.headers.get("X-Active-Company");
    if (!selectedCompany) {
      return NextResponse.json(
        { error: "Active company not found." },
        { status: 400 }
      );
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid chat ID format" },
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

    //Find and verify ownership then update chat
    const chatHistory = await ChatHistory.findOneAndUpdate(
      { _id: id, company_id: selectedCompany },
      { title, messages },
      {
        new: true,
        runValidators: true, // ← Run schema validation
      }
    );

    if (!chatHistory) {
      return NextResponse.json(
        { error: "Chat history not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(chatHistory, { status: 200 });
  } catch (err) {
    console.error("Error saving/updating chat:", err);
    return NextResponse.json(
      { error: "Failed to save/update chat." },
      { status: 500 }
    );
  }
}
