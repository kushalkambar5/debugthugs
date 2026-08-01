import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { diseaseScans, medicalReports } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { message: "Unauthorized. Please log in first." },
        { status: 401 }
      );
    }

    const patientId = session.user.id;

    // Fetch disease scans for the user, most recent first
    const scans = await db
      .select()
      .from(diseaseScans)
      .where(eq(diseaseScans.patientId, patientId))
      .orderBy(desc(diseaseScans.createdAt));

    // Fetch medical reports for the user, most recent first
    const reports = await db
      .select()
      .from(medicalReports)
      .where(eq(medicalReports.patientId, patientId))
      .orderBy(desc(medicalReports.uploadedAt));

    return NextResponse.json({ scans, reports });
  } catch (error: any) {
    console.error("Error fetching medical history:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}
