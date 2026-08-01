import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { users, doctorProfiles, doctorPatients, diseaseScans, healthMetrics, medicalReports } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET() {
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

    // Fetch all patients and join with doctor_patients
    const allPatients = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        dateOfBirth: users.dateOfBirth,
        gender: users.gender,
        bloodGroup: users.bloodGroup,
        heightCm: users.heightCm,
        weightKg: users.weightKg,
        allergiesJson: users.allergiesJson,
        chronicConditionsJson: users.chronicConditionsJson,
        currentMedicationsJson: users.currentMedicationsJson,
        emergencyContactPhone: users.emergencyContactPhone,
        profileImageUrl: users.profileImageUrl,
        assignedDoctorId: doctorPatients.doctorId,
        assignedAt: doctorPatients.assignedAt,
        assignmentStatus: doctorPatients.status,
      })
      .from(users)
      .leftJoin(doctorPatients, eq(users.id, doctorPatients.patientId))
      .where(eq(users.role, "PATIENT"));

    // Fetch details for each patient (scans, metrics, reports) to provide a rich visual card
    const patientDetails = await Promise.all(
      allPatients.map(async (patient) => {
        // Get disease scans
        const scans = await db
          .select()
          .from(diseaseScans)
          .where(eq(diseaseScans.patientId, patient.id));

        // Get health metrics
        const metrics = await db
          .select()
          .from(healthMetrics)
          .where(eq(healthMetrics.patientId, patient.id));

        // Get medical reports
        const reports = await db
          .select()
          .from(medicalReports)
          .where(eq(medicalReports.patientId, patient.id));

        return {
          ...patient,
          scans,
          metrics,
          reports,
        };
      })
    );

    return NextResponse.json({
      doctorProfileId: doctor.id,
      patients: patientDetails,
    });
  } catch (error: any) {
    console.error("Error fetching doctor patients:", error);
    return NextResponse.json(
      { message: error.message || "An error occurred while fetching patients." },
      { status: 500 }
    );
  }
}
