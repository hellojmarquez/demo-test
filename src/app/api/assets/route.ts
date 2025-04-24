import dbConnect from "@/lib/dbConnect";
import User from "@/models/UserModel";
import { FugaAPI } from "@/services/FugaAPI";
import { comparePassword } from "@/utils/auth";
import { setToken } from "@/utils/cookies";
import { generateToken, verifyToken } from "@/utils/jwt";
import { getTokenBack } from "@/utils/tokenBack";
import { NextRequest, NextResponse } from "next/server";

// export async function POST(req: NextRequest) {
//   try {
//     await dbConnect();
//     const data = await req.json();

//     const product = await FugaAPI.createProduct({
//       ...data,
//       label: 1002045729979,
//     });

//     return NextResponse.json({ message: "Product created successfully", id: product.id });
//   } catch (error: any) {
//     return NextResponse.json({ error: error.message }, { status: 400 });
//   }
// }

export async function GET(req: NextRequest) {
  try {
    // Connect to the database
    dbConnect();

    // Retrieve token
    const token = await getTokenBack(req);

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify token
    const session = verifyToken(token);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user;

    // Find the user by ID and exclude password
    const me = await User.findById(user._id, { password: 0 });
    if (!me) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (me.artists.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    const { asset: assets } = await FugaAPI.getMyAssets({});

    console.log("assets", assets);

    const allowedArtists = me.artists;

    // Filter products based on allowed artist IDs
    const filteredAssets = assets.filter((asset: any) =>
      asset.artists.some(({ id }: any) => allowedArtists.includes(String(id)))
    );

    // Return filtered products
    return NextResponse.json(filteredAssets.reverse(), { status: 200 });
  } catch (error: any) {
    console.error("Error fetching products:", error.message);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
