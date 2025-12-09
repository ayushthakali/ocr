import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Company from "@/models/Company";
import { cookies } from "next/headers";
import jwt, { JwtPayload } from "jsonwebtoken";

export async function POST(req: Request) {
  try {
    await connectDB();
    const { company_name, pan_no } = await req.json();

    // Check if company already exists
    const companyExists = await User.findOne({ pan_no });
    if (companyExists) {
      return NextResponse.json(
        { error: "Company already exists." },
        { status: 409 }
      );
    }

    //Get token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get("authToken")?.value;

    if (!token)
      return NextResponse.json({ error: "Not Authenticated" }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    // Create new company
    const company = await Company.create({
      company_name,
      pan_no,
      user_id: decoded.id,
    });

    return NextResponse.json(
      {
        message: "Company added successfully!",
        company: { company_name: company.company_name },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Error adding company", err);

    // Return server error
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
