-- Migration: Add tasks, task_history tables + new enums + diet_plans.doctor_id
-- Run this directly against the database

-- ==========================================
-- 1. New Enums
-- ==========================================

DO $$ BEGIN
  CREATE TYPE task_type AS ENUM ('task_based', 'goal_based');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE goal_metric AS ENUM ('daily_steps', 'calories_burn', 'min_sleep');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ==========================================
-- 2. Add doctor_id to existing diet_plans
-- ==========================================

ALTER TABLE diet_plans
  ADD COLUMN IF NOT EXISTS doctor_id UUID REFERENCES doctor_profiles(id) ON DELETE SET NULL;

-- ==========================================
-- 3. Create tasks table
-- ==========================================

CREATE TABLE IF NOT EXISTS tasks (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id           UUID NOT NULL REFERENCES doctor_profiles(id) ON DELETE CASCADE,
  patient_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_type           task_type NOT NULL,
  -- task_based only
  task_name           VARCHAR(255),
  -- goal_based only
  goal_metric         goal_metric,
  goal_target         NUMERIC(10, 2),
  freq_interval_days  INTEGER,
  -- common
  task_description    TEXT,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ==========================================
-- 4. Create task_history table
-- ==========================================

CREATE TABLE IF NOT EXISTS task_history (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id       UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  period_date   DATE NOT NULL,
  is_done       BOOLEAN NOT NULL DEFAULT FALSE,
  actual_value  NUMERIC(10, 2),
  recorded_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Unique constraint so we don't double-insert same task + period
CREATE UNIQUE INDEX IF NOT EXISTS unq_task_history_task_period
  ON task_history (task_id, period_date);
