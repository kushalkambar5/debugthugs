import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { doctorProfiles, doctorPatients } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { message: "Unauthorized. Please log in first." },
        { status: 401 }
      );
    }

    if (session.user.role !== "DOCTOR") {
      return NextResponse.json(
        { message: "Access denied. Doctors only." },
        { status: 403 }
      );
    }

    const { patientId, assign } = await req.json();

    if (!patientId) {
      return NextResponse.json(
        { message: "Patient ID is required." },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // Get doctor profile
    const [doctor] = await db
      .select()
      .from(doctorProfiles)
      .where(eq(doctorProfiles.userId, userId));

    if (!doctor) {
      return NextResponse.json(
        { message: "Doctor profile not found." },
        { status: 404 }
      );
    }

    if (assign) {
      // Create connection: delete any existing connection for this patient first (a patient has one primary doctor)
      await db.transaction(async (tx) => {
        await tx
          .delete(doctorPatients)
          .where(eq(doctorPatients.patientId, patientId));

        await tx.insert(doctorPatients).values({
          doctorId: doctor.id,
          patientId: patientId,
          status: "ACTIVE",
        });
      });

      return NextResponse.json({ message: "Patient assigned successfully." });
    } else {
      // Remove connection
      await db
        .delete(doctorPatients)
        .where(
          and(
            eq(doctorPatients.doctorId, doctor.id),
            eq(doctorPatients.patientId, patientId)
          )
        );

      return NextResponse.json({ message: "Patient unassigned successfully." });
    }
  } catch (error: any) {
    console.error("Error assigning doctor patient:", error);
    return NextResponse.json(
      { message: error.message || "An error occurred while linking patient." },
      { status: 500 }
    );
  }
}
