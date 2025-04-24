import dbConnect from "@/lib/dbConnect";
import User from "@/models/UserModel";
import { FugaAPI } from "@/services/FugaAPI";
import { generateToken, verifyToken } from "@/utils/jwt";
import { getTokenBack } from "@/utils/tokenBack";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    dbConnect();

    const token = await getTokenBack(req);

    const { artists } = await req.json();
    const { id } = params;

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

    if (me.role !== "label") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAllowedArtist = artists.every((artist: any) =>
      me.artists.includes(artist)
    );

    if (!isAllowedArtist) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userToUpdate = await User.findByIdAndUpdate(id, { artists });

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

    const token = await getTokenBack(req);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = verifyToken(token);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;


    if (!id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const tokenUser = await User.findById(session.user._id);

    if (id !== session.user._id && tokenUser.role !== "label") {
      return NextResponse.json(
        { error: "You don't have permission to fetch this user" },
        { status: 403 }
      );
    }

    const user = await User.findById(id);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { artist } = await FugaAPI.getArtists({ page: 0, pageSize: 20 });

    const artists = artist.filter((artist: any) =>
      user.artists.includes(artist.id)
    );

    return NextResponse.json(artists);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
