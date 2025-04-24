import dbConnect from "@/lib/dbConnect";
import User from "@/models/UserModel";
import { verifyToken } from "@/utils/jwt";
import { getTokenBack } from "@/utils/tokenBack";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect();

    const token = await getTokenBack(req);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized: No token provided" }, { status: 401 });
    }

    const session = verifyToken(token);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized: Invalid token" }, { status: 401 });
    }

    const { id } = await params;


    if (!id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }
    const label = await User.findById(session.user._id);

    if (!label) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!label.subaccounts.includes(id)) {
      return NextResponse.json(
        { error: "You don't have permission to fetch this user" },
        { status: 403 }
      );
    }

    const user = await User.findById(id);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      data: user,
      message: "User fetched successfully",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}


