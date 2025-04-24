import dbConnect from "@/lib/dbConnect";
import User from "@/models/UserModel";
import { FugaAPI } from "@/services/FugaAPI";
import { getTokenBack } from "@/utils/tokenBack";
import { verifyToken } from "@/utils/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    // Connect to the database
    await dbConnect();

    // Retrieve and verify token
    const token = await getTokenBack(req);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    // Extract query parameters from the request URL
    const { searchParams } = new URL(req.url);
    const selection_type = searchParams.get("selection_type");
    const sale_type = searchParams.get("sale_type");
    const start_date = searchParams.get("start_date");
    const end_date = searchParams.get("end_date");
    console.log(selection_type)


    // Validate required parameters
    if (!selection_type || !sale_type || !start_date || !end_date) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Optional parameters
    const product_id = searchParams.get("product_id")
      ? Number(searchParams.get("product_id"))
      : undefined;
    const artist_id = searchParams.get("artist_id")
      ? Number(searchParams.get("artist_id"))
      : undefined;
    const asset_id = searchParams.get("asset_id")
      ? Number(searchParams.get("asset_id"))
      : undefined;
    const asset_ids = searchParams.get("asset_ids")
      ? searchParams?.get("asset_ids")?.split(",").map(Number) 
      : undefined;
    const release_project_id = searchParams.get("release_project_id")
      ? Number(searchParams.get("release_project_id"))
      : undefined;
    const territory_id = searchParams.get("territory_id") || undefined;
    const dsp_id = searchParams.get("dsp_id")
      ? Number(searchParams.get("dsp_id"))
      : undefined;

    // Call FugaAPI.getTrends with validated parameters
    const trends = await FugaAPI.getTrends({
      selection_type,
      sale_type,
      start_date,
      end_date,
      product_id,
      artist_id,
      asset_id,
      asset_ids,
      release_project_id,
      territory_id,
      dsp_id,
    });

    return NextResponse.json(trends, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching trends:", error.message);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
