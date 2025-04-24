import dbConnect from "@/lib/dbConnect";
import User from "@/models/UserModel";
import { FugaAPI } from "@/services/FugaAPI";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; artists: number[] } }
) {
  try {
    dbConnect();

    const { id } = params;

    const { artists } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    if (!artists) {
      return NextResponse.json(
        { error: "Artists are required" },
        { status: 400 }
      );
    }

    const user = await User.findById(id);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    user.artists = artists;

    await user.save();

    return NextResponse.json({ message: "User updated successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const user = await User.findById(id);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { artist } = await FugaAPI.getArtists({});

    const artists = artist.filter((artist: any) =>
      user.artists.includes(artist.id)
    );

    return NextResponse.json(artists);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
