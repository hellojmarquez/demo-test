import dbConnect from "@/lib/dbConnect";
import User from "@/models/UserModel";
import { encryptPassword } from "@/utils/auth";
import { setToken } from "@/utils/cookies";
import { generateToken, verifyToken } from "@/utils/jwt";
import { getTokenBack } from "@/utils/tokenBack";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { name, email, password, picture } = await req.json();

    const token = await getTokenBack(req);

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = verifyToken(token);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const labelUser = await User.findOne({ email: session.user.email });
    if (!labelUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isLabel = labelUser.role === "label";

    if (!isLabel) {
      return NextResponse.json(
        { error: "You need to be a label to create a user" },
        { status: 401 }
      );
    }

    const hashedPassword = await encryptPassword(password);

    const user = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      picture,
    });

    await user.save();

    labelUser.subaccounts.push(user._id);

    await labelUser.save();

    return NextResponse.json({
      user,
      message: "User created successfully",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await dbConnect();
    const token = await getTokenBack(req);

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, picture } = await req.json();

    const session = verifyToken(token);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = session.user._id;

    const user = await User.findById(id);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (name) user.name = name;
    if (picture) user.picture = picture;

    user.updatedAt = new Date();

    await user.save();

    const { password: _, ...userWithoutPassword } = user.toObject();

    const newToken = await generateToken({
      user: userWithoutPassword,
    });

    setToken(newToken);

    return NextResponse.json({
      user,
      message: "User updated successfully",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
