import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Company from "@/models/Company";
import jwt from "jsonwebtoken";

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json(
        { error: "Authorization code missing" },
        { status: 400 }
      );
    }

    //Fetch google token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: "http://localhost:3000/api/auth/google/callback",
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch Google token" },
        { status: 401 }
      );
    }
    const tokenData = await tokenRes.json(); //{"access_token": "ya29.a0...",  "expires_in": 3599,  "token_type": "Bearer"}

    //Fetch user details
    const userRes = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      }
    );
    if (!userRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch Google user" },
        { status: 401 }
      );
    }
    const googleUser = await userRes.json(); //googleUser={id,email,name}

    if (!googleUser.id || !googleUser.email) {
      return NextResponse.json(
        { error: "Invalid Google user data" },
        { status: 401 }
      );
    }

    // Find user
    let user = await User.findOne({ googleId: googleUser.id });
    if (!user) {
      user = await User.create({
        username: googleUser.name,
        email: googleUser.email,
        googleId: googleUser.id,
      });
    }

    //Check for companies
    const companies = await Company.find({ user_id: user._id });
    const firstTime = companies.length === 0;

    // Sign JWT
    const token = jwt.sign(
      { userId: user._id.toString() },
      process.env.JWT_SECRET!,
      { expiresIn: "1d" }
    );

    const redirectTo = firstTime ? "/set-company" : "/chat";
    const response = NextResponse.redirect(new URL(redirectTo, req.url));
    
    // Set cookiee
    response.cookies.set("authToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // must be true in prod for HTTPS
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // 'none' for cross-site cookies
      path: "/",
      maxAge: 24 * 60 * 60, // 1 day
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
