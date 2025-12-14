import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Company from "@/models/Company";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  try {
    await connectDB();
    const { email, password } = await req.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Find user
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return NextResponse.json(
        { error: "User doesn't exist." },
        { status: 401 }
      );
    }

    //If user is deleted
    if (user.isDeleted) {
      return NextResponse.json(
        { error: "This account has been deleted" },
        { status: 403 }
      );
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    //Check for companies
    const companies = await Company.find({ user_id: user._id });
    const firstTime = companies.length === 0;

    // Payload
    const payload = {
      userId: user._id.toString(),
      companies: companies.map((c) => c._id.toString()),
    };

    // Sign JWT
    const token = jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: "7d",
    });

    // Set cookie
    const response = NextResponse.json({
      message: `Welcome ${user.username}!`,
      firstTime,
      user: { id: user._id, username: user.username },
    });

    response.cookies.set("authToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // must be true in prod for HTTPS
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // 'none' for cross-site cookies
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Server error. Please try again later." },
      { status: 500 }
    );
  }
}
