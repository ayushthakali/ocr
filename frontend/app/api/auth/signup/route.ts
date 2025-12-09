import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    await connectDB();
    const { username, email, password } = await req.json();

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return NextResponse.json(
        { error: "Email already exists." },
        { status: 409 }
      );
    }

    // Create new user
    const user = await User.create({ username, email, password });

    return NextResponse.json(
      {
        message: "Account created successfully!",
        user: { username: user.username, email: user.email },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Error in api call", err);

    // Return server error
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
