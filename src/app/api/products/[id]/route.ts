import dbConnect from "@/lib/dbConnect";
import User from "@/models/UserModel";
import { FugaAPI } from "@/services/FugaAPI";
import { comparePassword } from "@/utils/auth";
import { setToken } from "@/utils/cookies";
import { generateToken, verifyToken } from "@/utils/jwt";
import { getTokenBack } from "@/utils/tokenBack";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
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

    const product = await FugaAPI.getProductById(params.id);

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const artists = product.artists.map((artist: any) => artist.id);

    console.log(me.artists, artists);

    const isAllowed = me.artists.some((artistId = me) =>
      artists.some((productArtist: any) => productArtist === artistId)
    );

    if (!isAllowed) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(product);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
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

    const product = await FugaAPI.getProductById(params.id);

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const artists = product.artists.map((artist: any) => artist.id);

    console.log(me.artists, artists);

    const isAllowed = me.artists.some((artistId = me) =>
      artists.some((productArtist: any) => productArtist === artistId)
    );

    if (!isAllowed) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const updatedProduct = await FugaAPI.updateProductById(params.id, body);

    return NextResponse.json(updatedProduct);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
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

    const body = await req.json();

    const product = await FugaAPI.createProduct(body);

    return NextResponse.json(product);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
