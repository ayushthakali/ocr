import connectDB from "@/lib/db";
import { cookies } from "next/headers";
import jwt, { JwtPayload } from "jsonwebtoken";
import { NextResponse } from "next/server";
import Company from "@/models/Company";

export async function GET() {
  try {
    await connectDB();

    const cookieStore = await cookies();
    const token = cookieStore.get("authToken")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Not Authenticated." },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    const companies = await Company.find({ user_id: decoded.id });

    return NextResponse.json(
      { message: "Companies fetched successfully!", companies },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error fetching companies", err);

    // Return server error
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
