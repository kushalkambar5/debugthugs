import { Router } from 'express';
import { db } from '../db/index.js';
import {
  dietPlans,
  doctorProfiles,
  doctorPatients,
  healthMetrics,
  medicalReports,
  users,
} from '../db/schema.js';
import { eq, and, desc } from 'drizzle-orm';

const router = Router();

// Auth middleware — reads x-user-id / x-user-role injected by the Next.js proxy
const auth = (req, res, next) => {
  const userId = req.headers['x-user-id'];
  const userRole = req.headers['x-user-role'];
  if (!userId) return res.status(401).json({ error: 'Unauthorized. Missing x-user-id header.' });
  req.user = { id: userId, role: userRole };
  next();
};


// ==========================================
// HELPERS
// ==========================================

/** Shared doctor-patient ownership verification */
async function verifyDoctorPatient(req, res, patientId) {
  if (req.user.role !== 'DOCTOR') {
    res.status(403).json({ error: 'Only doctors can perform this action.' });
    return { ok: false };
  }

  const [doctorProfile] = await db
    .select()
    .from(doctorProfiles)
    .where(eq(doctorProfiles.userId, req.user.id));

  if (!doctorProfile) {
    res.status(404).json({ error: 'Doctor profile not found.' });
    return { ok: false };
  }

  const [relation] = await db
    .select()
    .from(doctorPatients)
    .where(
      and(
        eq(doctorPatients.doctorId, doctorProfile.id),
        eq(doctorPatients.patientId, patientId),
        eq(doctorPatients.isActive, true)
      )
    );

  if (!relation) {
    res.status(403).json({ error: 'This patient is not assigned to you.' });
    return { ok: false };
  }

  return { ok: true, doctorProfile };
}

/**
 * Fetch patient context for AI: profile, last 30 metrics, last 5 reports.
 */
async function buildPatientContext(patientId) {
  const [patient] = await db
    .select()
    .from(users)
    .where(eq(users.id, patientId));

  const metrics = await db
    .select()
    .from(healthMetrics)
    .where(eq(healthMetrics.patientId, patientId))
    .orderBy(desc(healthMetrics.metricDate))
    .limit(30);

  const reports = await db
    .select()
    .from(medicalReports)
    .where(eq(medicalReports.patientId, patientId))
    .orderBy(desc(medicalReports.uploadedAt))
    .limit(5);

  return { patient, metrics, reports };
}

/**
 * Call OpenCode Zen (OpenAI-compatible) to generate a diet plan.
 */
async function generateDietWithAI(patientContext, extraInstructions = '') {
  const { patient, metrics, reports } = patientContext;

  const systemPrompt = `You are an expert clinical nutritionist AI. Given a patient's health profile, 
recent health metrics (from wearable devices), and medical reports, create a comprehensive, 
medically-appropriate diet plan. Return ONLY valid JSON in the exact schema specified.`;

  const recentMetricsSummary = metrics
    .slice(0, 7)
    .map(
      (m) =>
        `Date: ${m.metricDate} | Steps: ${m.steps ?? 'N/A'} | Calories Burnt: ${m.caloriesBurnt ?? 'N/A'} ` +
        `| Heart Rate Avg: ${m.heartRateAvg ?? 'N/A'} | Sleep: ${m.sleepDurationMinutes ?? 'N/A'} min ` +
        `| SpO2: ${m.spo2Percentage ?? 'N/A'}%`
    )
    .join('\n');

  const reportsSummary = reports
    .map((r) => `[${r.reportType}] ${r.title}: ${r.description ?? ''} — AI Summary: ${JSON.stringify(r.aiSummary)}`)
    .join('\n');

  const userPrompt = `
## Patient Profile
- Name: ${patient.fullName}
- Age: ${patient.dateOfBirth ? Math.floor((Date.now() - new Date(patient.dateOfBirth)) / 3.154e10) : 'Unknown'}
- Gender: ${patient.gender ?? 'Unknown'}
- Blood Group: ${patient.bloodGroup ?? 'Unknown'}
- Height: ${patient.heightCm ?? 'Unknown'} cm
- Weight: ${patient.weightKg ?? 'Unknown'} kg
- Allergies: ${patient.allergiesJson ?? 'None'}
- Chronic Conditions: ${patient.chronicConditionsJson ?? 'None'}
- Current Medications: ${patient.currentMedicationsJson ?? 'None'}

## Recent Health Metrics (Last 7 Days)
${recentMetricsSummary || 'No wearable data available.'}

## Recent Medical Reports (Last 5)
${reportsSummary || 'No reports available.'}

${extraInstructions ? `## Additional Instructions from Doctor\n${extraInstructions}` : ''}

## Required Output (JSON only, no markdown, no explanation)
{
  "title": "string — descriptive plan name",
  "healthGoals": ["goal1", "goal2"],
  "nutritionalTargets": {
    "dailyCalories": number,
    "proteinG": number,
    "carbsG": number,
    "fatG": number,
    "fiberG": number,
    "waterMl": number
  },
  "dailySchedule": {
    "breakfast": { "time": "HH:MM", "meals": ["item1", "item2"], "notes": "optional" },
    "midMorningSnack": { "time": "HH:MM", "meals": [], "notes": "" },
    "lunch": { "time": "HH:MM", "meals": [], "notes": "" },
    "eveningSnack": { "time": "HH:MM", "meals": [], "notes": "" },
    "dinner": { "time": "HH:MM", "meals": [], "notes": "" }
  },
  "aiRationale": "string — clinical reasoning for this plan (2-3 paragraphs)",
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD"
}`;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENCODE_ZEN_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.OPENCODE_ZEN_MODEL || 'deepseek/deepseek-chat-v3-0324:free',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.4,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenCode Zen API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const rawContent = data.choices?.[0]?.message?.content ?? '';

  // Strip markdown code fences if the model wraps JSON in them
  const jsonMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, rawContent];
  const jsonStr = jsonMatch[1].trim();

  return JSON.parse(jsonStr);
}

// ==========================================
// DOCTOR ROUTES
// ==========================================

/**
 * POST /api/diet/generate/:patientId
 * AI generates a diet plan for the patient using their health history.
 * Doctor can pass optional `extraInstructions` in the body.
 */
router.post('/generate/:patientId', auth, async (req, res) => {
  const { patientId } = req.params;
  const { extraInstructions } = req.body;

  const { ok, doctorProfile } = await verifyDoctorPatient(req, res, patientId);
  if (!ok) return;

  try {
    const context = await buildPatientContext(patientId);
    const aiPlan = await generateDietWithAI(context, extraInstructions);

    const [saved] = await db
      .insert(dietPlans)
      .values({
        patientId,
        doctorId: doctorProfile.id,
        createdBy: req.user.id,
        title: aiPlan.title,
        status: 'AI_GENERATED',
        startDate: aiPlan.startDate || null,
        endDate: aiPlan.endDate || null,
        dailySchedule: aiPlan.dailySchedule,
        nutritionalTargets: aiPlan.nutritionalTargets,
        healthGoals: aiPlan.healthGoals,
        aiRationale: aiPlan.aiRationale,
      })
      .returning();

    return res.status(201).json({ dietPlan: saved });
  } catch (err) {
    console.error('[diet/generate]', err);
    return res.status(500).json({ error: 'Failed to generate diet plan.', detail: err.message });
  }
});

/**
 * POST /api/diet/:patientId
 * Doctor creates a manual diet plan for their patient.
 */
router.post('/:patientId', auth, async (req, res) => {
  const { patientId } = req.params;
  const { ok, doctorProfile } = await verifyDoctorPatient(req, res, patientId);
  if (!ok) return;

  const {
    title,
    dailySchedule,
    nutritionalTargets,
    healthGoals,
    doctorNotes,
    startDate,
    endDate,
    status,
  } = req.body;

  try {
    const [saved] = await db
      .insert(dietPlans)
      .values({
        patientId,
        doctorId: doctorProfile.id,
        createdBy: req.user.id,
        title: title || 'Diet Plan',
        status: status || 'ACTIVE',
        startDate: startDate || null,
        endDate: endDate || null,
        dailySchedule: dailySchedule || null,
        nutritionalTargets: nutritionalTargets || null,
        healthGoals: healthGoals || null,
        doctorNotes: doctorNotes || null,
      })
      .returning();

    return res.status(201).json({ dietPlan: saved });
  } catch (err) {
    console.error('[diet POST]', err);
    return res.status(500).json({ error: 'Failed to create diet plan.', detail: err.message });
  }
});

/**
 * PUT /api/diet/:dietId
 * Doctor updates any field of a diet plan they own (patient must be theirs).
 */
router.put('/:dietId', auth, async (req, res) => {
  if (req.user.role !== 'DOCTOR') {
    return res.status(403).json({ error: 'Only doctors can update diet plans.' });
  }

  try {
    const [existing] = await db
      .select()
      .from(dietPlans)
      .where(eq(dietPlans.id, req.params.dietId));

    if (!existing) return res.status(404).json({ error: 'Diet plan not found.' });

    const { ok } = await verifyDoctorPatient(req, res, existing.patientId);
    if (!ok) return;

    const {
      title,
      dailySchedule,
      nutritionalTargets,
      healthGoals,
      doctorNotes,
      startDate,
      endDate,
      status,
      aiRationale,
    } = req.body;

    const updates = { updatedAt: new Date() };
    if (title !== undefined) updates.title = title;
    if (dailySchedule !== undefined) updates.dailySchedule = dailySchedule;
    if (nutritionalTargets !== undefined) updates.nutritionalTargets = nutritionalTargets;
    if (healthGoals !== undefined) updates.healthGoals = healthGoals;
    if (doctorNotes !== undefined) updates.doctorNotes = doctorNotes;
    if (startDate !== undefined) updates.startDate = startDate;
    if (endDate !== undefined) updates.endDate = endDate;
    if (aiRationale !== undefined) updates.aiRationale = aiRationale;
    if (status !== undefined) updates.status = status;

    // If doctor edits AI plan, mark it DOCTOR_VERIFIED
    if (existing.status === 'AI_GENERATED' && !status) {
      updates.status = 'DOCTOR_VERIFIED';
    }

    const [updated] = await db
      .update(dietPlans)
      .set(updates)
      .where(eq(dietPlans.id, req.params.dietId))
      .returning();

    return res.json({ dietPlan: updated });
  } catch (err) {
    console.error('[diet PUT]', err);
    return res.status(500).json({ error: 'Failed to update diet plan.', detail: err.message });
  }
});

/**
 * DELETE /api/diet/:dietId
 * Doctor deletes a diet plan (hard delete — plans can be regenerated).
 */
router.delete('/:dietId', auth, async (req, res) => {
  if (req.user.role !== 'DOCTOR') {
    return res.status(403).json({ error: 'Only doctors can delete diet plans.' });
  }

  try {
    const [existing] = await db
      .select()
      .from(dietPlans)
      .where(eq(dietPlans.id, req.params.dietId));

    if (!existing) return res.status(404).json({ error: 'Diet plan not found.' });

    const { ok } = await verifyDoctorPatient(req, res, existing.patientId);
    if (!ok) return;

    await db.delete(dietPlans).where(eq(dietPlans.id, req.params.dietId));

    return res.json({ message: 'Diet plan deleted.' });
  } catch (err) {
    console.error('[diet DELETE]', err);
    return res.status(500).json({ error: 'Failed to delete diet plan.', detail: err.message });
  }
});

/**
 * GET /api/diet/patient/:patientId
 * Doctor gets all diet plans for their patient (most recent first).
 */
router.get('/patient/:patientId', auth, async (req, res) => {
  const { patientId } = req.params;
  const { ok } = await verifyDoctorPatient(req, res, patientId);
  if (!ok) return;

  try {
    const plans = await db
      .select()
      .from(dietPlans)
      .where(eq(dietPlans.patientId, patientId))
      .orderBy(desc(dietPlans.createdAt));

    return res.json({ dietPlans: plans });
  } catch (err) {
    console.error('[diet GET patient]', err);
    return res.status(500).json({ error: 'Failed to fetch diet plans.' });
  }
});

// ==========================================
// PATIENT ROUTES
// ==========================================

/**
 * GET /api/diet/my
 * Patient gets their own active/latest diet plan.
 */
router.get('/my', auth, async (req, res) => {
  try {
    const plans = await db
      .select()
      .from(dietPlans)
      .where(eq(dietPlans.patientId, req.user.id))
      .orderBy(desc(dietPlans.createdAt))
      .limit(5);

    return res.json({ dietPlans: plans });
  } catch (err) {
    console.error('[diet GET my]', err);
    return res.status(500).json({ error: 'Failed to fetch diet plans.' });
  }
});

/**
 * GET /api/diet/:dietId
 * Get a single diet plan by ID. Patient can only view their own; doctor can view their patient's.
 */
router.get('/:dietId', auth, async (req, res) => {
  try {
    const [plan] = await db
      .select()
      .from(dietPlans)
      .where(eq(dietPlans.id, req.params.dietId));

    if (!plan) return res.status(404).json({ error: 'Diet plan not found.' });

    if (req.user.role === 'PATIENT' && plan.patientId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied.' });
    }
    if (req.user.role === 'DOCTOR') {
      const { ok } = await verifyDoctorPatient(req, res, plan.patientId);
      if (!ok) return;
    }

    return res.json({ dietPlan: plan });
  } catch (err) {
    console.error('[diet GET :dietId]', err);
    return res.status(500).json({ error: 'Failed to fetch diet plan.' });
  }
});

export default router;
