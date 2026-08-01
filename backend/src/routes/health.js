import { Router } from 'express';
import { db } from '../db/index.js';
import { healthMetrics } from '../db/schema.js';
import { authenticateToken } from '../middleware/auth.js';
import { eq, and } from 'drizzle-orm';

const router = Router();

/**
 * Aggregates Health Connect data arrays into daily buckets.
 * Returns a map of  dateStr -> { steps, heartRateAvg, heartRateMin, heartRateMax, caloriesBurnt, distanceMeters, sleepDurationMinutes, sleepStages }
 */
function aggregateByDay(healthData) {
  const dayMap = {};

  const ensureDay = (dateStr) => {
    if (!dayMap[dateStr]) {
      dayMap[dateStr] = {
        steps: 0,
        heartRates: [],
        caloriesBurnt: 0,
        distanceMeters: 0,
        sleepDurationMinutes: 0,
        sleepStages: [],
      };
    }
    return dayMap[dateStr];
  };

  const toDateStr = (isoTime) => isoTime?.slice(0, 10); // "YYYY-MM-DD"

  // Steps
  (healthData.Steps || []).forEach((r) => {
    const d = toDateStr(r.startTime);
    if (!d) return;
    const day = ensureDay(d);
    day.steps += r.count || 0;
  });

  // HeartRate
  (healthData.HeartRate || []).forEach((r) => {
    const d = toDateStr(r.startTime);
    if (!d) return;
    const day = ensureDay(d);
    (r.samples || []).forEach((s) => {
      if (s.beatsPerMinute != null) day.heartRates.push(s.beatsPerMinute);
    });
  });

  // Active Calories
  (healthData.ActiveCaloriesBurned || []).forEach((r) => {
    const d = toDateStr(r.startTime);
    if (!d) return;
    const day = ensureDay(d);
    day.caloriesBurnt += r.energy?.inKilocalories || 0;
  });

  // Total Calories (fallback if active not present)
  (healthData.TotalCaloriesBurned || []).forEach((r) => {
    const d = toDateStr(r.startTime);
    if (!d) return;
    const day = ensureDay(d);
    // Only add if no active calories recorded for that day
    // (to avoid double counting — we'll handle this below)
  });

  // Distance
  (healthData.Distance || []).forEach((r) => {
    const d = toDateStr(r.startTime);
    if (!d) return;
    const day = ensureDay(d);
    day.distanceMeters += r.distance?.inMeters || 0;
  });

  // Sleep
  (healthData.SleepSession || []).forEach((r) => {
    const d = toDateStr(r.startTime);
    if (!d) return;
    const day = ensureDay(d);
    const startMs = new Date(r.startTime).getTime();
    const endMs = new Date(r.endTime).getTime();
    if (!isNaN(startMs) && !isNaN(endMs)) {
      day.sleepDurationMinutes += Math.round((endMs - startMs) / 60000);
    }
    if (r.stages && r.stages.length > 0) {
      day.sleepStages.push(...r.stages);
    }
  });

  // Finalize — convert heartRates array to avg/min/max
  const result = {};
  for (const [date, d] of Object.entries(dayMap)) {
    const hrs = d.heartRates;
    result[date] = {
      steps: d.steps || null,
      heartRateAvg: hrs.length ? Math.round(hrs.reduce((a, b) => a + b, 0) / hrs.length) : null,
      heartRateMin: hrs.length ? Math.min(...hrs) : null,
      heartRateMax: hrs.length ? Math.max(...hrs) : null,
      caloriesBurnt: d.caloriesBurnt || null,
      distanceMeters: d.distanceMeters || null,
      sleepDurationMinutes: d.sleepDurationMinutes || null,
      sleepStages: d.sleepStages.length > 0 ? d.sleepStages : null,
    };
  }

  return result;
}

/**
 * POST /api/health/sync
 * Headers: Authorization: Bearer <token>
 * Body: { healthData: { Steps: [...], HeartRate: [...], ... } }
 * Returns: { synced: number, message: string }
 */
router.post('/sync', authenticateToken, async (req, res) => {
  try {
    const patientId = req.user.id;
    const { healthData } = req.body;

    if (!healthData || typeof healthData !== 'object') {
      return res.status(400).json({ error: 'healthData object is required.' });
    }

    const dailyData = aggregateByDay(healthData);
    const dates = Object.keys(dailyData);

    if (dates.length === 0) {
      return res.json({ synced: 0, message: 'No data to sync.' });
    }

    let synced = 0;

    for (const metricDate of dates) {
      const d = dailyData[metricDate];

      // Check if a record already exists for this patient+date
      const existing = await db
        .select({ id: healthMetrics.id })
        .from(healthMetrics)
        .where(
          and(
            eq(healthMetrics.patientId, patientId),
            eq(healthMetrics.metricDate, metricDate)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        // Update existing record
        await db
          .update(healthMetrics)
          .set({
            steps: d.steps,
            heartRateAvg: d.heartRateAvg,
            heartRateMin: d.heartRateMin,
            heartRateMax: d.heartRateMax,
            caloriesBurnt: d.caloriesBurnt?.toFixed(2),
            distanceMeters: d.distanceMeters?.toFixed(2),
            sleepDurationMinutes: d.sleepDurationMinutes,
            sleepStages: d.sleepStages,
            source: 'HEALTH_CONNECT',
            syncedAt: new Date(),
          })
          .where(
            and(
              eq(healthMetrics.patientId, patientId),
              eq(healthMetrics.metricDate, metricDate)
            )
          );
      } else {
        // Insert new record
        await db.insert(healthMetrics).values({
          patientId,
          steps: d.steps,
          heartRateAvg: d.heartRateAvg,
          heartRateMin: d.heartRateMin,
          heartRateMax: d.heartRateMax,
          caloriesBurnt: d.caloriesBurnt?.toFixed(2),
          distanceMeters: d.distanceMeters?.toFixed(2),
          sleepDurationMinutes: d.sleepDurationMinutes,
          sleepStages: d.sleepStages,
          metricDate,
          source: 'HEALTH_CONNECT',
        });
      }

      synced++;
    }

    return res.json({
      synced,
      message: `Successfully synced ${synced} day(s) of health data.`,
    });
  } catch (err) {
    console.error('[Health Sync Error]', err);
    return res.status(500).json({ error: 'Internal server error during sync.' });
  }
});

export default router;
