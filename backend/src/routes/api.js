import { Router } from 'express';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import { db } from '../db/index.js';
import {
  users,
  doctorProfiles,
  doctorPatients,
  diseaseScans,
  healthMetrics,
  medicalReports,
} from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';
import { uploadToR2 } from '../utils/r2.js';

const router = Router();

// Configure Multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB limit
  },
});

// Middleware to extract authenticated user from proxy headers
const authenticateProxyUser = (req, res, next) => {
  const userId = req.headers['x-user-id'];
  const userRole = req.headers['x-user-role'];

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized. Missing x-user-id header.' });
  }

  req.user = {
    id: userId,
    role: userRole,
  };
  next();
};

// ==========================================
// 1. PROXY ENDPOINTS (Models & Chatbot)
// ==========================================

async function streamProxy(targetBaseUrl, req, res) {
  // Strip '/models' or '/chatbot' prefix from path
  const subPath = req.path.replace(/^\/(models|chatbot)/, '');
  const queryString = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
  const targetUrl = `${targetBaseUrl}${subPath}${queryString}`;

  const headers = {};
  Object.keys(req.headers).forEach((key) => {
    if (!['host', 'content-length', 'connection'].includes(key.toLowerCase())) {
      headers[key] = req.headers[key];
    }
  });

  try {
    const fetchOptions = {
      method: req.method,
      headers: headers,
    };

    if (req.method === 'POST' || req.method === 'PUT') {
      if (req.body && typeof req.body === 'object') {
        fetchOptions.body = JSON.stringify(req.body);
        fetchOptions.headers['content-type'] = 'application/json';
      } else {
        fetchOptions.body = req.body;
      }
    }

    const response = await fetch(targetUrl, fetchOptions);

    res.status(response.status);
    response.headers.forEach((val, key) => {
      res.setHeader(key, val);
    });

    if (response.body) {
      const reader = response.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
    }
    res.end();
  } catch (err) {
    console.error(`[Proxy Error to ${targetUrl}]`, err);
    res.status(502).json({ error: `Bad Gateway: ${err.message}` });
  }
}

// Models Service Proxy (port 8000)
router.all(/^\/models/, (req, res) => {
  const modelsUrl = process.env.MODELS_URL || 'http://localhost:8000';
  return streamProxy(modelsUrl, req, res);
});

// Chatbot Service Proxy (port 8001)
router.all(/^\/chatbot/, (req, res) => {
  const chatbotUrl = process.env.NEXT_PUBLIC_CHATBOT_URL || 'http://localhost:8001';
  return streamProxy(chatbotUrl, req, res);
});

// ==========================================
// 2. REGISTER
// ==========================================
router.post('/register', async (req, res) => {
  try {
    const { email, password, fullName, role } = req.body;

    if (!email || !password || !fullName || !role) {
      return res.status(400).json({ message: 'All fields (email, password, fullName, role) are required.' });
    }

    if (role !== 'PATIENT' && role !== 'DOCTOR') {
      return res.status(400).json({ message: 'Invalid role. Role must be PATIENT or DOCTOR.' });
    }

    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()));

    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [newUser] = await db
      .insert(users)
      .values({
        email: email.toLowerCase().trim(),
        passwordHash,
        fullName,
        role,
        onboardingComplete: false,
      })
      .returning();

    return res.status(201).json({
      message: 'User registered successfully.',
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: error.message || 'An error occurred during registration.' });
  }
});

// ==========================================
// 3. GET DOCTORS
// ==========================================
router.get('/doctors', async (req, res) => {
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

    return res.json(doctorsList);
  } catch (error) {
    console.error('Error fetching doctors:', error);
    return res.status(500).json({ message: error.message || 'An error occurred while fetching doctors.' });
  }
});

// ==========================================
// 4. ONBOARDING
// ==========================================
router.post('/onboarding', authenticateProxyUser, upload.single('profileImage'), async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      fullName,
      dob,
      gender,
      bloodGroup,
      heightCm,
      weightKg,
      emergencyContact,
      selectedDoctorId,
      defaultIcon,
      licenseNumber,
      specialization,
      yearsExperience: yearsExperienceStr,
      bio,
      hospitalAffiliation,
    } = req.body;

    let profileImageUrl = defaultIcon || '/avatars/avatar1.png';

    if (req.file) {
      profileImageUrl = await uploadToR2(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype || 'image/jpeg',
        'profile-images'
      );
    }

    const [userRecord] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, userId));

    const role = userRecord?.role || req.user.role;

    if (role === 'PATIENT') {
      await db.transaction(async (tx) => {
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

        if (selectedDoctorId) {
          const existingConnection = await tx
            .select()
            .from(doctorPatients)
            .where(eq(doctorPatients.patientId, userId));

          if (existingConnection.length > 0) {
            await tx
              .delete(doctorPatients)
              .where(eq(doctorPatients.patientId, userId));
          }

          await tx.insert(doctorPatients).values({
            doctorId: selectedDoctorId,
            patientId: userId,
            status: 'ACTIVE',
          });
        }
      });
    } else if (role === 'DOCTOR') {
      if (!licenseNumber) {
        return res.status(400).json({ message: 'License number is required for doctor profile.' });
      }

      const yearsExperience = yearsExperienceStr ? parseInt(yearsExperienceStr, 10) : null;

      await db.transaction(async (tx) => {
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

    return res.json({
      message: 'Onboarding completed successfully.',
      user: {
        id: userId,
        role,
        onboardingComplete: true,
        profileImageUrl,
      },
    });
  } catch (error) {
    console.error('Onboarding error:', error);
    return res.status(500).json({ message: error.message || 'An error occurred during onboarding.' });
  }
});

// ==========================================
// 5. GET DOCTOR PATIENTS
// ==========================================
router.get('/doctor/patients', authenticateProxyUser, async (req, res) => {
  try {
    if (req.user.role !== 'DOCTOR') {
      return res.status(403).json({ message: 'Access denied. Doctors only.' });
    }

    const userId = req.user.id;

    const [doctor] = await db
      .select()
      .from(doctorProfiles)
      .where(eq(doctorProfiles.userId, userId));

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found.' });
    }

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
      .where(eq(users.role, 'PATIENT'));

    const patientDetails = await Promise.all(
      allPatients.map(async (patient) => {
        const scans = await db
          .select()
          .from(diseaseScans)
          .where(eq(diseaseScans.patientId, patient.id));

        const metrics = await db
          .select()
          .from(healthMetrics)
          .where(eq(healthMetrics.patientId, patient.id));

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

    return res.json({
      doctorProfileId: doctor.id,
      patients: patientDetails,
    });
  } catch (error) {
    console.error('Error fetching doctor patients:', error);
    return res.status(500).json({ message: error.message || 'An error occurred while fetching patients.' });
  }
});

// ==========================================
// 6. DOCTOR ASSIGN
// ==========================================
router.post('/doctor/assign', authenticateProxyUser, async (req, res) => {
  try {
    const { doctorId } = req.body;
    const patientId = req.user.id;

    if (!doctorId) {
      return res.status(400).json({ message: 'Doctor ID is required.' });
    }

    const existingConnection = await db
      .select()
      .from(doctorPatients)
      .where(eq(doctorPatients.patientId, patientId));

    await db.transaction(async (tx) => {
      if (existingConnection.length > 0) {
        await tx
          .delete(doctorPatients)
          .where(eq(doctorPatients.patientId, patientId));
      }

      await tx.insert(doctorPatients).values({
        doctorId,
        patientId,
        status: 'ACTIVE',
      });
    });

    return res.json({ message: 'Doctor assigned successfully.' });
  } catch (error) {
    console.error('Error assigning doctor:', error);
    return res.status(500).json({ message: error.message || 'An error occurred during doctor assignment.' });
  }
});

// ==========================================
// 7. POST SCAN
// ==========================================
router.post('/scans', authenticateProxyUser, upload.single('file'), async (req, res) => {
  try {
    const patientId = req.user.id;
    const { scanType, predictionResult: predictionResultStr, modelInputMetadata: modelInputMetadataStr } = req.body;

    if (!scanType || !predictionResultStr) {
      return res.status(400).json({ message: 'Missing required fields scanType or predictionResult' });
    }

    const predictionResult = JSON.parse(predictionResultStr);
    const modelInputMetadata = modelInputMetadataStr ? JSON.parse(modelInputMetadataStr) : null;

    let inputImageUrl = null;
    let r2Key = null;

    if (req.file) {
      const publicUrl = await uploadToR2(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype || 'image/png',
        'disease-scans'
      );
      inputImageUrl = publicUrl;

      const baseUrl = (process.env.R2_PUBLIC_URL || '').replace(/\/$/, '');
      if (publicUrl.startsWith(baseUrl)) {
        r2Key = publicUrl.substring(baseUrl.length + 1);
      }
    }

    const [insertedScan] = await db
      .insert(diseaseScans)
      .values({
        patientId,
        scanType,
        inputImageUrl,
        r2Key,
        modelInputMetadata,
        predictionResult,
        status: 'PENDING',
      })
      .returning();

    let aiExplanation = `Successfully completed ${scanType.replace('_', ' ')} analysis.`;
    let aiSuggestions = [];
    let medicines = [];
    let affectedParts = [];

    const apiKey = process.env.OPENCODE_ZEN_KEY;
    const model = process.env.OPENCODE_ZEN_MODEL || 'deepseek-v4-flash-free';

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

        const response = await fetch('https://opencode.ai/zen/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: 'You are a professional medical assistant AI. Respond only in raw JSON matching the requested schema.' },
              { role: 'user', content: prompt }
            ],
            temperature: 0.2,
          }),
        });

        if (response.ok) {
          const completion = await response.json();
          let content = completion.choices?.[0]?.message?.content || '';
          content = content.replace(/```json/g, '').replace(/```/g, '').trim();

          const parsed = JSON.parse(content);
          if (parsed.ai_explanation) aiExplanation = parsed.ai_explanation;
          if (Array.isArray(parsed.ai_suggestions)) aiSuggestions = parsed.ai_suggestions;
          if (Array.isArray(parsed.medicines)) medicines = parsed.medicines;
          if (Array.isArray(parsed.affected_parts)) affectedParts = parsed.affected_parts;
        }
      } catch (err) {
        console.error('Failed to fetch suggestions from OpenCode Zen API:', err);
      }
    }

    if (aiSuggestions.length === 0) {
      aiSuggestions = ['Consult a healthcare professional for a detailed evaluation.', 'Monitor your condition and schedule regular checkups.'];
    }
    if (affectedParts.length === 0) {
      if (scanType === 'BONE_FRACTURE') affectedParts = ['skeleton'];
      else if (scanType === 'BRAIN_TUMOR') affectedParts = ['brain'];
      else if (scanType === 'ECG' || scanType === 'HEART') affectedParts = ['cardiovascular system'];
      else if (scanType === 'SKIN') affectedParts = ['skin'];
      else if (scanType === 'CHEST') affectedParts = ['chest', 'lungs'];
      else affectedParts = ['general anatomy'];
    }
    if (medicines.length === 0) {
      if (scanType === 'BONE_FRACTURE' && predictionResult.diagnosis === 'fractured') {
        medicines = ['Pain relievers (e.g., Acetaminophen, Ibuprofen)', 'Calcium & Vitamin D supplements'];
      } else if (scanType === 'BRAIN_TUMOR' && predictionResult.tumor_found) {
        medicines = ['Corticosteroids (to reduce swelling)', 'Anticonvulsants (if seizures occur)'];
      } else if (scanType === 'ECG' && predictionResult.diagnosis !== 'Normal Sinus Rhythm') {
        medicines = ['Beta-blockers', 'Antiarrhythmic drugs'];
      } else if (scanType === 'HEART' && predictionResult.risk_prediction === 1) {
        medicines = ['Aspirin', 'Beta-blockers or Statins'];
      } else if (scanType === 'SKIN' && predictionResult.diagnosis !== 'Benign_tumors') {
        medicines = ['Topical corticosteroids', 'Antifungals or Antibiotics (if infected)'];
      } else {
        medicines = ['None currently recommended. Refer to your physician.'];
      }
    }

    const [updatedScan] = await db
      .update(diseaseScans)
      .set({
        aiExplanation,
        aiSuggestions,
        medicines,
        affectedParts,
        status: 'COMPLETED',
        completedAt: new Date(),
      })
      .where(eq(diseaseScans.id, insertedScan.id))
      .returning();

    return res.json(updatedScan);
  } catch (error) {
    console.error('Error creating disease scan:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// ==========================================
// 8. POST MEDICAL REPORT
// ==========================================
router.post('/medical-reports', authenticateProxyUser, upload.single('file'), async (req, res) => {
  try {
    const patientId = req.user.id;
    const { title, description, reportType, reportDate } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Title is required.' });
    }

    let fileUrl = null;
    let r2Key = null;
    let fileType = null;
    let aiSummary = null;

    if (req.file) {
      fileType = req.file.mimetype || 'application/octet-stream';
      const publicUrl = await uploadToR2(
        req.file.buffer,
        req.file.originalname,
        fileType,
        'medical-reports'
      );
      fileUrl = publicUrl;

      const baseUrl = (process.env.R2_PUBLIC_URL || '').replace(/\/$/, '');
      if (publicUrl.startsWith(baseUrl)) {
        r2Key = publicUrl.substring(baseUrl.length + 1);
      }

      if (fileType.startsWith('image/')) {
        const apiKey = process.env.OPENCODE_ZEN_KEY;
        const model = process.env.OPENCODE_ZEN_MODEL || 'deepseek-v4-flash-free';

        if (apiKey) {
          try {
            const prompt = `You are a medical AI assistant. A patient uploaded a medical image file named "${req.file.originalname}" with the title "${title}"${description ? ` and description: "${description}"` : ''}. Generate a concise, professional clinical summary (2-4 sentences) of what this report likely contains and any key observations. Respond with plain text only.`;
            const response = await fetch('https://opencode.ai/zen/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model,
                messages: [
                  { role: 'system', content: 'You are a clinical AI assistant. Be concise and professional.' },
                  { role: 'user', content: prompt },
                ],
                temperature: 0.2,
              }),
            });

            if (response.ok) {
              const data = await response.json();
              const summary = data.choices?.[0]?.message?.content?.trim();
              if (summary) aiSummary = summary;
            }
          } catch (e) {
            console.error('AI summary generation failed:', e);
          }
        }
      }

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
        reportType: reportType || null,
        fileUrl,
        r2Key,
        fileType,
        aiSummary: aiSummary ? { summary: aiSummary } : null,
        reportDate: reportDate || null,
      })
      .returning();

    return res.json(created);
  } catch (error) {
    console.error('Error creating medical report:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// ==========================================
// 9. GET MEDICAL HISTORY
// ==========================================
router.get('/medical-history', authenticateProxyUser, async (req, res) => {
  try {
    const patientId = req.user.id;

    const scans = await db
      .select()
      .from(diseaseScans)
      .where(eq(diseaseScans.patientId, patientId))
      .orderBy(desc(diseaseScans.createdAt));

    const reports = await db
      .select()
      .from(medicalReports)
      .where(eq(medicalReports.patientId, patientId))
      .orderBy(desc(medicalReports.uploadedAt));

    return res.json({ scans, reports });
  } catch (error) {
    console.error('Error fetching medical history:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// ==========================================
// 10. POST USER PROFILE IMAGE
// ==========================================
router.post('/user/profile-image', authenticateProxyUser, upload.single('file'), async (req, res) => {
  try {
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided.' });
    }

    const publicUrl = await uploadToR2(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype || 'image/jpeg',
      'profile-images'
    );

    await db
      .update(users)
      .set({
        profileImageUrl: publicUrl,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return res.json({
      success: true,
      message: 'Profile image updated successfully.',
      profileImageUrl: publicUrl,
    });
  } catch (error) {
    console.error('[Profile Image Upload Error]', error);
    return res.status(500).json({ message: error.message || 'Failed to upload profile image.' });
  }
});

export default router;
