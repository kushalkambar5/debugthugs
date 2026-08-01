import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { diseaseScans } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { uploadToR2 } from "@/lib/r2";

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

    const patientId = session.user.id;

    // 2. Parse form-data
    const formData = await req.formData();
    const scanType = formData.get("scanType") as string;
    const predictionResultStr = formData.get("predictionResult") as string;
    const modelInputMetadataStr = formData.get("modelInputMetadata") as string;
    const file = formData.get("file") as File | null;

    if (!scanType || !predictionResultStr) {
      return NextResponse.json(
        { message: "Missing required fields scanType or predictionResult" },
        { status: 400 }
      );
    }

    const predictionResult = JSON.parse(predictionResultStr);
    const modelInputMetadata = modelInputMetadataStr ? JSON.parse(modelInputMetadataStr) : null;

    // 3. Handle file upload to Cloudflare R2 if present
    let inputImageUrl: string | null = null;
    let r2Key: string | null = null;

    if (file && file.size > 0 && typeof file !== "string") {
      const bytes = await file.arrayBuffer();
      const publicUrl = await uploadToR2(
        bytes,
        file.name,
        file.type || "image/png",
        "disease-scans"
      );
      inputImageUrl = publicUrl;

      // Extract r2Key from publicUrl
      const baseUrl = (process.env.R2_PUBLIC_URL || "").replace(/\/$/, "");
      if (publicUrl.startsWith(baseUrl)) {
        r2Key = publicUrl.substring(baseUrl.length + 1);
      }
    }

    // 4. Save initial scan record (PENDING)
    const [insertedScan] = await db
      .insert(diseaseScans)
      .values({
        patientId,
        scanType: scanType as any,
        inputImageUrl,
        r2Key,
        modelInputMetadata,
        predictionResult,
        status: "PENDING",
      })
      .returning();

    // 5. Query OpenCode Zen API for suggestions, medicines, and affected parts
    let aiExplanation = `Successfully completed ${scanType.replace("_", " ")} analysis.`;
    let aiSuggestions: string[] = [];
    let medicines: string[] = [];
    let affectedParts: string[] = [];

    const apiKey = process.env.OPENCODE_ZEN_KEY;
    const model = process.env.OPENCODE_ZEN_MODEL || "deepseek-v4-flash-free";

    if (apiKey) {
      try {
        const prompt = `
          You are an advanced medical assistant AI.
          Analyze the following medical diagnostic scan and its prediction result:
          
          Scan Type: ${scanType}
          Model Inputs / Patient Metadata: ${JSON.stringify(modelInputMetadata, null, 2)}
          Prediction Result / Model Output: ${JSON.stringify(predictionResult, null, 2)}
          
          Generate:
          1. A detailed medical explanation of the results (ai_explanation). Keep it clear and professional.
          2. Actionable recommendations or suggestions for the patient (ai_suggestions).
          3. Common medications or treatments associated with this diagnosis (medicines).
          4. Affected body parts or anatomical systems involved (affected_parts).
          
          You MUST respond ONLY with a raw JSON object. Do not include markdown code block formatting (like \`\`\`json).
          
          JSON Format:
          {
            "ai_explanation": "Detailed explanation here...",
            "ai_suggestions": ["Suggestion 1", "Suggestion 2", ...],
            "medicines": ["Medicine 1", "Medicine 2", ...],
            "affected_parts": ["Affected Part 1", "Affected Part 2", ...]
          }
        `;

        const response = await fetch("https://opencode.ai/zen/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: "system", content: "You are a professional medical assistant AI. Respond only in raw JSON matching the requested schema." },
              { role: "user", content: prompt }
            ],
            temperature: 0.2,
          }),
        });

        if (response.ok) {
          const completion = await response.json();
          let content = completion.choices?.[0]?.message?.content || "";
          
          // Strip any markdown code block wraps if LLM returns them
          content = content.replace(/```json/g, "").replace(/```/g, "").trim();
          
          const parsed = JSON.parse(content);
          if (parsed.ai_explanation) aiExplanation = parsed.ai_explanation;
          if (Array.isArray(parsed.ai_suggestions)) aiSuggestions = parsed.ai_suggestions;
          if (Array.isArray(parsed.medicines)) medicines = parsed.medicines;
          if (Array.isArray(parsed.affected_parts)) affectedParts = parsed.affected_parts;
        } else {
          console.error("OpenCode Zen API returned non-ok status:", response.status);
        }
      } catch (err) {
        console.error("Failed to fetch suggestions from OpenCode Zen API:", err);
      }
    }

    // Fallbacks if LLM fails or returns empty lists
    if (aiSuggestions.length === 0) {
      aiSuggestions = ["Consult a healthcare professional for a detailed evaluation.", "Monitor your condition and schedule regular checkups."];
    }
    if (affectedParts.length === 0) {
      if (scanType === "BONE_FRACTURE") affectedParts = ["skeleton"];
      else if (scanType === "BRAIN_TUMOR") affectedParts = ["brain"];
      else if (scanType === "ECG" || scanType === "HEART") affectedParts = ["cardiovascular system"];
      else if (scanType === "SKIN") affectedParts = ["skin"];
      else if (scanType === "CHEST") affectedParts = ["chest", "lungs"];
      else affectedParts = ["general anatomy"];
    }
    if (medicines.length === 0) {
      // Basic medications based on predictions
      if (scanType === "BONE_FRACTURE" && predictionResult.diagnosis === "fractured") {
        medicines = ["Pain relievers (e.g., Acetaminophen, Ibuprofen)", "Calcium & Vitamin D supplements"];
      } else if (scanType === "BRAIN_TUMOR" && predictionResult.tumor_found) {
        medicines = ["Corticosteroids (to reduce swelling)", "Anticonvulsants (if seizures occur)"];
      } else if (scanType === "ECG" && predictionResult.diagnosis !== "Normal Sinus Rhythm") {
        medicines = ["Beta-blockers", "Antiarrhythmic drugs"];
      } else if (scanType === "HEART" && predictionResult.risk_prediction === 1) {
        medicines = ["Aspirin", "Beta-blockers or Statins"];
      } else if (scanType === "SKIN" && predictionResult.diagnosis !== "Benign_tumors") {
        medicines = ["Topical corticosteroids", "Antifungals or Antibiotics (if infected)"];
      } else {
        medicines = ["None currently recommended. Refer to your physician."];
      }
    }

    // 6. Update the scan record (COMPLETED)
    const [updatedScan] = await db
      .update(diseaseScans)
      .set({
        aiExplanation,
        aiSuggestions,
        medicines,
        affectedParts,
        status: "COMPLETED",
        completedAt: new Date(),
      })
      .where(eq(diseaseScans.id, insertedScan.id))
      .returning();

    return NextResponse.json(updatedScan);

  } catch (error: any) {
    console.error("Error creating disease scan:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}
