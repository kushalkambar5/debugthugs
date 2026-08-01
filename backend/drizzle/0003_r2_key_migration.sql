ALTER TABLE "disease_scans" RENAME COLUMN "cloudinary_public_id" TO "r2_key";--> statement-breakpoint
ALTER TABLE "medical_reports" RENAME COLUMN "cloudinary_public_id" TO "r2_key";
