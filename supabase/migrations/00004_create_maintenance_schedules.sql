-- Maintenance schedule templates (e.g. "Oil Change every 5000 miles")

CREATE TABLE maintenance_schedules (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT NOT NULL,
  description    TEXT,
  interval_miles INTEGER,
  interval_hours NUMERIC(10,1),
  interval_days  INTEGER,
  due_soon_pct   NUMERIC(4,2) NOT NULL DEFAULT 10.00,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_at_least_one_interval CHECK (
    interval_miles IS NOT NULL OR interval_hours IS NOT NULL OR interval_days IS NOT NULL
  )
);
