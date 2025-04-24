import dbConnect from "@/lib/dbConnect";
import User from "@/models/UserModel";
import { FugaAPI } from "@/services/FugaAPI";
import { generateToken, verifyToken } from "@/utils/jwt";
import { getTokenBack } from "@/utils/tokenBack";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; fileId: string } }
) {
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

    if (!me) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (me.artists.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    const asset = await FugaAPI.getAssetById(params.id);

    if (!asset) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // const isAllowed = me.artists.some((artistId = me) =>
    //   asset.artists.some(
    //     (productArtist: any) => productArtist.id.toString() === artistId
    //   )
    // );

    // if (!isAllowed) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    await FugaAPI.deleteFile(params.id, params.fileId);

    return NextResponse.json({ message: "Asset deleted" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
