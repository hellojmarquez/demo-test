import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { Log } from "@/models/Log";
import { validateAdmin } from "@/middleware/validateAdmin";
import { getTokenBack } from "@/utils/tokenBack";
import { verifyToken } from "@/utils/jwt";
import User from "@/models/UserModel";

export async function GET(req: NextRequest) {
  const unauthorizedResponse = await validateAdmin(req);
  if (unauthorizedResponse) return unauthorizedResponse;

  try {
    await dbConnect();

    const logs = await Log.find({}).sort({ createdAt: -1 }).select("-__v -_id").limit(100);
    return NextResponse.json(logs);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
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

    const user = session.user;

    const me = await User.findById(user._id, { password: 0 });
    if (!me) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { message, level = "info", metadata = {} } = body;

    const newLog = new Log({
      message,
      level,
      metadata,
      user: user._id,
    });

    await newLog.save();

    console.log("New log:", newLog);
    return NextResponse.json(newLog, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
