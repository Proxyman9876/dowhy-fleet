-- Links a maintenance schedule to a specific vehicle with tracking data

CREATE TABLE vehicle_maintenance_schedules (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id             UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  schedule_id            UUID NOT NULL REFERENCES maintenance_schedules(id) ON DELETE CASCADE,
  last_performed_at      TIMESTAMPTZ,
  last_performed_mileage INTEGER,
  last_performed_hours   NUMERIC(10,1),
  next_due_mileage       INTEGER,
  next_due_hours         NUMERIC(10,1),
  next_due_date          DATE,
  cached_status          maintenance_status NOT NULL DEFAULT 'ok',
  custom_due_soon_pct    NUMERIC(4,2),
  is_active              BOOLEAN NOT NULL DEFAULT true,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_vehicle_schedule UNIQUE (vehicle_id, schedule_id)
);

CREATE INDEX idx_vms_vehicle ON vehicle_maintenance_schedules(vehicle_id);
CREATE INDEX idx_vms_status ON vehicle_maintenance_schedules(cached_status)
  WHERE cached_status IN ('overdue', 'due_soon');
