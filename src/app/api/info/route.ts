import dbConnect from "@/lib/dbConnect";
import User from "@/models/UserModel";
import { FugaAPI } from "@/services/FugaAPI";
import { comparePassword } from "@/utils/auth";
import { setToken } from "@/utils/cookies";
import { generateToken, verifyToken } from "@/utils/jwt";
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

    const info = FugaAPI.getInfo();

    if (!info) {
      return NextResponse.json({ error: "Info not found" }, { status: 404 });
    }

    return NextResponse.json(info);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
