import dbConnect from "@/lib/dbConnect";
import User from "@/models/UserModel";
import { FugaAPI } from "@/services/FugaAPI";
import { comparePassword } from "@/utils/auth";
import { setToken } from "@/utils/cookies";
import { generateToken, verifyToken } from "@/utils/jwt";
import { getTokenBack } from "@/utils/tokenBack";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const data = await req.json();

    const product = await FugaAPI.createProduct({
      ...data,
      label: 1002045729979,
    });

    return NextResponse.json({
      message: "Product created successfully",
      id: product.id,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// export async function GET(req: NextRequest) {
//   try {
//     await dbConnect();

//     const products = await FugaAPI.getProducts({ page: 0, pageSize: 20 });

//     return NextResponse.json(products);
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

    // const { product: products } = await FugaAPI.getProducts({});

    const products = await Promise.all(
      me.artists.map((artistId: any) => FugaAPI.getProducts({ artistId }))
    );

    const removedDuplicates = products.reduce((acc: any, curr: any) => {
      const ids = acc.map((p: any) => p.id);
      const newProducts = curr.filter((p: any) => !ids.includes(p.id));
      return [...acc, ...newProducts];
    }, []);

    const filteredProducts = removedDuplicates.filter(
      (product: any) =>
        product.tags.length < 1 ||
        product.tags.some((tag: any) => tag.name === "Takedown")
    );

    return NextResponse.json(filteredProducts);
  } catch (error: any) {
    console.error("Error fetching products:", error.message);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
