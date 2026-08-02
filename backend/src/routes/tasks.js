import { Router } from 'express';
import { db } from '../db/index.js';
import {
  tasks,
  taskHistory,
  doctorProfiles,
  doctorPatients,
  healthMetrics,
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

/** Euclidean GCD for two positive integers */
function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b);
}

/** GCD across an array of integers */
function gcdArray(arr) {
  return arr.reduce((acc, val) => gcd(acc, val), arr[0]);
}

/**
 * Verify the authenticated doctor owns the doctorProfile AND
 * the given patient is assigned to them (ACTIVE relationship).
 * Returns { doctorProfile, ok } — if !ok, response has already been sent.
 */
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
 * Given a patient's health metrics, compute and upsert task_history rows
 * for all active goal_based tasks of that patient.
 */
async function syncGoalHistory(patientId) {
  const goalTasks = await db
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.patientId, patientId),
        eq(tasks.taskType, 'goal_based'),
        eq(tasks.isActive, true)
      )
    );

  if (!goalTasks.length) return;

  // Use gcd of all intervals as the sync cadence (informational for now)
  const intervals = goalTasks
    .map((t) => t.freqIntervalDays)
    .filter(Boolean);
  const syncInterval = intervals.length ? gcdArray(intervals) : 1;

  // Fetch last N days of health metrics for this patient
  const recentMetrics = await db
    .select()
    .from(healthMetrics)
    .where(eq(healthMetrics.patientId, patientId))
    .orderBy(desc(healthMetrics.metricDate))
    .limit(60); // look back 60 days max

  const metricsByDate = {};
  for (const m of recentMetrics) {
    metricsByDate[m.metricDate] = m;
  }

  const today = new Date().toISOString().split('T')[0];

  for (const task of goalTasks) {
    const interval = task.freqIntervalDays || 1;
    const createdDate = new Date(task.createdAt).toISOString().split('T')[0];

    // Generate all period dates from task creation up to today
    let cursor = new Date(createdDate);
    const end = new Date(today);

    while (cursor <= end) {
      const periodDate = cursor.toISOString().split('T')[0];

      // Check if a history row already exists for this task + period
      const [existing] = await db
        .select()
        .from(taskHistory)
        .where(
          and(
            eq(taskHistory.taskId, task.id),
            eq(taskHistory.periodDate, periodDate)
          )
        );

      const metric = metricsByDate[periodDate];
      let actualValue = null;
      let isDone = false;

      if (metric) {
        if (task.goalMetric === 'daily_steps') {
          actualValue = metric.steps;
        } else if (task.goalMetric === 'calories_burn') {
          actualValue = metric.caloriesBurnt;
        } else if (task.goalMetric === 'min_sleep') {
          actualValue = metric.sleepDurationMinutes;
        }

        if (actualValue !== null && task.goalTarget !== null) {
          isDone = parseFloat(actualValue) >= parseFloat(task.goalTarget);
        }
      }

      if (!existing) {
        await db.insert(taskHistory).values({
          taskId: task.id,
          periodDate,
          isDone,
          actualValue: actualValue !== null ? String(actualValue) : null,
        });
      } else if (metric && !existing.isDone) {
        // Update if we now have metric data and it wasn't done before
        await db
          .update(taskHistory)
          .set({ isDone, actualValue: actualValue !== null ? String(actualValue) : null })
          .where(eq(taskHistory.id, existing.id));
      }

      // Advance by interval
      cursor.setDate(cursor.getDate() + interval);
    }
  }

  return { syncInterval };
}

// ==========================================
// DOCTOR ROUTES
// ==========================================

/**
 * POST /api/tasks/:patientId
 * Doctor creates a task for their patient.
 */
router.post('/:patientId', auth, async (req, res) => {
  const { patientId } = req.params;
  const { ok, doctorProfile } = await verifyDoctorPatient(req, res, patientId);
  if (!ok) return;

  const {
    taskType,
    taskName,
    taskDescription,
    goalMetric,
    goalTarget,
    freqIntervalDays,
  } = req.body;

  if (!taskType || !['task_based', 'goal_based'].includes(taskType)) {
    return res.status(400).json({ error: 'taskType must be "task_based" or "goal_based".' });
  }

  if (taskType === 'goal_based') {
    if (!goalMetric || !['daily_steps', 'calories_burn', 'min_sleep'].includes(goalMetric)) {
      return res.status(400).json({ error: 'goalMetric must be one of: daily_steps, calories_burn, min_sleep.' });
    }
    if (!freqIntervalDays || freqIntervalDays < 1) {
      return res.status(400).json({ error: 'freqIntervalDays is required for goal_based tasks.' });
    }
    if (!goalTarget) {
      return res.status(400).json({ error: 'goalTarget is required for goal_based tasks.' });
    }
  } else {
    if (!taskName) {
      return res.status(400).json({ error: 'taskName is required for task_based tasks.' });
    }
  }

  try {
    const [newTask] = await db
      .insert(tasks)
      .values({
        doctorId: doctorProfile.id,
        patientId,
        taskType,
        taskName: taskType === 'task_based' ? taskName : null,
        taskDescription: taskDescription || null,
        goalMetric: taskType === 'goal_based' ? goalMetric : null,
        goalTarget: taskType === 'goal_based' ? String(goalTarget) : null,
        freqIntervalDays: taskType === 'goal_based' ? Number(freqIntervalDays) : null,
      })
      .returning();

    return res.status(201).json({ task: newTask });
  } catch (err) {
    console.error('[tasks POST]', err);
    return res.status(500).json({ error: 'Failed to create task.', detail: err.message });
  }
});

/**
 * GET /api/tasks/patient/:patientId
 * Doctor gets all tasks for their patient.
 */
router.get('/patient/:patientId', auth, async (req, res) => {
  const { patientId } = req.params;
  const { ok } = await verifyDoctorPatient(req, res, patientId);
  if (!ok) return;

  try {
    const result = await db
      .select()
      .from(tasks)
      .where(eq(tasks.patientId, patientId))
      .orderBy(desc(tasks.createdAt));

    return res.json({ tasks: result });
  } catch (err) {
    console.error('[tasks GET patient]', err);
    return res.status(500).json({ error: 'Failed to fetch tasks.' });
  }
});

/**
 * PUT /api/tasks/:taskId
 * Doctor updates a task (must own the task's patient).
 */
router.put('/:taskId', auth, async (req, res) => {
  if (req.user.role !== 'DOCTOR') {
    return res.status(403).json({ error: 'Only doctors can update tasks.' });
  }

  try {
    const [existing] = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, req.params.taskId));

    if (!existing) return res.status(404).json({ error: 'Task not found.' });

    const { ok } = await verifyDoctorPatient(req, res, existing.patientId);
    if (!ok) return;

    const {
      taskName,
      taskDescription,
      goalTarget,
      freqIntervalDays,
      isActive,
    } = req.body;

    const updates = { updatedAt: new Date() };
    if (taskName !== undefined) updates.taskName = taskName;
    if (taskDescription !== undefined) updates.taskDescription = taskDescription;
    if (goalTarget !== undefined) updates.goalTarget = String(goalTarget);
    if (freqIntervalDays !== undefined) updates.freqIntervalDays = Number(freqIntervalDays);
    if (isActive !== undefined) updates.isActive = Boolean(isActive);

    const [updated] = await db
      .update(tasks)
      .set(updates)
      .where(eq(tasks.id, req.params.taskId))
      .returning();

    return res.json({ task: updated });
  } catch (err) {
    console.error('[tasks PUT]', err);
    return res.status(500).json({ error: 'Failed to update task.', detail: err.message });
  }
});

/**
 * DELETE /api/tasks/:taskId
 * Doctor soft-deletes (deactivates) a task.
 */
router.delete('/:taskId', auth, async (req, res) => {
  if (req.user.role !== 'DOCTOR') {
    return res.status(403).json({ error: 'Only doctors can delete tasks.' });
  }

  try {
    const [existing] = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, req.params.taskId));

    if (!existing) return res.status(404).json({ error: 'Task not found.' });

    const { ok } = await verifyDoctorPatient(req, res, existing.patientId);
    if (!ok) return;

    const [updated] = await db
      .update(tasks)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(tasks.id, req.params.taskId))
      .returning();

    return res.json({ message: 'Task deactivated.', task: updated });
  } catch (err) {
    console.error('[tasks DELETE]', err);
    return res.status(500).json({ error: 'Failed to deactivate task.', detail: err.message });
  }
});

// ==========================================
// PATIENT ROUTES
// ==========================================

/**
 * GET /api/tasks/my
 * Patient fetches all their active tasks.
 */
router.get('/my', auth, async (req, res) => {
  try {
    const result = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.patientId, req.user.id), eq(tasks.isActive, true)))
      .orderBy(desc(tasks.createdAt));

    return res.json({ tasks: result });
  } catch (err) {
    console.error('[tasks GET my]', err);
    return res.status(500).json({ error: 'Failed to fetch tasks.' });
  }
});

/**
 * POST /api/tasks/:taskId/done
 * Patient manually marks a task_based task as done for today.
 */
router.post('/:taskId/done', auth, async (req, res) => {
  try {
    const [task] = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, req.params.taskId));

    if (!task) return res.status(404).json({ error: 'Task not found.' });
    if (task.patientId !== req.user.id) {
      return res.status(403).json({ error: 'This task does not belong to you.' });
    }
    if (task.taskType !== 'task_based') {
      return res.status(400).json({ error: 'Only task_based tasks can be manually marked done. Goal-based tasks are tracked automatically.' });
    }

    const today = new Date().toISOString().split('T')[0];

    const [existing] = await db
      .select()
      .from(taskHistory)
      .where(and(eq(taskHistory.taskId, task.id), eq(taskHistory.periodDate, today)));

    let result;
    if (existing) {
      [result] = await db
        .update(taskHistory)
        .set({ isDone: true, recordedAt: new Date() })
        .where(eq(taskHistory.id, existing.id))
        .returning();
    } else {
      [result] = await db
        .insert(taskHistory)
        .values({ taskId: task.id, periodDate: today, isDone: true })
        .returning();
    }

    return res.json({ history: result });
  } catch (err) {
    console.error('[tasks/:taskId/done]', err);
    return res.status(500).json({ error: 'Failed to mark task done.', detail: err.message });
  }
});

/**
 * POST /api/tasks/:taskId/undone
 * Patient un-marks a task_based task for today.
 */
router.post('/:taskId/undone', auth, async (req, res) => {
  try {
    const [task] = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, req.params.taskId));

    if (!task) return res.status(404).json({ error: 'Task not found.' });
    if (task.patientId !== req.user.id) {
      return res.status(403).json({ error: 'This task does not belong to you.' });
    }
    if (task.taskType !== 'task_based') {
      return res.status(400).json({ error: 'Only task_based tasks support manual toggling.' });
    }

    const today = new Date().toISOString().split('T')[0];
    const [existing] = await db
      .select()
      .from(taskHistory)
      .where(and(eq(taskHistory.taskId, task.id), eq(taskHistory.periodDate, today)));

    if (existing) {
      const [result] = await db
        .update(taskHistory)
        .set({ isDone: false, recordedAt: new Date() })
        .where(eq(taskHistory.id, existing.id))
        .returning();
      return res.json({ history: result });
    }

    return res.json({ message: 'No history entry for today.' });
  } catch (err) {
    console.error('[tasks/:taskId/undone]', err);
    return res.status(500).json({ error: 'Failed to unmark task.', detail: err.message });
  }
});

// ==========================================
// HISTORY ROUTES
// ==========================================

/**
 * GET /api/tasks/:taskId/history
 * Get history entries for a task. Accessible by owner patient OR their doctor.
 */
router.get('/:taskId/history', auth, async (req, res) => {
  try {
    const [task] = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, req.params.taskId));

    if (!task) return res.status(404).json({ error: 'Task not found.' });

    // Authorization: patient can see their own, doctor can see their patient's
    if (req.user.role === 'PATIENT' && task.patientId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied.' });
    }
    if (req.user.role === 'DOCTOR') {
      const { ok } = await verifyDoctorPatient(req, res, task.patientId);
      if (!ok) return;
    }

    const history = await db
      .select()
      .from(taskHistory)
      .where(eq(taskHistory.taskId, task.id))
      .orderBy(desc(taskHistory.periodDate));

    return res.json({ task, history });
  } catch (err) {
    console.error('[tasks/:taskId/history]', err);
    return res.status(500).json({ error: 'Failed to fetch history.', detail: err.message });
  }
});

/**
 * POST /api/tasks/sync-history/:patientId
 * Called after health metrics are synced for a patient.
 * Computes and upserts task_history for all active goal_based tasks.
 * Can be called by the patient themselves or their doctor.
 */
router.post('/sync-history/:patientId', auth, async (req, res) => {
  const { patientId } = req.params;

  // Authorization
  if (req.user.role === 'PATIENT' && req.user.id !== patientId) {
    return res.status(403).json({ error: 'Access denied.' });
  }
  if (req.user.role === 'DOCTOR') {
    const { ok } = await verifyDoctorPatient(req, res, patientId);
    if (!ok) return;
  }

  try {
    const result = await syncGoalHistory(patientId);
    return res.json({ message: 'Task history synced.', ...result });
  } catch (err) {
    console.error('[sync-history]', err);
    return res.status(500).json({ error: 'Failed to sync history.', detail: err.message });
  }
});

export { syncGoalHistory };
export default router;
