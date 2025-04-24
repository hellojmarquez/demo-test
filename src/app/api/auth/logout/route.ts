import { removeToken } from "@/utils/cookies";
import { verifyToken } from "@/utils/jwt";
import { saveLog } from "@/utils/logUtils";
import { getTokenBack } from "@/utils/tokenBack";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const token = await getTokenBack(req);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = verifyToken(token);
    if (!session) {
      removeToken();
      return NextResponse.redirect(`${process.env.URL}/login`);
    }

    const user = session.user;

    await saveLog("User logged out", "info", { email: user.email });

    removeToken();
    return NextResponse.redirect(`${process.env.URL}/login`);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
