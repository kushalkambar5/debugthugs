import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { users, doctorProfiles, doctorPatients } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { promises as fs } from "fs";
import path from "path";

export async function POST(req: Request) {
  try {
    // 1. Authenticate user
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { message: "Unauthorized. Please log in first." },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // 2. Parse form data
    const formData = await req.formData();
    
    // User fields
    const fullName = formData.get("fullName") as string;
    const dob = formData.get("dob") as string; // YYYY-MM-DD
    const gender = formData.get("gender") as any; // MALE | FEMALE | OTHER
    const bloodGroup = formData.get("bloodGroup") as any;
    const heightCm = formData.get("heightCm") as string;
    const weightKg = formData.get("weightKg") as string;
    const emergencyContact = formData.get("emergencyContact") as string;
    
    // Image handling
    const profileImageFile = formData.get("profileImage") as File | null;
    const defaultIcon = formData.get("defaultIcon") as string;
    let profileImageUrl = defaultIcon || "/avatars/avatar1.png";

    if (profileImageFile && profileImageFile.size > 0 && typeof profileImageFile !== "string") {
      const bytes = await profileImageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadDir = path.join(process.cwd(), "public", "uploads");
      await fs.mkdir(uploadDir, { recursive: true });

      const sanitizedFilename = `${Date.now()}-${profileImageFile.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      const filePath = path.join(uploadDir, sanitizedFilename);
      await fs.writeFile(filePath, buffer);
      profileImageUrl = `/uploads/${sanitizedFilename}`;
    }

    // Get current role of the user (or read from session)
    const [userRecord] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, userId));

    const role = userRecord?.role || session.user.role;

    // 3. Save onboarding details based on role
    if (role === "PATIENT") {
      const selectedDoctorId = formData.get("selectedDoctorId") as string; // doctor profile UUID

      await db.transaction(async (tx) => {
        // Update user record
        await tx
          .update(users)
          .set({
            fullName: fullName || undefined,
            dateOfBirth: dob || null,
            gender: gender || null,
            bloodGroup: bloodGroup || null,
            heightCm: heightCm ? heightCm : null,
            weightKg: weightKg ? weightKg : null,
            emergencyContactPhone: emergencyContact || null,
            profileImageUrl,
            onboardingComplete: true,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId));

        // If a doctor was selected, link them
        if (selectedDoctorId) {
          // Check if patient-doctor connection already exists
          const existingConnection = await tx
            .select()
            .from(doctorPatients)
            .where(
              eq(doctorPatients.patientId, userId)
            );

          // We assume one primary active doctor or delete previous active links
          if (existingConnection.length > 0) {
            await tx
              .delete(doctorPatients)
              .where(eq(doctorPatients.patientId, userId));
          }

          await tx.insert(doctorPatients).values({
            doctorId: selectedDoctorId,
            patientId: userId,
            status: "ACTIVE",
          });
        }
      });

    } else if (role === "DOCTOR") {
      const licenseNumber = formData.get("licenseNumber") as string;
      const specialization = formData.get("specialization") as string;
      const yearsExperienceStr = formData.get("yearsExperience") as string;
      const yearsExperience = yearsExperienceStr ? parseInt(yearsExperienceStr, 10) : null;
      const bio = formData.get("bio") as string;
      const hospitalAffiliation = formData.get("hospitalAffiliation") as string;

      if (!licenseNumber) {
        return NextResponse.json(
          { message: "License number is required for doctor profile." },
          { status: 400 }
        );
      }

      await db.transaction(async (tx) => {
        // Update user record
        await tx
          .update(users)
          .set({
            fullName: fullName || undefined,
            dateOfBirth: dob || null,
            gender: gender || null,
            bloodGroup: bloodGroup || null,
            heightCm: heightCm ? heightCm : null,
            weightKg: weightKg ? weightKg : null,
            emergencyContactPhone: emergencyContact || null,
            profileImageUrl,
            onboardingComplete: true,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId));

        // Create or update doctor profile
        const [existingProfile] = await tx
          .select()
          .from(doctorProfiles)
          .where(eq(doctorProfiles.userId, userId));

        if (existingProfile) {
          await tx
            .update(doctorProfiles)
            .set({
              licenseNumber,
              specialization: specialization || null,
              yearsExperience,
              bio: bio || null,
              hospitalAffiliation: hospitalAffiliation || null,
              isVerified: true,
            })
            .where(eq(doctorProfiles.userId, userId));
        } else {
          await tx.insert(doctorProfiles).values({
            userId,
            licenseNumber,
            specialization: specialization || null,
            yearsExperience,
            bio: bio || null,
            hospitalAffiliation: hospitalAffiliation || null,
            isVerified: true,
          });
        }
      });
    }

    return NextResponse.json({
      message: "Onboarding completed successfully.",
      user: {
        id: userId,
        role,
        onboardingComplete: true,
        profileImageUrl,
      },
    });
  } catch (error: any) {
    console.error("Onboarding error:", error);
    return NextResponse.json(
      { message: error.message || "An error occurred during onboarding." },
      { status: 500 }
    );
  }
}
