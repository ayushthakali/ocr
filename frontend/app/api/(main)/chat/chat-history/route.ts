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
    console.error("Error fetching chat histories", err);
    return NextResponse.json(
      { error: "Failed to fetch chat histories." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const { title, messages } = await request.json();
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

    // Find the ttl number of chats of the company
    const existingChatsCount = await ChatHistory.countDocuments({
      company_id: selectedCompany,
    });

    // Delete oldest chat if more than 6 chats
    let deletedChatTitle: null | string = null;
    if (existingChatsCount >= 6) {
      const oldestChat = await ChatHistory.findOne({
        company_id: selectedCompany,
      })
        .sort({ updatedAt: 1 })
        .select("_id title");

      if (oldestChat) {
        deletedChatTitle = oldestChat.title;
        await ChatHistory.findByIdAndDelete(oldestChat._id);
        console.log(`Deleted oldest chat: ${oldestChat._id}`);
      }
    }

    // Create the new chat
    const newChat = await ChatHistory.create({
      company_id: selectedCompany,
      title: title || "New Chat",
      messages: messages || [],
    });

    return NextResponse.json(
      {
        newChat,
        deletedChatTitle,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Error creating new chat", err);
    return NextResponse.json(
      { error: "Failed to create new chat." },
      { status: 500 }
    );
  }
}
