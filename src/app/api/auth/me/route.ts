import dbConnect from "@/lib/dbConnect";
import User from "@/models/UserModel";
import { verifyToken } from "@/utils/jwt";
import { getTokenBack } from "@/utils/tokenBack";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    dbConnect();
    const token = await getTokenBack(req);

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = verifyToken(token);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user;

    const me = await User.findById(user._id, { password: 0 });

    return NextResponse.json(me);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
