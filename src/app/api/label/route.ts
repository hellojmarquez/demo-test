import dbConnect from "@/lib/dbConnect";
import User from "@/models/UserModel";
import { encryptPassword } from "@/utils/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { name, email, password, picture } = await req.json();

    const hashedPassword = await encryptPassword(password);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      picture,
      role: "label",
    });

    await user.save();

    return NextResponse.json({
      data: user,
      message: "User created successfully",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}


