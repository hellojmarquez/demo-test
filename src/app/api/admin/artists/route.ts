import dbConnect from "@/lib/dbConnect";
import { FugaAPI } from "@/services/FugaAPI";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const allArtists = await FugaAPI.getArtists({});

    return NextResponse.json(allArtists.artist);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
