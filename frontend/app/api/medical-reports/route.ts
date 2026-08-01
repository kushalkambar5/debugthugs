import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { medicalReports } from "@/lib/schema";
import { uploadToR2 } from "@/lib/r2";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }
    const patientId = session.user.id;

    const formData = await req.formData();
    const title = formData.get("title") as string;
    const description = formData.get("description") as string | null;
    const reportType = formData.get("reportType") as string | null;
    const reportDate = formData.get("reportDate") as string | null;
    const file = formData.get("file") as File | null;

    if (!title) {
      return NextResponse.json({ message: "Title is required." }, { status: 400 });
    }

    let fileUrl: string | null = null;
    let r2Key: string | null = null;
    let fileType: string | null = null;
    let aiSummary: any = null;

    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer();
      fileType = file.type || "application/octet-stream";
      const publicUrl = await uploadToR2(bytes, file.name, fileType, "medical-reports");
      fileUrl = publicUrl;

      const baseUrl = (process.env.R2_PUBLIC_URL || "").replace(/\/$/, "");
      if (publicUrl.startsWith(baseUrl)) {
        r2Key = publicUrl.substring(baseUrl.length + 1);
      }

      // For images: try to generate AI summary via OpenCode Zen
      if (fileType.startsWith("image/")) {
        const apiKey = process.env.OPENCODE_ZEN_KEY;
        const model = process.env.OPENCODE_ZEN_MODEL || "deepseek-v4-flash-free";
        if (apiKey) {
          try {
            const prompt = `You are a medical AI assistant. A patient uploaded a medical image file named "${file.name}" with the title "${title}"${description ? ` and description: "${description}"` : ""}. Generate a concise, professional clinical summary (2-4 sentences) of what this report likely contains and any key observations. Respond with plain text only.`;
            const resp = await fetch("https://opencode.ai/zen/v1/chat/completions", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model,
                messages: [
                  { role: "system", content: "You are a clinical AI assistant. Be concise and professional." },
                  { role: "user", content: prompt },
                ],
                temperature: 0.2,
              }),
            });
            if (resp.ok) {
              const data = await resp.json();
              const summary = data.choices?.[0]?.message?.content?.trim();
              if (summary) aiSummary = summary;
            }
          } catch (e) {
            console.error("AI summary generation failed:", e);
          }
        }
      }

      // Fallback: use description as summary
      if (!aiSummary && description) {
        aiSummary = description;
      }
    }

    const [created] = await db
      .insert(medicalReports)
      .values({
        patientId,
        title,
        description: description || null,
        reportType: (reportType as any) || null,
        fileUrl,
        r2Key,
        fileType,
        aiSummary: aiSummary ? { summary: aiSummary } : null,
        reportDate: reportDate || null,
      })
      .returning();

    return NextResponse.json(created);
  } catch (error: any) {
    console.error("Error creating medical report:", error);
    return NextResponse.json({ message: "Internal server error", error: error.message }, { status: 500 });
  }
}
