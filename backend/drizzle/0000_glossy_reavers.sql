CREATE TYPE "public"."blood_group" AS ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-');--> statement-breakpoint
CREATE TYPE "public"."diet_plan_status" AS ENUM('DRAFT', 'AI_GENERATED', 'DOCTOR_VERIFIED', 'ACTIVE', 'COMPLETED');--> statement-breakpoint
CREATE TYPE "public"."doctor_patient_status" AS ENUM('ACTIVE', 'INACTIVE');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('MALE', 'FEMALE', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."report_type" AS ENUM('LAB', 'IMAGING', 'PRESCRIPTION', 'DISCHARGE', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('PATIENT', 'DOCTOR');--> statement-breakpoint
CREATE TYPE "public"."scan_status" AS ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."scan_type" AS ENUM('BONE_FRACTURE', 'BRAIN_TUMOR', 'ECG', 'HEART', 'SKIN', 'CHEST');--> statement-breakpoint
CREATE TYPE "public"."severity" AS ENUM('MILD', 'MODERATE', 'SEVERE', 'CRITICAL');--> statement-breakpoint
CREATE TYPE "public"."health_metric_source" AS ENUM('HEALTH_CONNECT', 'MANUAL');--> statement-breakpoint
CREATE TYPE "public"."suggestion_category" AS ENUM('DIET', 'EXERCISE', 'MEDICATION', 'LIFESTYLE', 'FOLLOWUP');--> statement-breakpoint
CREATE TYPE "public"."suggestion_status" AS ENUM('PENDING_REVIEW', 'DOCTOR_APPROVED', 'DOCTOR_MODIFIED', 'DOCTOR_REJECTED', 'AUTO_APPROVED');--> statement-breakpoint
CREATE TABLE "ai_suggestions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"doctor_id" uuid,
	"category" "suggestion_category",
	"suggestion_text" text NOT NULL,
	"ai_rationale" text,
	"status" "suggestion_status" DEFAULT 'PENDING_REVIEW',
	"doctor_feedback" text,
	"modified_suggestion" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"reviewed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "body_map_conditions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"body_part_id" varchar(100) NOT NULL,
	"condition_name" varchar(255) NOT NULL,
	"severity" "severity",
	"description" text,
	"source_scan_id" uuid,
	"source_report_id" uuid,
	"is_active" boolean DEFAULT true,
	"diagnosed_at" timestamp DEFAULT now(),
	"resolved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "chat_contexts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"librechat_conversation_id" varchar(255),
	"context_snapshot" text,
	"last_synced_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "diet_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"created_by" uuid,
	"title" varchar(255),
	"status" "diet_plan_status" DEFAULT 'DRAFT',
	"start_date" date,
	"end_date" date,
	"daily_schedule" jsonb,
	"nutritional_targets" jsonb,
	"health_goals" jsonb,
	"ai_rationale" text,
	"doctor_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "disease_scans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"scan_type" "scan_type" NOT NULL,
	"input_image_url" varchar(512),
	"cloudinary_public_id" varchar(255),
	"model_input_metadata" jsonb,
	"prediction_result" jsonb,
	"status" "scan_status" DEFAULT 'PENDING',
	"ai_explanation" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "doctor_patients" (
	"doctor_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL,
	"status" "doctor_patient_status" DEFAULT 'ACTIVE',
	CONSTRAINT "doctor_patients_doctor_id_patient_id_pk" PRIMARY KEY("doctor_id","patient_id")
);
--> statement-breakpoint
CREATE TABLE "doctor_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"license_number" varchar(100) NOT NULL,
	"specialization" varchar(255),
	"years_experience" integer,
	"bio" text,
	"hospital_affiliation" varchar(255),
	"is_verified" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "doctor_profiles_license_number_unique" UNIQUE("license_number")
);
--> statement-breakpoint
CREATE TABLE "health_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"steps" integer,
	"heart_rate_avg" integer,
	"heart_rate_min" integer,
	"heart_rate_max" integer,
	"calories_burnt" numeric(8, 2),
	"distance_meters" numeric(10, 2),
	"spo2_percentage" numeric(5, 2),
	"sleep_duration_minutes" integer,
	"sleep_stages" jsonb,
	"metric_date" date NOT NULL,
	"source" "health_metric_source",
	"synced_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unq_patient_metric_date" UNIQUE("patient_id","metric_date")
);
--> statement-breakpoint
CREATE TABLE "medical_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"report_type" "report_type",
	"file_url" varchar(512),
	"cloudinary_public_id" varchar(255),
	"file_type" varchar(50),
	"extracted_data" jsonb,
	"ai_summary" jsonb,
	"report_date" date,
	"uploaded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"date_of_birth" date,
	"gender" "gender",
	"blood_group" "blood_group",
	"height_cm" numeric(5, 2),
	"weight_kg" numeric(5, 2),
	"allergies_json" text,
	"chronic_conditions_json" text,
	"current_medications_json" text,
	"emergency_contact_phone" varchar(50),
	"role" "role" DEFAULT 'PATIENT' NOT NULL,
	"onboarding_complete" boolean DEFAULT false,
	"profile_image_url" varchar(512),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "ai_suggestions" ADD CONSTRAINT "ai_suggestions_patient_id_users_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_suggestions" ADD CONSTRAINT "ai_suggestions_doctor_id_doctor_profiles_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctor_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "body_map_conditions" ADD CONSTRAINT "body_map_conditions_patient_id_users_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "body_map_conditions" ADD CONSTRAINT "body_map_conditions_source_scan_id_disease_scans_id_fk" FOREIGN KEY ("source_scan_id") REFERENCES "public"."disease_scans"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "body_map_conditions" ADD CONSTRAINT "body_map_conditions_source_report_id_medical_reports_id_fk" FOREIGN KEY ("source_report_id") REFERENCES "public"."medical_reports"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_contexts" ADD CONSTRAINT "chat_contexts_patient_id_users_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diet_plans" ADD CONSTRAINT "diet_plans_patient_id_users_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disease_scans" ADD CONSTRAINT "disease_scans_patient_id_users_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doctor_patients" ADD CONSTRAINT "doctor_patients_doctor_id_doctor_profiles_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctor_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doctor_patients" ADD CONSTRAINT "doctor_patients_patient_id_users_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doctor_profiles" ADD CONSTRAINT "doctor_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "health_metrics" ADD CONSTRAINT "health_metrics_patient_id_users_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medical_reports" ADD CONSTRAINT "medical_reports_patient_id_users_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;