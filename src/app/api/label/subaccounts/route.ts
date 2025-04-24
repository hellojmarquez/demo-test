import dbConnect from "@/lib/dbConnect";
import User from "@/models/UserModel";
import { encryptPassword } from "@/utils/auth";
import { generateToken, verifyToken } from "@/utils/jwt";
import { getTokenBack } from "@/utils/tokenBack";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const token = await getTokenBack(req);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const session = verifyToken(token);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const labelUser = await User.findOne({ email: session.user.email });
    if (!labelUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isLabel = labelUser.role === "label";

    if (!isLabel) {
      return NextResponse.json(
        { error: "You need to be a label to create a user" },
        { status: 401 }
      );
    }

    const subaccounts = await User.find({
      _id: { $in: labelUser.subaccounts },
    });

    return NextResponse.json({
      data: subaccounts,
      message: "User created successfully",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
