import dbConnect from "@/lib/dbConnect";
import User from "@/models/UserModel";
import { FugaAPI } from "@/services/FugaAPI";
import { verifyToken } from "@/utils/jwt";
import { getTokenBack } from "@/utils/tokenBack";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await dbConnect(); // Ensure database connection

    // Parse FormData from the request
    const formData = await req.formData();
    const body = Object.fromEntries(formData.entries()); // Convert FormData to an object

    const { file, totalfilesize, assetId, type } = body as {
      file: File;
      totalfilesize: string;
      assetId: string;
      type: string;
    };

    if (!file || !totalfilesize) {
      return NextResponse.json(
        { error: "Missing required fields: uuid, file, or totalfilesize" },
        { status: 400 }
      );
    }

    // Retrieve the token from the request
    const token = await getTokenBack(req);

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify the token to retrieve the session
    const session = verifyToken(token);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user._id;

    // Check if the user exists in the database
    const existingUser = await User.findById(userId);
    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log("Received FormData body:", body);

    // Upload file via FugaAPI
    const uploadUuid = await FugaAPI.uploadFile(
      file,
      Number(totalfilesize),
      assetId,
      file.name,
      type,
      type === "audio" ? 1024 * 1024 * 2 : 0
    );

    // const uploadUuid = await FugaAPI.uploadLargeFileUsingMultipart(
    //   file,
    //   assetId,
    //   type
    // );

    return NextResponse.json({
      success: true,
      message: "File uploaded successfully",
      data: { uploadUuid },
    });
  } catch (error: any) {
    console.error("Error during POST request:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
