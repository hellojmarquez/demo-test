import { NextRequest } from "next/server";

export const getTokenBack = async (req: NextRequest) =>
  req.cookies.get("token")?.value ||
  req.headers.get("Authorization")?.split(" ")[1] ||
  "";
