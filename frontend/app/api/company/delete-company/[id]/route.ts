import connectDB from "@/lib/db";
import { NextResponse } from "next/server";
import Company from "@/models/Company";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await connectDB();

    const deletedCompany = await Company.findByIdAndDelete(id);

    if (!deletedCompany) {
      return NextResponse.json(
        { success: false, error: "Company not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Company deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting Company:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete Company",
      },
      { status: 500 }
    );
  }
}
