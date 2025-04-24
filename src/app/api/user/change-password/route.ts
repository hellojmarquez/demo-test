import dbConnect from "@/lib/dbConnect";
import User from "@/models/UserModel";
import { comparePassword, encryptPassword } from "@/utils/auth";
import { verifyToken } from "@/utils/jwt";
import { getTokenBack } from "@/utils/tokenBack";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(req: NextRequest) {
  try {
    await dbConnect();
    const token = await getTokenBack(req);

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { password, newPassword } = await req.json();

    const session = verifyToken(token);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = session.user._id;

    const user = await User.findById(id);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isMatch = await comparePassword(password, user.password);

    user.updatedAt = new Date();

    if (!isMatch) {
      return NextResponse.json({ error: "Invalid password" }, { status: 400 });
    }

    user.password = await encryptPassword(newPassword);

    await user.save();

    return NextResponse.json({
      message: "Password updated successfully",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
