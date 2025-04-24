import dbConnect from "@/lib/dbConnect";
import User from "@/models/UserModel";
import { NextResponse, NextRequest } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const users = await User.find({}, { password: 0 }).lean();
    return NextResponse.json(users);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
