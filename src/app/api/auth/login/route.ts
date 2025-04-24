import dbConnect from "@/lib/dbConnect";
import User from "@/models/UserModel";
import { comparePassword } from "@/utils/auth";
import { setToken } from "@/utils/cookies";
import { generateToken } from "@/utils/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password"
    );

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 400 }
      );
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 400 }
      );
    }

    const { password: _, ...userWithoutPassword } = user.toObject();

    const token = generateToken({ user: userWithoutPassword });
    setToken(token);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("Error during login:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
