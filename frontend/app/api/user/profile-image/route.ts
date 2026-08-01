import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { uploadToR2 } from "@/lib/r2";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { message: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file || file.size === 0) {
      return NextResponse.json(
        { message: "No image file provided." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const publicUrl = await uploadToR2(
      bytes,
      file.name,
      file.type || "image/jpeg",
      "profile-images"
    );

    // Update database record
    await db
      .update(users)
      .set({
        profileImageUrl: publicUrl,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return NextResponse.json({
      success: true,
      message: "Profile image updated successfully.",
      profileImageUrl: publicUrl,
    });
  } catch (error: any) {
    console.error("[Profile Image Upload Error]", error);
    return NextResponse.json(
      { message: error.message || "Failed to upload profile image." },
      { status: 500 }
    );
  }
}
