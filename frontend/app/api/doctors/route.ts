import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, doctorProfiles } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const doctorsList = await db
      .select({
        profileId: doctorProfiles.id,
        userId: users.id,
        fullName: users.fullName,
        email: users.email,
        profileImageUrl: users.profileImageUrl,
        specialization: doctorProfiles.specialization,
        hospitalAffiliation: doctorProfiles.hospitalAffiliation,
        yearsExperience: doctorProfiles.yearsExperience,
        bio: doctorProfiles.bio,
      })
      .from(doctorProfiles)
      .innerJoin(users, eq(doctorProfiles.userId, users.id));

    return NextResponse.json(doctorsList);
  } catch (error: any) {
    console.error("Error fetching doctors:", error);
    return NextResponse.json(
      { message: error.message || "An error occurred while fetching doctors." },
      { status: 500 }
    );
  }
}
