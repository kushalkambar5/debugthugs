import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, fullName, role } = body;

    // Validation
    if (!email || !password || !fullName || !role) {
      return NextResponse.json(
        { message: "All fields (email, password, fullName, role) are required." },
        { status: 400 }
      );
    }

    if (role !== "PATIENT" && role !== "DOCTOR") {
      return NextResponse.json(
        { message: "Invalid role. Role must be PATIENT or DOCTOR." },
        { status: 400 }
      );
    }

    // Check if user already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()));

    if (existingUser) {
      return NextResponse.json(
        { message: "An account with this email already exists." },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Save user to database
    const [newUser] = await db
      .insert(users)
      .values({
        email: email.toLowerCase(),
        passwordHash,
        fullName,
        role,
        onboardingComplete: false,
      })
      .returning();

    return NextResponse.json(
      {
        message: "User registered successfully.",
        user: {
          id: newUser.id,
          email: newUser.email,
          fullName: newUser.fullName,
          role: newUser.role,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: error.message || "An error occurred during registration." },
      { status: 500 }
    );
  }
}
